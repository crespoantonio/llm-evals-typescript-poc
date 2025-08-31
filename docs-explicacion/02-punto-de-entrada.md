# 🚪 Punto de Entrada - La Puerta Principal del Framework

## ¿Qué es el archivo `index.ts`?

El archivo `index.ts` es como **la puerta principal de una empresa**: es el primer lugar que visitas y desde donde puedes acceder a todos los departamentos.

En programación, este archivo se llama el **"punto de entrada"** porque:
- Es **lo primero que se carga** cuando alguien usa tu framework
- **Organiza y expone** todas las funcionalidades importantes
- Actúa como un **menú principal** de todo lo que está disponible

## 📋 ¿Qué hace exactamente?

### 1. 🌍 Carga las variables de entorno
```typescript
import 'dotenv/config';
```

**¿Qué es esto?**
Es como **abrir la caja fuerte** donde guardas información secreta:
- Claves de API (como tu contraseña de OpenAI)
- Configuraciones del sistema
- URLs de bases de datos

**¿Por qué es importante?**
Las APIs de IA cuestan dinero, así que necesitas una "llave" (API key) para usarlas. Esta línea busca esas llaves en un archivo llamado `.env`.

### 2. 📤 Exporta los tipos fundamentales
```typescript
export * from './types';
```

**¿Qué significa "exportar"?**
Es como **poner productos en el escaparate de una tienda**. Cuando exportas algo, lo haces disponible para que otros archivos lo puedan usar.

Esto significa que si alguien instala tu framework, puede usar todos los tipos que definiste:
```typescript
import { ChatMessage, EvalReport } from 'tu-framework';
```

## 🧰 Los Componentes Principales Exportados

### 3. 🏭 Componentes del motor principal
```typescript
export { EvalRunner } from './eval-runner';      // El cerebro que ejecuta todo
export { Registry } from './registry';           // El archivo de configuraciones
export { Logger } from './logger';               // El sistema de logs
```

**Analogía:** Es como exportar **los departamentos principales de tu empresa**:
- **EvalRunner** → El departamento de producción (ejecuta las evaluaciones)
- **Registry** → El departamento de recursos humanos (maneja configuraciones) 
- **Logger** → El departamento de documentación (registra todo lo que pasa)

### 4. 🤖 Clientes para conectarse con IA
```typescript
export { createLLMClient, OpenAIClient } from './llm-client';
```

**¿Qué son los clientes?**
Son como **traductores especializados** que saben hablar con diferentes servicios de IA:
- **OpenAIClient** → Habla específicamente con OpenAI (GPT-4, GPT-3.5)
- **createLLMClient** → Una función que crea el traductor correcto automáticamente

### 5. 📊 Utilidades para manejar datos
```typescript
export { loadDataset, saveDataset, createSampleDataset } from './dataset-loader';
```

**Son como herramientas de oficina**:
- **loadDataset** → Abrir un archivo Excel con preguntas de examen
- **saveDataset** → Guardar resultados en un archivo Excel  
- **createSampleDataset** → Crear un archivo de ejemplo para practicar

### 6. 🧪 Templates de evaluación
```typescript
export { BasicEval } from './templates/basic-eval';
export { ModelGradedEval } from './templates/model-graded-eval';
export { ChoiceBasedEval } from './templates/choice-based-eval';  
export { SemanticSimilarityEval } from './templates/semantic-similarity-eval';
```

**Son como diferentes tipos de exámenes**:
- **BasicEval** → Examen de verdadero/falso (respuesta exacta)
- **ModelGradedEval** → Examen corregido por un profesor de IA
- **ChoiceBasedEval** → Examen de opción múltiple
- **SemanticSimilarityEval** → Examen de comprensión (el significado importa más que las palabras exactas)

### 7. 🧠 Servicios de embeddings (comparación de significado)
```typescript
export { 
  SemanticSimilarityService,      // Servicio principal
  OpenAIEmbeddingsProvider,       // Proveedor de OpenAI
  LocalEmbeddingsProvider,        // Proveedor local
  createEmbeddingsProvider,       // Creador automático
  cosineSimilarity                // Función matemática para comparar
} from './embeddings/embeddings-service';
```

**¿Qué son los embeddings?**
Imagina que tienes que **comparar el significado de dos frases**:
- "El gato está feliz" 
- "El felino se encuentra contento"

Para una computadora, estas frases son completamente diferentes (palabras distintas). Los **embeddings** convierten el texto en números que representan el significado, permitiendo que la computadora entienda que ambas frases significan lo mismo.

### 8. ⚡ Sistema de caché (ahorro de dinero)
```typescript
export { 
  EvaluationCache,           // El sistema de caché
  DEFAULT_CACHE_CONFIG,      // Configuración por defecto
  createEvaluationCache      // Creador de caché
} from './caching/evaluation-cache';
```

**¿Qué es el caché?**
Es como **tener una memoria perfecta**:
- Si ya hiciste una pregunta antes, no la vuelves a hacer (no pagas de nuevo)
- Guarda las respuestas para reutilizarlas
- Te ahorra mucho dinero en APIs

### 9. 📊 Métricas personalizadas
```typescript
export {
  CustomMetric,                    // Clase base para crear métricas
  MetricsRegistry,                 // Registro de todas las métricas
  CostEfficiencyMetric,           // Métrica de eficiencia de costos
  ResponseConsistencyMetric,      // Métrica de consistencia
  TokenEfficiencyMetric,          // Métrica de eficiencia de tokens
  BusinessImpactMetric,           // Métrica de impacto de negocio
  LatencyPercentileMetric,        // Métrica de latencia
  metricsRegistry                 // Instancia global del registro
} from './metrics/custom-metrics';
```

**¿Qué son las métricas personalizadas?**
Son como **diferentes formas de medir el éxito**:
- **CostEfficiencyMetric** → ¿Qué tan barato es este modelo?
- **ResponseConsistencyMetric** → ¿Da respuestas consistentes?
- **TokenEfficiencyMetric** → ¿Usa las palabras de manera eficiente?
- **BusinessImpactMetric** → ¿Qué tan útil es para el negocio?
- **LatencyPercentileMetric** → ¿Qué tan rápido responde?

## 🎯 ¿Por qué está organizado así?

### 1. **Principio de responsabilidad única**
Cada archivo tiene **una sola responsabilidad**:
- `llm-client.ts` → Solo se encarga de hablar con las APIs
- `eval-runner.ts` → Solo ejecuta evaluaciones
- `logger.ts` → Solo maneja logs

### 2. **Facilidad de uso**
Con solo una importación, obtienes todo lo necesario:
```typescript
import { EvalRunner, createLLMClient, BasicEval } from 'mi-framework';

// Ya tienes todo lo que necesitas para empezar
```

### 3. **Modularidad**
Puedes importar solo lo que necesitas:
```typescript
import { TokenAnalyticsService } from 'mi-framework/analytics';
import { EvaluationCache } from 'mi-framework/caching';
```

## 💡 Ejemplo de uso completo

```typescript
import { 
  EvalRunner,           // El motor principal
  createLLMClient,      // Para conectarse con IA
  BasicEval,           // Tipo de evaluación
  loadDataset          // Para cargar datos
} from 'mi-framework';

async function evaluarModelo() {
  // 1. Crear un cliente para hablar con GPT-4
  const client = createLLMClient('openai', 'gpt-4');
  
  // 2. Cargar un conjunto de preguntas
  const dataset = await loadDataset('preguntas-matematicas.jsonl');
  
  // 3. Crear el evaluador
  const runner = new EvalRunner();
  
  // 4. Ejecutar la evaluación
  const reporte = await runner.runEval({
    model: 'gpt-4',
    eval: 'matematicas-basicas'
  });
  
  console.log(`Puntuación: ${reporte.score * 100}%`);
}
```

## 🎓 Puntos clave para recordar

1. **index.ts es la puerta principal** → Todo empieza aquí
2. **Las exportaciones son el menú** → Te dicen qué puedes usar
3. **Cada componente tiene su propósito** → No mezcles responsabilidades  
4. **La organización facilita el mantenimiento** → Cada cosa en su lugar
5. **El usuario final solo ve lo esencial** → La complejidad está oculta

**¡Siguiente paso:** Vamos a ver cómo funciona el cliente LLM, el componente que habla con las APIs de IA! 🤖
