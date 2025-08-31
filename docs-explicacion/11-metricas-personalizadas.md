# 📊 Métricas Personalizadas - Los Analistas Especializados

## ¿Qué son las Métricas Personalizadas?

Las **métricas personalizadas** son como **analistas especializados** que observan diferentes aspectos de las evaluaciones. Imagina un equipo de expertos, cada uno especializado en un área:

- **💰 El Contador** → Analiza eficiencia de costos
- **⚡ El Especialista en Rendimiento** → Mide velocidad y tokens
- **🎯 El Analista de Calidad** → Evalúa consistencia
- **📈 El Estratega de Negocio** → Calcula impacto comercial

Cada métrica **ve los mismos datos desde una perspectiva diferente** y te da insights únicos que la simple puntuación de accuracy no puede proporcionar.

## 🏭 Las Métricas Incluidas

### 1. 💰 CostEfficiencyMetric - El Contador Inteligente

**¿Qué mide?**
Costo promedio por respuesta correcta (no solo por respuesta total)

```typescript
// Fórmula: Costo Total ÷ Respuestas Correctas
Costo por Respuesta Correcta = $0.25 ÷ 85 respuestas correctas = $0.0029
```

**¿Por qué es importante?**
- ✅ Te dice si un modelo más caro vale la pena
- ✅ Compara eficiencia real entre modelos
- ✅ Optimiza presupuesto basado en resultados

**Ejemplo práctico:**
```
Modelo A: $0.002/respuesta correcta + 70% accuracy = $0.0029 por acierto
Modelo B: $0.001/respuesta correcta + 90% accuracy = $0.0011 por acierto

🏆 Modelo B es más eficiente (menor costo por acierto)
```

### 2. ⚡ TokenEfficiencyMetric - El Optimizador de Palabras

**¿Qué mide?**
Promedio de tokens usados por muestra (más bajo = mejor)

```typescript
// Tokens totales ÷ Número de muestras
Token Efficiency = 15,730 tokens ÷ 100 muestras = 157.3 tokens/muestra
```

**¿Por qué es importante?**
- ✅ Identifica modelos "parlanchines" vs concisos
- ✅ Predice costos futuros con precisión
- ✅ Optimiza prompts para eficiencia

**Interpretación:**
```
50-100 tokens/muestra:   🟢 Excelente (respuestas concisas)
100-200 tokens/muestra:  🟡 Bueno (respuestas normales)
200-500 tokens/muestra:  🟠 Regular (algo verboso)
500+ tokens/muestra:     🔴 Mejorable (muy verboso)
```

### 3. 🎯 ResponseConsistencyMetric - El Detector de Patrones

**¿Qué mide?**
Qué tan consistentes son las respuestas del modelo para preguntas similares

```typescript
// Usa embeddings para comparar similitud entre respuestas
// del mismo tipo de pregunta
Consistency = Promedio de similitud entre respuestas del mismo tema
```

**¿Por qué es importante?**
- ✅ Detecta modelos "erráticos" o impredecibles
- ✅ Validación de calidad para producción
- ✅ Identifica problemas con temperatura alta

**Interpretación:**
```
90-100%: 🟢 Muy consistente (perfecto para producción)
80-90%:  🟡 Consistente (aceptable)
70-80%:  🟠 Variable (revisar configuración)
<70%:    🔴 Inconsistente (problema potencial)
```

### 4. 📈 BusinessImpactMetric - El Estratega ROI

**¿Qué mide?**
Impacto de negocio basado en accuracy, costo y velocidad

```typescript
// Fórmula personalizable basada en tus prioridades
Business Impact = (Accuracy × Weight1) - (Cost × Weight2) - (Latency × Weight3)
```

**¿Por qué es importante?**
- ✅ Conecta métricas técnicas con objetivos de negocio
- ✅ Guía decisiones estratégicas
- ✅ Justifica inversiones en modelos mejores

**Ejemplo de configuración:**
```typescript
{
  accuracy_weight: 0.6,    // 60% importancia a precisión
  cost_weight: 0.3,        // 30% importancia a costo
  latency_weight: 0.1,     // 10% importancia a velocidad
  target_accuracy: 0.85,   // Meta de accuracy
  max_cost_per_sample: 0.01 // Límite de costo
}
```

### 5. ⏱️ LatencyPercentileMetric - El Cronómetro Estadístico

**¿Qué mide?**
Distribución de tiempos de respuesta (P50, P95, P99)

```typescript
// P50 = 50% de respuestas son más rápidas que este tiempo
// P95 = 95% de respuestas son más rápidas que este tiempo
{
  p50: 1.2, // seconds  (mediana)
  p95: 3.8, // seconds  (experiencia del 95% de usuarios)
  p99: 8.1  // seconds  (experiencia del 99% de usuarios)
}
```

**¿Por qué es importante?**
- ✅ Identifica outliers de rendimiento
- ✅ SLA y garantías de tiempo de respuesta
- ✅ Comparación real entre modelos

## 🎛️ Configuración de Métricas

### Habilitar/Deshabilitar Métricas

```typescript
import { metricsRegistry } from './metrics/custom-metrics';

// Ver todas las métricas disponibles
const metricas = metricsRegistry.getAllMetrics();
metricas.forEach(m => console.log(m.name, m.enabled));

// Habilitar solo métricas específicas
metricsRegistry.getMetric('cost-efficiency')?.updateConfig({ enabled: true });
metricsRegistry.getMetric('token-efficiency')?.updateConfig({ enabled: true });

// Deshabilitar métricas pesadas para desarrollo
metricsRegistry.getMetric('response-consistency')?.updateConfig({ enabled: false });
```

### Configuración via CLI

```bash
# Usar métricas específicas
llm-eval gpt-4 math-basic --custom-metrics cost-efficiency,token-efficiency

# Deshabilitar métricas por defecto (usar solo las especificadas)
llm-eval gpt-4 math-basic --disable-default-metrics --custom-metrics cost-efficiency
```

### Configuración Personalizada

```typescript
// Personalizar pesos y parámetros
const businessMetric = metricsRegistry.getMetric('business-impact');
businessMetric?.updateConfig({
  enabled: true,
  parameters: {
    accuracy_weight: 0.5,      // Tu empresa valora accuracy 50%
    cost_weight: 0.4,          // Costo es importante 40%  
    latency_weight: 0.1,       // Velocidad menos crítica 10%
    target_accuracy: 0.90,     // Meta alta de accuracy
    max_cost_per_sample: 0.005 // Presupuesto ajustado
  }
});
```

## 📊 Interpretación de Resultados

### Reporte Típico de Métricas

```
📈 Custom Metrics:
   🎯 ACCURACY:
      ↗️ Response Consistency: 94.2%
         Measures how consistent responses are across similar inputs
   
   ⚡ EFFICIENCY:  
      ↙️ Token Efficiency: 157 tokens/sample
         Lower is better - measures conciseness of responses
      ↙️ Latency P95: 2.34s
         95% of responses faster than this
   
   💰 COST:
      ↙️ Cost Efficiency: $0.0024/sample
         Lower is better - cost per evaluation sample
   
   📊 BUSINESS:
      ↗️ Business Impact: 0.847
         Composite score based on your business priorities
```

### 🎯 Cómo Leer las Flechas

- **↗️ (Flecha arriba)** → Higher is better (más alto = mejor)
- **↙️ (Flecha abajo)** → Lower is better (más bajo = mejor)

### 📈 Dashboard de Métricas

```bash
llm-eval dashboard
```

En el dashboard puedes ver:
- **📊 Gráficas de tendencias** → Evolución de métricas en el tiempo
- **🔄 Comparaciones** → Múltiples modelos lado a lado
- **📋 Tablas detalladas** → Todos los números organizados
- **🎯 Alertas** → Cuando métricas salen de rango

## 💡 Casos de Uso Prácticos

### 🧪 Comparación de Modelos

```typescript
// Ejecutar evaluación con múltiples modelos
await runner.runEval({
  model: 'gpt-4',
  eval: 'comparison-test',
  custom_metrics: ['cost-efficiency', 'token-efficiency', 'business-impact']
});

await runner.runEval({
  model: 'gpt-3.5-turbo',
  eval: 'comparison-test', 
  custom_metrics: ['cost-efficiency', 'token-efficiency', 'business-impact']
});

// Resultado:
// GPT-4:         Cost: $0.0089/correct, Tokens: 145/sample, Business: 0.847
// GPT-3.5-Turbo: Cost: $0.0034/correct, Tokens: 127/sample, Business: 0.723
```

### 💰 Optimización de Presupuesto

```typescript
// Configurar métrica para tu presupuesto
const costMetric = metricsRegistry.getMetric('cost-efficiency');
costMetric?.updateConfig({
  threshold: 0.005,  // Máximo $0.005 por respuesta correcta
  parameters: {
    budget_alert: true,
    monthly_budget: 100  // $100/mes
  }
});
```

### 🚀 Monitoreo de Producción

```typescript
// Métricas críticas para producción
const productionMetrics = [
  'response-consistency',  // Calidad consistente
  'latency-percentile',   // Rendimiento UX
  'cost-efficiency'       // Control de gastos
];

await runner.runEval({
  model: 'production-model',
  eval: 'production-suite',
  custom_metrics: productionMetrics,
  verbose: false  // Solo métricas importantes
});
```

## 🏗️ Creando Métricas Personalizadas

### Métrica Personalizada Básica

```typescript
import { CustomMetric, EvalResult, EvalReport } from '../types';

class MiMetricaPersonalizada extends CustomMetric {
  name = 'mi-metrica-especial';
  display_name = 'Mi Métrica Especial';
  description = 'Mide algo específico para mi caso de uso';
  higher_is_better = true;
  category = 'custom' as const;

  async calculate(results: EvalResult[], report: EvalReport): Promise<number> {
    // Tu lógica personalizada aquí
    const valorEspecial = results.filter(r => /* criterio especial */).length;
    return valorEspecial / results.length;
  }
}

// Registrar tu métrica
metricsRegistry.registerMetric(new MiMetricaPersonalizada());
```

### Métrica con Configuración Avanzada

```typescript
class MetricaCompleja extends CustomMetric {
  name = 'metrica-compleja';
  display_name = 'Métrica Compleja';
  description = 'Análisis multifactorial personalizado';
  higher_is_better = true;
  category = 'business' as const;
  
  private config = {
    factor_a_weight: 0.4,
    factor_b_weight: 0.6,
    threshold_critico: 0.8
  };

  updateConfig(newConfig: Partial<typeof this.config>) {
    this.config = { ...this.config, ...newConfig };
  }

  async calculate(results: EvalResult[], report: EvalReport): Promise<number> {
    const factorA = this.calculateFactorA(results);
    const factorB = this.calculateFactorB(results);
    
    const score = (factorA * this.config.factor_a_weight) + 
                  (factorB * this.config.factor_b_weight);
    
    return Math.min(score, 1.0);  // Normalizar a 0-1
  }
  
  private calculateFactorA(results: EvalResult[]): number {
    // Lógica para factor A
    return 0.8;
  }
  
  private calculateFactorB(results: EvalResult[]): number {
    // Lógica para factor B
    return 0.9;
  }
}
```

## 🚨 Consideraciones de Performance

### ⚡ Métricas Rápidas vs Lentas

**Rápidas (< 1ms per sample):**
- `cost-efficiency` → Solo matemáticas básicas
- `token-efficiency` → Conteo simple
- `latency-percentile` → Ordenamiento de array

**Moderadas (1-10ms per sample):**
- `business-impact` → Varios cálculos pero sin I/O

**Lentas (10ms+ per sample):**
- `response-consistency` → Genera embeddings y compara similitud

### 💡 Optimización para Desarrollo

```typescript
// Desarrollo: Solo métricas rápidas
const devMetrics = ['cost-efficiency', 'token-efficiency'];

// Producción: Todas las métricas
const prodMetrics = ['all'];

const metricsToUse = process.env.NODE_ENV === 'production' ? prodMetrics : devMetrics;
```

## 🎯 Mejores Prácticas

### ✅ Qué Hacer

1. **🎯 Métricas alineadas con objetivos** → Si el costo importa, usa cost-efficiency
2. **📊 Comparar consistentemente** → Mismas métricas para todos los modelos
3. **⚡ Balance performance vs insight** → No todas las métricas en desarrollo
4. **📈 Monitorear tendencias** → Una evaluación no es suficiente
5. **🔧 Configurar parámetros apropiados** → Ajustar weights según tu contexto

### ❌ Qué Evitar

1. **🚫 Métricas sin propósito** → "Más métricas = mejor" es falso
2. **🚫 Ignorar el contexto** → Una métrica buena en un escenario puede ser mala en otro
3. **🚫 Comparar métricas de diferentes configuraciones** → No es justo
4. **🚫 Solo mirar una métrica** → Accuracy alta con costo alto puede no ser óptimo

## 🎓 Puntos Clave para Recordar

1. **Las métricas cuentan la historia completa** → Accuracy es solo una parte
2. **Cada métrica ve una perspectiva diferente** → Combínalas para decisiones informadas
3. **Las métricas de negocio son tan importantes como las técnicas** → ROI matters
4. **La configuración es clave** → Weights y parámetros deben reflejar tu contexto
5. **El dashboard visualiza mejor que los números** → Usa la interfaz gráfica
6. **Las métricas lentas tienen su lugar** → Pero no en desarrollo rápido

### 🎯 Regla de Oro de las Métricas

**"Mide lo que importa para tu caso de uso específico"**

No hay métricas universalmente mejores - depende de si priorizas costo, velocidad, calidad, o una combinación.

**¡Siguiente paso:** Vamos a explorar el sistema de embeddings y similitud semántica! 🧠
