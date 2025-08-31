# 📝 Sistema de Logging - El Cronista del Framework

## ¿Qué es el Logger?

El **Logger** es como un **cronista medieval** que registra meticulosamente todo lo que pasa durante las evaluaciones. Imagina un escribano que anota:

- **🎬 Cuándo empezó cada evaluación** → Evento de inicio
- **❓ Cada pregunta que se hizo** → Evento de sampling  
- **📊 Cada calificación que se dio** → Evento de métricas
- **🏁 Cuándo y cómo terminó** → Evento final

**¿Por qué es importante?**
- **🔍 Debugging** → Si algo sale mal, puedes ver exactamente qué pasó
- **📈 Análisis posterior** → Estudiar patrones y tendencias
- **🔄 Reproducibilidad** → Volver a analizar los mismos datos
- **📊 Auditoría** → Trazabilidad completa de cada evaluación

## 📚 Tipos de Eventos que Registra

### 1. 🎬 Evento 'spec' - Especificación Inicial
```json
{
  "run_id": "20241231143045AB12CD",
  "event_id": 0,
  "type": "spec",
  "data": {
    "eval_name": "math-basic",
    "model": "gpt-4",
    "config": { /* configuración de la evaluación */ },
    "options": { /* opciones de ejecución */ },
    "started_at": "2024-12-31T14:30:45.123Z"
  },
  "created_at": "2024-12-31T14:30:45.123Z"
}
```

**Es como:** El cronista escribiendo "Hoy, 31 de diciembre, iniciamos la evaluación de matemáticas básicas con GPT-4..."

### 2. 🤖 Evento 'sampling' - Respuesta del Modelo
```json
{
  "run_id": "20241231143045AB12CD", 
  "event_id": 1,
  "sample_id": "sample_0",
  "type": "sampling",
  "data": {
    "input": [{"role": "user", "content": "¿Cuánto es 2+3?"}],
    "completion": "La respuesta es 5",
    "usage": {
      "prompt_tokens": 8,
      "completion_tokens": 4,
      "total_tokens": 12
    }
  },
  "created_at": "2024-12-31T14:30:47.456Z"
}
```

**Es como:** "El modelo respondió '5' a la pregunta '¿Cuánto es 2+3?', usando 12 tokens en total."

### 3. 📊 Evento 'metrics' - Evaluación de la Respuesta
```json
{
  "run_id": "20241231143045AB12CD",
  "event_id": 2, 
  "sample_id": "sample_0",
  "type": "metrics",
  "data": {
    "score": 1.0,
    "passed": true,
    "reasoning": "La respuesta '5' coincide exactamente con el ideal '5'"
  },
  "created_at": "2024-12-31T14:30:47.789Z"
}
```

**Es como:** "Calificamos la respuesta con 1.0 porque es perfectamente correcta."

### 4. 🏁 Evento 'final_report' - Resumen Final
```json
{
  "run_id": "20241231143045AB12CD",
  "event_id": 201,
  "type": "final_report", 
  "data": {
    "total_samples": 100,
    "correct": 87,
    "incorrect": 13,
    "score": 0.87
  },
  "created_at": "2024-12-31T14:35:23.456Z"
}
```

**Es como:** "Al final de la evaluación: 87 respuestas correctas de 100, puntuación final: 87%."

## 🏗️ Arquitectura del Logger

```typescript
export class Logger {
  private events: Map<string, LogEvent[]> = new Map();
  //                   ^         ^
  //                run_id    eventos de esa ejecución
}
```

**Es como:** Un archivero donde cada cajón tiene una etiqueta (run_id) y contiene todos los documentos de esa evaluación específica.

### Flujo de Trabajo:

```typescript
// 1. 📝 Registrar evento
await logger.logEvent({
  run_id: 'ABC123',
  event_id: 1,
  type: 'sampling',
  data: { /* detalles */ }
});

// 2. 💾 Guardar a archivo al final
await logger.saveToFile('mi-evaluacion.jsonl', 'ABC123');

// 3. 📖 Cargar después para análisis
await logger.loadFromFile('mi-evaluacion.jsonl');

// 4. 📊 Obtener resumen
const resumen = logger.getSummary('ABC123');
```

## 📁 Formato JSONL - Línea por Línea

Los logs se guardan en formato **JSONL** (JSON Lines):

```jsonl
{"run_id":"ABC123","event_id":0,"type":"spec","data":{...},"created_at":"2024-12-31T14:30:45.123Z"}
{"run_id":"ABC123","event_id":1,"type":"sampling","sample_id":"sample_0","data":{...},"created_at":"2024-12-31T14:30:47.456Z"}
{"run_id":"ABC123","event_id":2,"type":"metrics","sample_id":"sample_0","data":{...},"created_at":"2024-12-31T14:30:47.789Z"}
```

**¿Por qué JSONL?**
- **📈 Escalable** → Puedes procesar archivos gigantes línea por línea
- **🔄 Streamable** → Puedes leer mientras se está escribiendo
- **🛠️ Estándar** → Compatible con herramientas de análisis de datos
- **🔍 Fácil de grep** → `grep "sample_5" mi-log.jsonl`

## 🛠️ Funcionalidades Principales

### 1. 📝 Registro de Eventos
```typescript
async logEvent(event: LogEvent): Promise<void> {
  // Obtener lista de eventos para este run_id
  const runEvents = this.events.get(event.run_id) || [];
  
  // Agregar nuevo evento
  runEvents.push(event);
  
  // Guardar de vuelta en el Map
  this.events.set(event.run_id, runEvents);
}
```

**Es como:** Agregar una nueva página al cuaderno de notas de una evaluación específica.

### 2. 💾 Guardar a Archivo
```typescript
async saveToFile(filePath: string, runId?: string): Promise<void> {
  // Crear directorio si no existe
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Obtener eventos a guardar
  let allEvents: LogEvent[] = [];
  if (runId) {
    allEvents = this.getEvents(runId);        // Solo una ejecución
  } else {
    for (const events of this.events.values()) {
      allEvents.push(...events);              // Todas las ejecuciones
    }
  }

  // Ordenar cronológicamente
  allEvents.sort((a, b) => {
    if (a.run_id !== b.run_id) {
      return a.run_id.localeCompare(b.run_id);  // Por run_id primero
    }
    return a.event_id - b.event_id;             // Por event_id después
  });

  // Convertir a JSONL y guardar
  const jsonlContent = allEvents
    .map(event => JSON.stringify(event))
    .join('\n');
  
  fs.writeFileSync(filePath, jsonlContent);
}
```

### 3. 📖 Cargar desde Archivo
```typescript
async loadFromFile(filePath: string): Promise<void> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;  // Saltar líneas vacías
    
    try {
      const event = JSON.parse(line) as LogEvent;
      await this.logEvent(event);  // Restaurar en memoria
    } catch (error) {
      console.warn(`Failed to parse log line: ${line}`);
    }
  }
}
```

**Es como:** Leer un libro de crónicas y restaurar todos los eventos en tu memoria.

## 📊 Análisis de Logs

### 1. 📈 Resumen de Estadísticas
```typescript
getSummary(runId: string) {
  const events = this.getEvents(runId);
  
  // Buscar evento de reporte final (más preciso)
  const finalReportEvent = events.find(e => e.type === 'final_report');
  if (finalReportEvent) {
    return finalReportEvent.data;
  }
  
  // Si no hay reporte final, calcular desde eventos individuales
  const metricsEvents = events.filter(e => e.type === 'metrics');
  const total_samples = metricsEvents.length;
  const correct = metricsEvents.filter(e => e.data.passed === true).length;
  
  return {
    total_samples,
    correct,
    incorrect: total_samples - correct,
    score: total_samples > 0 ? correct / total_samples : 0
  };
}
```

### 2. 📁 Generación Automática de Nombres
```typescript
static generateLogPath(runId: string, model: string, evalName: string): string {
  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const logsDir = path.join(process.cwd(), 'logs');
  
  // Sanitizar nombres para Windows (reemplazar caracteres problemáticos)
  const sanitizedModel = model.replace(/[:<>"|?*]/g, '-').replace(/\//g, '-');
  const sanitizedEval = evalName.replace(/[:<>"|?*]/g, '-');
  
  // Generar: logs/ABC123_gpt-4_math-basic.jsonl
  return path.join(logsDir, `${runId}_${sanitizedModel}_${sanitizedEval}.jsonl`);
}
```

**Resultado:** `logs/20241231143045AB12CD_gpt-4_math-basic.jsonl`

## 💡 Casos de Uso Prácticos

### 🔍 Debugging - Encontrar el Problema

```typescript
import { Logger } from './logger';

async function debugearEvaluacion() {
  const logger = new Logger();
  
  // 1. Cargar logs de evaluación problemática
  await logger.loadFromFile('logs/evaluacion-fallida.jsonl');
  
  // 2. Obtener eventos de un run específico
  const eventos = logger.getEvents('ABC123');
  
  // 3. Buscar errores o comportamientos extraños
  const errores = eventos.filter(e => 
    e.data.error || 
    (e.type === 'metrics' && e.data.passed === false)
  );
  
  console.log(`Encontrados ${errores.length} errores:`);
  errores.forEach(error => {
    console.log(`- Sample ${error.sample_id}: ${error.data.reasoning}`);
  });
  
  // 4. Analizar patrones de fallo
  const fallosSemanticos = eventos.filter(e => 
    e.type === 'metrics' && 
    e.data.reasoning?.includes('semantic')
  );
  
  console.log(`${fallosSemanticos.length} fallos semánticos encontrados`);
}
```

### 📊 Análisis de Rendimiento

```typescript
async function analizarRendimiento() {
  const logger = new Logger();
  await logger.loadFromFile('logs/evaluacion-completa.jsonl');
  
  const eventos = logger.getEvents('ABC123');
  
  // Analizar tiempos entre eventos
  const samplingEvents = eventos.filter(e => e.type === 'sampling');
  const tiempos = [];
  
  for (let i = 1; i < samplingEvents.length; i++) {
    const anterior = new Date(samplingEvents[i-1].created_at).getTime();
    const actual = new Date(samplingEvents[i].created_at).getTime();
    tiempos.push(actual - anterior);
  }
  
  const tiempoPromedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
  
  console.log(`Tiempo promedio entre muestras: ${tiempoPromedio}ms`);
  
  // Analizar uso de tokens
  const tokensUsados = samplingEvents.map(e => e.data.usage?.total_tokens || 0);
  const tokensPromedio = tokensUsados.reduce((a, b) => a + b, 0) / tokensUsados.length;
  
  console.log(`Tokens promedio por muestra: ${tokensPromedio}`);
}
```

### 📈 Comparación Histórica

```typescript
async function compararEvaluaciones() {
  const logger1 = new Logger();
  const logger2 = new Logger();
  
  await logger1.loadFromFile('logs/evaluacion-version1.jsonl');
  await logger2.loadFromFile('logs/evaluacion-version2.jsonl');
  
  const resumen1 = logger1.getSummary('RUN1');
  const resumen2 = logger2.getSummary('RUN2');
  
  console.log('Comparación de versiones:');
  console.table([
    { 
      version: 'V1', 
      accuracy: (resumen1.score * 100).toFixed(2) + '%',
      samples: resumen1.total_samples
    },
    { 
      version: 'V2', 
      accuracy: (resumen2.score * 100).toFixed(2) + '%',
      samples: resumen2.total_samples
    }
  ]);
  
  const mejora = (resumen2.score - resumen1.score) * 100;
  console.log(`Mejora: ${mejora.toFixed(2)} puntos porcentuales`);
}
```

## 🎯 Ejemplo de Análisis con Herramientas Externas

### 📊 Con jq (herramienta de línea de comandos):

```bash
# Obtener todas las puntuaciones
jq -r 'select(.type == "metrics") | .data.score' evaluacion.jsonl

# Promedio de puntuación
jq -r 'select(.type == "metrics") | .data.score' evaluacion.jsonl | awk '{sum += $1; count++} END {print sum/count}'

# Contar fallos por tipo
jq -r 'select(.type == "metrics" and .data.passed == false) | .data.reasoning' evaluacion.jsonl | sort | uniq -c

# Uso de tokens por muestra
jq -r 'select(.type == "sampling") | .data.usage.total_tokens' evaluacion.jsonl
```

### 🐍 Con Python pandas:

```python
import pandas as pd
import json

# Cargar logs
logs = []
with open('evaluacion.jsonl', 'r') as f:
    for line in f:
        logs.append(json.loads(line))

df = pd.DataFrame(logs)

# Análisis de métricas
metrics_df = df[df['type'] == 'metrics']
print(f"Accuracy promedio: {metrics_df['data'].apply(lambda x: x['score']).mean():.2%}")

# Análisis de tokens
sampling_df = df[df['type'] == 'sampling'] 
token_usage = sampling_df['data'].apply(lambda x: x.get('usage', {}).get('total_tokens', 0))
print(f"Tokens promedio: {token_usage.mean():.0f}")

# Gráfica de evolución de puntuaciones
import matplotlib.pyplot as plt
scores = metrics_df['data'].apply(lambda x: x['score'])
plt.plot(scores.values)
plt.title('Evolución de Puntuaciones')
plt.xlabel('Muestra')
plt.ylabel('Score')
plt.show()
```

## 🚨 Mejores Prácticas

### ✅ Qué Hacer

1. **📁 Siempre especificar log_to_file** → Para poder analizar después
2. **🏷️ Usar nombres descriptivos** → Incluir fecha, modelo, evaluación
3. **💾 Guardar logs en control de versiones** → Para comparaciones históricas
4. **📊 Analizar logs periódicamente** → Detectar patrones y problemas
5. **🧹 Limpiar logs antiguos** → Evitar que crezcan indefinidamente

### ❌ Qué Evitar

1. **🚫 No guardar información sensible** → API keys, datos personales
2. **🚫 No ignorar errores de parsing** → Pueden indicar problemas
3. **🚫 No acumular logs gigantes** → Implementar rotación
4. **🚫 No usar en código crítico sin try/catch** → El logging no debe romper la evaluación

## 🎓 Puntos Clave para Recordar

1. **El Logger es tu caja negra** → Registra todo para análisis posterior
2. **JSONL permite análisis escalable** → Una línea = un evento
3. **Los run_id agrupan eventos** → Cada evaluación tiene su cronología
4. **Los event_id mantienen orden** → Secuencia cronológica dentro de cada run
5. **Los logs son para debugging Y análisis** → No solo cuando hay problemas
6. **La estructura consistente facilita herramientas** → jq, pandas, etc.

**¡Siguiente paso:** Vamos a ver la interfaz de línea de comandos que une todo! 🖥️
