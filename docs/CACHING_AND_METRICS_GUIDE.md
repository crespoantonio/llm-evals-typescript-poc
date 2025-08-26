# 🚀 Advanced Features: Intelligent Caching & Custom Metrics

Este guía explica las dos funcionalidades avanzadas más potentes del framework: **Intelligent Caching** y **Custom Metrics**. Estas características fueron diseñadas para optimizar costos y proporcionar insights más profundos sobre el rendimiento de los modelos.

## 📋 Índice

1. [🎯 Visión General](#-visión-general)
2. [💾 Intelligent Caching](#-intelligent-caching)
3. [📊 Custom Metrics Framework](#-custom-metrics-framework)
4. [🔧 Configuración y Uso](#-configuración-y-uso)
5. [📈 Ejemplos Prácticos](#-ejemplos-prácticos)
6. [🛠️ Guía Avanzada](#-guía-avanzada)

## 🎯 Visión General

### ¿Por qué estas funcionalidades?

**Intelligent Caching:**
- 📉 Reduce costos de API hasta un **80%** en evaluaciones repetitivas
- ⚡ Acelera evaluaciones hasta **10x** usando cache hits
- 🔄 Soporte para Redis (producción) y memoria (desarrollo)
- 🧠 Invalidación inteligente por modelo/template

**Custom Metrics:**
- 📊 Métricas personalizables para casos de uso específicos
- 💰 Análisis de eficiencia costo vs rendimiento
- 🎯 Métricas de calidad y consistencia de respuestas
- 📈 Sistema extensible para métricas de negocio

## 💾 Intelligent Caching

### Arquitectura del Cache

```
┌─────────────────────────────────────┐
│           EvaluationCache           │
├─────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────────┐│
│  │   Redis     │ │   In-Memory     ││
│  │ (Producción)│ │ (Desarrollo)    ││
│  └─────────────┘ └─────────────────┘│
├─────────────────────────────────────┤
│ • Smart Key Generation              │
│ • TTL Management                    │
│ • Hit Rate Tracking                 │
│ • Cost Savings Analysis             │
└─────────────────────────────────────┘
```

### Generación de Cache Keys

El sistema genera keys únicos basados en:

```typescript
CacheKey = hash(model) + hash(sample_input) + hash(template_config)
```

**Ejemplo:**
```typescript
// Input
model: "gpt-3.5-turbo"
sample: { input: [{ role: "user", content: "What is 2+2?" }] }
template: { type: "BasicEval", args: { match_type: "exact" } }

// Generated Key
"eval:7f4a8b2c:9e3d5f1a:2a8b4c6e"
```

### Configuración del Cache

```typescript
import { createEvaluationCache, DEFAULT_CACHE_CONFIG } from './caching/evaluation-cache';

// Configuración básica (memoria)
const cache = createEvaluationCache();

// Configuración avanzada (Redis)
const cache = createEvaluationCache({
  enabled: true,
  provider: 'redis',
  redis_url: 'redis://localhost:6379',
  ttl_seconds: 3600, // 1 hora
  max_memory_items: 1000
});
```

### Uso en Evaluaciones

El cache se integra automáticamente:

```typescript
// Al ejecutar una evaluación
const runner = new EvalRunner('./registry', cacheConfig);

// El cache se usa automáticamente:
// 1. Busca en cache antes de llamar a la API
// 2. Guarda results nuevos en cache
// 3. Muestra estadísticas de cache hit/miss
```

### Comandos CLI del Cache

```bash
# Ver estadísticas del cache
npx llm-eval cache stats

# Limpiar todo el cache
npx llm-eval cache clear

# Invalidar cache de un modelo específico
npx llm-eval cache invalidate gpt-3.5-turbo
```

## 📊 Custom Metrics Framework

### Métricas Incluidas

| Métrica | Descripción | Categoría | Mejor |
|---------|-------------|-----------|-------|
| `cost_efficiency` | Accuracy por dólar gastado | Efficiency | ↗️ Mayor |
| `response_consistency` | Consistencia en respuestas similares | Quality | ↗️ Mayor |
| `token_efficiency` | Tokens promedio por respuesta correcta | Efficiency | ↙️ Menor |
| `business_impact` | Score personalizado de impacto de negocio | Business | ↗️ Mayor |
| `latency_p95` | Percentil 95 de latencia estimada | Efficiency | ↙️ Menor |

### Anatomía de una Métrica Custom

```typescript
export class MiMetricaCustom extends CustomMetric {
  readonly name = 'mi_metrica';
  readonly display_name = 'Mi Métrica Custom';
  readonly description = 'Descripción de qué mide';
  readonly higher_is_better = true;
  readonly category = 'custom' as const;

  async calculate(results: EvalResult[], report?: EvalReport): Promise<MetricResult> {
    // Lógica de cálculo
    const value = /* tu cálculo aquí */;
    
    return {
      name: this.name,
      value,
      display_name: this.display_name,
      description: this.description,
      higher_is_better: this.higher_is_better,
      category: this.category,
      metadata: {
        // Datos adicionales
      }
    };
  }
}
```

### Registry de Métricas

```typescript
import { metricsRegistry } from './metrics/custom-metrics';

// Registrar métrica personalizada
const miMetrica = new MiMetricaCustom();
metricsRegistry.registerMetric(miMetrica);

// Configurar métricas
metricsRegistry.configureMetrics({
  'cost_efficiency': { enabled: true, weight: 1.0 },
  'response_consistency': { enabled: false }
});

// Calcular todas las métricas
const results = await metricsRegistry.calculateAllMetrics(evalResults, report);
```

## 🔧 Configuración y Uso

### Integración en RunOptions

```typescript
const options: RunOptions = {
  model: 'gpt-3.5-turbo',
  eval: 'math',
  
  // Configuración de cache
  cache_config: {
    enabled: true,
    provider: 'memory',
    ttl_seconds: 1800
  },
  
  // Métricas específicas
  custom_metrics: ['cost_efficiency', 'token_efficiency'],
  disable_default_metrics: false
};
```

### Output Mejorado

Con las nuevas funcionalidades, el output incluye:

```
==================================================
🎯 Final Results:
   Total samples: 100
   Correct: 85
   Incorrect: 15
   Accuracy: 85.00%
   Duration: 45.2s

📊 Token Usage:
   • Prompt tokens: 2,450
   • Completion tokens: 890
   • Total tokens: 3,340
   • Avg tokens/sample: 33
   • Range: 15 - 78 tokens

💰 Estimated Cost:
   • Total: $0.0098
   • Prompt cost: $0.0049
   • Completion cost: $0.0049
   • Cost per sample: $0.0001

📈 Custom Metrics:
   ⚡ EFFICIENCY:
      ↗️ Cost Efficiency: 8,673.47
      ↙️ Token Efficiency: 39.3

   ✨ QUALITY:
      ↗️ Response Consistency: 0.924

💾 Cache Performance:
   • Requests: 100
   • Hits: 25
   • Hit rate: 25.0%
   • Est. tokens saved: 825
==================================================
```

## 📈 Ejemplos Prácticos

### Ejemplo 1: Optimización de Costos

```bash
# Ejecutar evaluación con cache habilitado
npx llm-eval gpt-3.5-turbo math --cache-enabled

# Primera ejecución: 0% hit rate
# Segunda ejecución: 100% hit rate ✨

# Ver estadísticas
npx llm-eval cache stats
```

**Resultado:**
```
💾 Cache Performance:
   Total requests: 200
   Cache hits: 100
   Hit rate: 50.0%
   Estimated API calls saved: 100
   Estimated cost savings: $0.0200
```

### Ejemplo 2: Análisis de Eficiencia

```bash
# Comparar modelos con métricas custom
npx llm-eval gpt-3.5-turbo math --custom-metrics cost_efficiency,token_efficiency
npx llm-eval gpt-4 math --custom-metrics cost_efficiency,token_efficiency
```

**Comparación:**

| Modelo | Accuracy | Cost Efficiency | Token Efficiency |
|--------|----------|-----------------|-------------------|
| GPT-3.5-Turbo | 85% | 8,673 | 39.3 |
| GPT-4 | 92% | 4,600 | 45.2 |

**Insights:**
- GPT-4 es más preciso pero menos cost-efficient
- GPT-3.5-Turbo es más eficiente en tokens y costo
- Para casos de uso cost-sensitive, GPT-3.5-Turbo puede ser mejor

### Ejemplo 3: Métrica de Negocio Personalizada

```typescript
export class CustomerSatisfactionMetric extends CustomMetric {
  readonly name = 'customer_satisfaction';
  readonly display_name = 'Customer Satisfaction Score';
  readonly description = 'Estimated customer satisfaction based on response quality';
  readonly higher_is_better = true;
  readonly category = 'business' as const;

  async calculate(results: EvalResult[]): Promise<MetricResult> {
    let totalSatisfaction = 0;
    
    for (const result of results) {
      const response = result.completion.content;
      
      // Factores de satisfacción
      let satisfaction = 0.5; // Base score
      
      // Respuesta completa (+0.2)
      if (response.length > 50) satisfaction += 0.2;
      
      // Respuesta cortés (+0.15)
      if (/please|thank|help/i.test(response)) satisfaction += 0.15;
      
      // Respuesta precisa (usa el score de evaluación)
      satisfaction += result.score * 0.25;
      
      // Respuesta concisa (+0.1)
      if (response.length < 200) satisfaction += 0.1;
      
      totalSatisfaction += Math.min(1.0, satisfaction);
    }
    
    const value = totalSatisfaction / results.length;
    
    return {
      name: this.name,
      value,
      display_name: this.display_name,
      description: this.description,
      higher_is_better: this.higher_is_better,
      category: this.category,
      metadata: {
        samples_analyzed: results.length,
        satisfaction_factors: ['completeness', 'courtesy', 'accuracy', 'conciseness']
      }
    };
  }
}

// Registrar la métrica
metricsRegistry.registerMetric(new CustomerSatisfactionMetric());
```

## 🛠️ Guía Avanzada

### Redis Configuration para Producción

```bash
# docker-compose.yml
version: '3'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  redis_data:
```

```typescript
// Configuración robusta
const cacheConfig = {
  enabled: true,
  provider: 'redis' as const,
  redis_url: process.env.REDIS_URL || 'redis://localhost:6379',
  ttl_seconds: 24 * 60 * 60, // 24 horas
  max_memory_items: 10000 // Para fallback in-memory
};
```

### Invalidación Inteligente de Cache

```typescript
// Invalidar después de actualizar un modelo
await runner.invalidateModelCache('gpt-3.5-turbo');

// Invalidar después de cambiar templates
await runner.invalidateTemplateCache('BasicEval');

// Cache health check
const health = await runner.cache.healthCheck();
console.log(health);
```

### Métricas Avanzadas con Configuración

```typescript
// Configurar pesos para métricas composite
metricsRegistry.configureMetrics({
  'cost_efficiency': { 
    enabled: true, 
    weight: 0.4,
    threshold: 1000 // Mínimo aceptable
  },
  'business_impact': { 
    enabled: true,
    parameters: {
      impact_weights: {
        accuracy: 0.5,
        speed: 0.2,
        cost: 0.2,
        user_satisfaction: 0.1
      }
    }
  }
});
```

### Monitoreo y Alertas

```typescript
// Monitoreo de cache performance
const stats = await cache.getCacheStats();

if (stats.hit_rate < 0.3) {
  console.warn('⚠️ Low cache hit rate:', stats.hit_rate);
  // Posibles causas:
  // 1. TTL muy bajo
  // 2. Datos muy variados
  // 3. Cache recién iniciado
}

// Monitoreo de métricas
const customMetrics = await metricsRegistry.calculateAllMetrics(results);
const costEfficiency = customMetrics.find(m => m.name === 'cost_efficiency');

if (costEfficiency && costEfficiency.value < 1000) {
  console.warn('⚠️ Low cost efficiency:', costEfficiency.value);
  // Considerar:
  // 1. Cambiar de modelo
  // 2. Ajustar parámetros
  // 3. Optimizar prompts
}
```

## 🎯 Best Practices

### Cache Management

1. **TTL Apropiado:**
   - Desarrollo: 30-60 minutos
   - Testing: 2-4 horas  
   - Producción: 24 horas

2. **Invalidación Estratégica:**
   - Invalidar al actualizar modelos
   - Invalidar al cambiar templates críticos
   - No invalidar en cambios menores de configuración

3. **Monitoreo:**
   - Hit rate objetivo: >60%
   - Revisar memory usage regularmente
   - Alertas en Redis downtime

### Custom Metrics

1. **Diseño de Métricas:**
   - Nombres descriptivos y únicos
   - Categorías apropiadas
   - Documentación clara de qué mide

2. **Performance:**
   - Cálculos eficientes
   - Avoid expensive operations
   - Use metadata para debug info

3. **Negocio:**
   - Align métricas con objetivos de negocio
   - Consider user experience factors
   - Balance accuracy vs cost

## 🚀 Roadmap Futuro

**Próximas funcionalidades:**

1. **Distributed Caching:**
   - Multi-node Redis cluster
   - Cache sharing entre equipos
   
2. **ML-Powered Metrics:**
   - Sentiment analysis metrics
   - Content quality scoring
   - Bias detection metrics

3. **Advanced Analytics:**
   - Cache hit prediction
   - Cost optimization suggestions
   - Performance regression detection

---

## 📞 Soporte

¿Preguntas sobre estas funcionalidades avanzadas?

- 📖 Consulta `FRAMEWORK_EXPLAINED.md` para conceptos básicos
- 🔍 Usa `npx llm-eval cache stats` para diagnosticar cache issues  
- 📊 Usa `npx llm-eval metrics list` para ver métricas disponibles
- 🧪 Usa `npx llm-eval metrics test sample` para probar el sistema

**¡Estas funcionalidades transformarán tu workflow de evaluación de LLMs!** 🎉
