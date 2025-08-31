# 🎭 Ejecutor de Evaluaciones - El Director de Orquesta

## ¿Qué es el Ejecutor de Evaluaciones?

El **EvalRunner** es como el **director de una orquesta sinfónica**. No toca ningún instrumento, pero **coordina a todos los músicos** para crear una sinfonía perfecta.

En este caso, los "músicos" son:
- 🤖 **Clientes LLM** → Los que hablan con la IA
- 📊 **Cargador de datos** → El que trae las preguntas
- 🧪 **Templates de evaluación** → Los que califican las respuestas
- 💾 **Sistema de caché** → El que ahorra dinero
- 📈 **Métricas personalizadas** → Los que miden la calidad
- 🗄️ **Base de datos** → El que guarda todo

## 🏗️ Arquitectura del EvalRunner

### Los Componentes Internos
```typescript
export class EvalRunner {
  private registry: Registry;           // 📋 Catálogo de evaluaciones
  private logger: Logger;               // 📝 Sistema de logs  
  private costManager: CostManager;     // 💰 Calculadora de costos
  private cache: EvaluationCache;       // ⚡ Sistema de caché
  private metricsRegistry: MetricsRegistry; // 📊 Registro de métricas
  private store: EvaluationStore;       // 🗄️ Base de datos
}
```

**Es como un director que tiene:**
- **📋 La partitura** (registry) → Sabe qué música tocar
- **📝 El cuaderno de notas** (logger) → Registra todo lo que pasa
- **💰 El contador** (costManager) → Lleva la cuenta de los gastos
- **⚡ La memoria** (cache) → Recuerda lo que ya se hizo
- **📊 Los críticos** (metricsRegistry) → Evalúan la calidad
- **🗄️ El archivo** (store) → Guarda las grabaciones

## 🎵 La Sinfonía de una Evaluación

### Acto 1: 📋 Preparación (Setup)
```typescript
async runEval(options: RunOptions): Promise<EvalReport>
```

**¿Qué pasa en la preparación?**

1. **🎬 Generar ID único de ejecución**
```typescript
const runId = this.generateRunId();
// Ejemplo: "20241231143045AB12CD"
```

2. **📋 Cargar configuración de la evaluación**
```typescript
const config = this.registry.getConfig(options.eval);
// Obtiene: tipo de evaluación, parámetros, datasets, etc.
```

3. **📊 Cargar dataset de preguntas**
```typescript
const dataset = await loadDataset(datasetPath);
const samples = options.max_samples 
  ? dataset.samples.slice(0, options.max_samples)  // Limitar si es necesario
  : dataset.samples;
```

4. **🤖 Crear cliente LLM**
```typescript
const llmClient = createLLMClient(options.model, options.timeout);
// Ejemplo: Cliente para GPT-4 con timeout de 60 segundos
```

### Acto 2: 🧪 Ejecución (El Bucle Principal)

**Para cada pregunta del dataset:**

```typescript
for (let i = 0; i < samples.length; i++) {
  const sample = samples[i];
  
  // 💾 1. Verificar caché primero (ahorrar dinero)
  let completion = await this.cache.getCachedResult(model, sample, options);
  
  if (completion) {
    console.log('💾 Cache hit! - No pagamos por esta pregunta');
  } else {
    // 💸 2. Preguntar al modelo (esto cuesta dinero)
    completion = await llmClient.complete(sample.input, completionOptions);
    
    // 💾 3. Guardar en caché para la próxima vez
    await this.cache.setCachedResult(model, sample, options, completion);
  }
  
  // 🧪 4. Evaluar la respuesta
  const result = await template.evaluate(sample, completion);
  results.push(result);
  
  // 📝 5. Registrar todo lo que pasó
  await this.logger.logEvent({
    type: 'sampling',
    data: { input: sample.input, completion: completion.content }
  });
}
```

### Acto 3: 📊 Análisis Final

```typescript
// 📊 Calcular métricas básicas
const totalSamples = results.length;
const correct = results.filter(r => r.passed).length;
const score = correct / totalSamples;

// 💰 Calcular costos
const tokenUsage = this.calculateTokenUsage(options.model, results);

// 📈 Calcular métricas personalizadas
const customMetrics = await this.metricsRegistry.calculateAllMetrics(results, report);
```

## 🎯 Funciones Especiales del EvalRunner

### 1. 🏃‍♂️ Modo Dry Run (Simulación)

```typescript
if (options.dry_run) {
  console.log('[DRY RUN] Sample 1:');
  console.log('  Input: "¿Cuánto es 2+2?"');
  console.log('  Expected: "4"');
  // ✅ No hace peticiones reales a la API
  // ✅ No gasta dinero  
  // ✅ Te muestra qué va a pasar
}
```

**¿Cuándo usar dry run?**
- **🔍 Verificar que el dataset está bien** antes de gastar dinero
- **⚙️ Probar configuraciones** nuevas sin riesgo
- **📊 Estimar costos** antes de ejecutar

### 2. ⚡ Sistema de Caché Inteligente

```typescript
// 🔑 Clave de caché: modelo + pregunta + configuración
const cacheKey = {
  model: 'gpt-4',
  input: [{"role": "user", "content": "¿Cuánto es 2+2?"}],
  options: { temperature: 0.0, max_tokens: 10 }
};

// 💾 Si ya hicimos esta pregunta exacta antes...
if (cache.has(cacheKey)) {
  return cache.get(cacheKey);  // ✅ ¡Gratis!
} else {
  const result = await llm.complete(...);  // 💸 Pagamos
  cache.set(cacheKey, result);  // 💾 Guardamos para la próxima
  return result;
}
```

**Beneficios del caché:**
- **💰 Ahorro de dinero** → No pagas dos veces por la misma pregunta
- **⚡ Velocidad** → Respuesta instantánea para preguntas repetidas
- **🧪 Reproducibilidad** → Mismos resultados en múltiples ejecuciones

### 3. 📊 Indicadores de Progreso Inteligentes

```typescript
// Modo normal (limpio)
Progress: 15/100

// Modo verbose (detallado)  
Progress: 15/100 (15%)
✅ Sample 15 - Score: 0.85 - PASS
   Reasoning: La respuesta '4' coincide exactamente con el ideal '4'
💾 Cache hit for sample 16
```

### 4. 🚨 Manejo Robusto de Errores

```typescript
try {
  const completion = await llmClient.complete(sample.input);
  const result = await template.evaluate(sample, completion);
} catch (error) {
  console.error(`❌ Error evaluating sample ${i + 1}: API timeout`);
  
  // ✅ No se rompe todo, crea un resultado de error
  const failedResult = {
    sample_id: `sample_${i}`,
    score: 0,
    passed: false,
    reasoning: 'Evaluation error: API timeout',
    metadata: { error: true }
  };
  results.push(failedResult);
}
```

## 💰 Calculadora de Costos Integrada

```typescript
private calculateTokenUsage(model: string, results: EvalResult[]): TokenUsage {
  // 📊 Recopilar estadísticas
  const totalPromptTokens = results.reduce(/* suma todos los tokens de prompt */);
  const totalCompletionTokens = results.reduce(/* suma todos los tokens de respuesta */);
  
  // 💰 Calcular costos usando el CostManager
  const totalCost = results.reduce((sum, result) => {
    return sum + this.costManager.calculateCompletionCost(model, result.completion);
  }, 0);
  
  // 📈 Calcular estadísticas útiles
  return {
    total_tokens: totalPromptTokens + totalCompletionTokens,
    average_tokens_per_sample: Math.round(totalTokens / results.length),
    estimated_cost: totalCost,
    cost_breakdown: {
      prompt_cost: promptCost,        // Costo de las preguntas
      completion_cost: completionCost // Costo de las respuestas
    }
  };
}
```

## 📊 Reporte Final Detallado

```text
==================================================
🎯 Final Results:
   Total samples: 100
   Correct: 87
   Incorrect: 13
   Accuracy: 87.00%
   Duration: 45.32s

📊 Token Usage:
   • Prompt tokens: 12,450
   • Completion tokens: 3,280
   • Total tokens: 15,730
   • Avg tokens/sample: 157

💰 Estimated Cost:
   • Total: $0.2359
   • Prompt cost: $0.1245
   • Completion cost: $0.1114
   • Cost per sample: $0.0024

📈 Custom Metrics:
   🎯 ACCURACY:
      ↗️ Response Consistency: 94.2%
         Measures how consistent responses are across similar inputs
   ⚡ EFFICIENCY:  
      ↙️ Token Efficiency: 157 tokens/sample
         Lower is better - measures conciseness of responses
   💰 COST:
      ↙️ Cost Efficiency: $0.0024/sample
         Lower is better - cost per evaluation sample

💾 Cache Performance:
   • Requests: 100
   • Hits: 23
   • Hit rate: 23.0%
   • Est. tokens saved: 3,611
==================================================
💾 Evaluation results saved to database
```

## 🎓 Ejemplo Práctico Completo

```typescript
import { EvalRunner } from './eval-runner';

async function ejemploCompleto() {
  // 1. 🏗️ Crear el ejecutor
  const runner = new EvalRunner('./mi-registry.yaml', {
    enabled: true,        // Habilitar caché
    provider: 'redis',    // Usar Redis para caché compartido
    ttl_seconds: 3600     // Caché válido por 1 hora
  });

  // 2. 🚀 Ejecutar evaluación
  const report = await runner.runEval({
    model: 'gpt-4',                    // Modelo a evaluar
    eval: 'matematicas-basicas',       // Evaluación a usar
    max_samples: 50,                   // Solo 50 preguntas para probar
    temperature: 0.0,                  // Respuestas determinísticas  
    max_tokens: 10,                    // Respuestas cortas
    timeout: 30000,                    // 30 segundos de timeout
    verbose: true,                     // Mostrar progreso detallado
    log_to_file: 'mi-evaluacion.jsonl', // Guardar logs
    custom_metrics: ['cost-efficiency', 'token-efficiency'], // Métricas específicas
    dry_run: false                     // Ejecutar de verdad
  });

  // 3. 📊 Usar los resultados
  console.log(`Puntuación final: ${(report.score * 100).toFixed(2)}%`);
  console.log(`Costo total: $${report.token_usage?.estimated_cost.toFixed(4)}`);
  
  // 4. 🔍 Analizar resultados específicos
  const fallos = report.results.filter(r => !r.passed);
  console.log(`Preguntas que fallaron: ${fallos.length}`);
  
  for (const fallo of fallos.slice(0, 3)) { // Primeros 3 fallos
    console.log(`❌ Pregunta: ${fallo.input[0].content}`);
    console.log(`   Esperado: ${fallo.ideal}`);
    console.log(`   Obtuvo: ${fallo.completion.content}`);
    console.log(`   Razón: ${fallo.reasoning}`);
  }
}
```

## 🎯 Casos de Uso Reales

### 🧪 Evaluación de Desarrollo
```typescript
// Para desarrolladores: prueba rápida y barata
const reportDev = await runner.runEval({
  model: 'gpt-3.5-turbo',  // Modelo más barato
  eval: 'mi-evaluacion',
  max_samples: 10,         // Solo 10 muestras
  dry_run: true           // Simulación primero
});
```

### 🚀 Evaluación de Producción  
```typescript
// Para producción: evaluación completa
const reportProd = await runner.runEval({
  model: 'gpt-4',
  eval: 'evaluacion-completa',
  // max_samples: undefined,  // Todas las muestras
  temperature: 0.0,        // Determinístico
  verbose: false,          // Output limpio
  custom_metrics: ['all'], // Todas las métricas
  log_to_file: `prod-eval-${new Date().toISOString()}.jsonl`
});
```

### 📊 Comparación de Modelos
```typescript
// Evaluar múltiples modelos con el mismo dataset
const modelos = ['gpt-3.5-turbo', 'gpt-4', 'claude-3-sonnet'];
const reportes = [];

for (const modelo of modelos) {
  const reporte = await runner.runEval({
    model: modelo,
    eval: 'comparacion-modelos',
    max_samples: 100,
    temperature: 0.0
  });
  reportes.push(reporte);
}

// Comparar resultados
const comparison = reportes.map(r => ({
  modelo: r.model,
  puntuacion: r.score,
  costo: r.token_usage?.estimated_cost || 0,
  eficiencia: r.score / (r.token_usage?.estimated_cost || 1)
}));

console.table(comparison);
```

## 🚨 Puntos Importantes a Recordar

### ✅ Mejores Prácticas
1. **🧪 Siempre usar dry_run primero** → Evita sorpresas costosas
2. **💾 Habilitar caché para desarrollo** → Ahorra tiempo y dinero
3. **📊 Usar verbose en desarrollo** → Entiende qué está pasando
4. **🎯 Limitar samples al desarrollar** → Iteración más rápida
5. **📝 Siempre especificar log_to_file** → Para debugging y análisis

### ⚠️ Cuidados Importantes
1. **💰 Los costos se acumulan rápido** → Monitorea el token usage
2. **⏱️ Los timeouts deben ser realistas** → Especialmente para modelos locales
3. **🔄 El caché puede usar mucha memoria** → Configura límites apropiados
4. **📊 Las métricas personalizadas toman tiempo** → Pueden agregar latencia

### 🐛 Problemas Comunes
- **"Registry not found"** → Verifica la ruta al archivo de configuración
- **"Model not supported"** → Verifica que el modelo esté disponible
- **"Cache connection failed"** → Verifica que Redis esté corriendo
- **"API timeout"** → Aumenta el timeout o usa un modelo más rápido

**¡Siguiente paso:** Vamos a ver cómo funciona el Registry, el catálogo de configuraciones! 📋
