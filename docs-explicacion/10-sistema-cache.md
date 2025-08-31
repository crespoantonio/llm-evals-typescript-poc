# ⚡ Sistema de Caché - Tu Cuenta de Ahorros de IA

## ¿Qué es el Caché de Evaluaciones?

El **caché de evaluaciones** es como una **cuenta de ahorros para llamadas de IA**. Imagina que cada vez que preguntas algo a ChatGPT tienes que pagar, pero si ya hiciste esa pregunta antes, ¡puedes usar la respuesta guardada gratis!

**Analogía:** Es como tener un **cuaderno de respuestas** donde anotas las preguntas que ya hiciste y sus respuestas. Antes de pagar por una nueva pregunta, revisas tu cuaderno para ver si ya la tienes.

## 💰 ¿Por qué es Importante el Caché?

### El Problema Sin Caché:
```
Evaluación 1: "¿Cuánto es 2+2?" → Pagar $0.0001
Evaluación 2: "¿Cuánto es 2+2?" → Pagar $0.0001 (¡otra vez!)
Evaluación 3: "¿Cuánto es 2+2?" → Pagar $0.0001 (¡de nuevo!)

Total gastado: $0.0003 por la misma pregunta
```

### La Solución Con Caché:
```
Evaluación 1: "¿Cuánto es 2+2?" → Pagar $0.0001 + Guardar respuesta
Evaluación 2: "¿Cuánto es 2+2?" → Usar caché = $0.0000 ✅
Evaluación 3: "¿Cuánto es 2+2?" → Usar caché = $0.0000 ✅

Total gastado: $0.0001 (67% de ahorro!)
```

## 🏗️ Tipos de Caché Disponibles

### 1. 🧠 Caché de Memoria (Memory Cache)
```yaml
cache_config:
  enabled: true
  provider: memory
  max_memory_items: 1000    # Máximo 1000 respuestas en RAM
  ttl_seconds: 3600        # Válido por 1 hora
```

**¿Cómo funciona?**
- **Guarda las respuestas en la RAM** de tu computadora
- **Muy rápido** → Respuestas instantáneas
- **Temporal** → Se pierde cuando cierras el programa
- **Limitado** → Solo para una sesión

**¿Cuándo usar?**
- ✅ Desarrollo y testing
- ✅ Evaluaciones cortas
- ✅ Cuando no tienes Redis
- ❌ Para equipos o producción

### 2. 🗄️ Caché Redis (Persistente)
```yaml
cache_config:
  enabled: true
  provider: redis
  redis_url: redis://localhost:6379
  ttl_seconds: 86400       # Válido por 24 horas
  max_memory_items: 10000  # Límite de memoria local
```

**¿Cómo funciona?**
- **Guarda las respuestas en una base de datos Redis**
- **Persistente** → Sobrevive reinicios
- **Compartido** → Todo el equipo usa el mismo caché
- **Escalable** → Maneja millones de respuestas

**¿Cuándo usar?**
- ✅ Equipos de desarrollo
- ✅ Producción
- ✅ Evaluaciones grandes
- ✅ Cuando quieres compartir caché

## 🔑 Cómo Funciona la Clave de Caché

El caché usa una "huella digital" única para cada pregunta:

```typescript
// Clave de caché = hash(modelo + pregunta + configuración)
const cacheKey = hash({
  model: 'gpt-4',
  input: [{"role": "user", "content": "¿Cuánto es 2+2?"}],
  options: { 
    temperature: 0.0, 
    max_tokens: 10 
  },
  template: { 
    type: 'BasicEval', 
    args: { match_type: 'exact' } 
  }
});
```

**Si cambia CUALQUIER cosa, es una nueva clave:**
```typescript
// Diferentes claves de caché:
gpt-4 + "¿Cuánto es 2+2?" + temp:0.0  ≠  gpt-4 + "¿Cuánto es 2+2?" + temp:0.1
gpt-4 + "¿Cuánto es 2+2?" + temp:0.0  ≠  gpt-3.5-turbo + "¿Cuánto es 2+2?" + temp:0.0
```

## 📊 Estadísticas de Rendimiento

### Métricas que Puedes Ver:
```
💾 Cache Performance:
   • Requests: 100          # Total de peticiones
   • Hits: 23               # Encontradas en caché
   • Misses: 77             # No estaban en caché  
   • Hit rate: 23.0%        # Porcentaje de aciertos
   • Est. tokens saved: 3,611  # Tokens ahorrados
   • Est. cost saved: $0.12    # Dinero ahorrado
```

### 🎯 ¿Qué es un Buen Hit Rate?

- **0-10%** → 😟 Muy bajo - Revisa configuración
- **10-30%** → 🤔 Bajo - Normal para datasets nuevos
- **30-60%** → 😊 Bueno - Empiezas a ahorrar significativamente  
- **60-80%** → 🎉 Excelente - Gran ahorro
- **80%+** → 🚀 Fantástico - Máximo ahorro

## 💡 Configuración Práctica

### 🏠 Setup Local (Desarrollo)
```typescript
import { EvalRunner } from './eval-runner';

const runner = new EvalRunner('./registry', {
  enabled: true,
  provider: 'memory',
  ttl_seconds: 3600,      // 1 hora
  max_memory_items: 500   // 500 respuestas max
});

await runner.runEval({
  model: 'gpt-4',
  eval: 'math-basic',
  max_samples: 10,        // Dataset pequeño para desarrollo
});
```

### 🏢 Setup de Equipo (Redis)
```typescript
// 1. Instalar Redis
// En macOS: brew install redis
// En Ubuntu: sudo apt install redis-server
// En Docker: docker run -d -p 6379:6379 redis

// 2. Configurar caché
const runner = new EvalRunner('./registry', {
  enabled: true,
  provider: 'redis',
  redis_url: 'redis://localhost:6379',
  ttl_seconds: 86400,     // 24 horas
  max_memory_items: 5000
});
```

### 🌐 Setup de Producción (Redis en la Nube)
```typescript
// Usando Redis en la nube (ejemplo: Upstash, AWS ElastiCache)
const runner = new EvalRunner('./registry', {
  enabled: true,
  provider: 'redis', 
  redis_url: 'redis://mi-redis-produccion.com:6379',
  ttl_seconds: 604800,    // 7 días
  max_memory_items: 10000
});
```

## 🎮 Comandos CLI para Gestionar Caché

### 📊 Ver Estadísticas
```bash
llm-eval cache stats
```

**Resultado:**
```
💾 Cache Statistics

📊 Performance:
   • Total requests: 1,247
   • Cache hits: 312
   • Cache misses: 935  
   • Hit rate: 25.0%
   • Memory usage: 45.2 MB

💰 Savings:
   • Estimated tokens saved: 78,450
   • Estimated cost saved: $1.23
   • Average response time: 45ms (cached) vs 2,341ms (API)

🗄️ Storage:
   • Provider: redis
   • TTL: 24 hours
   • Items in cache: 312
   • Redis memory usage: 12.4 MB
```

### 🧹 Limpiar Caché
```bash
# Limpiar todo el caché (¡cuidado!)
llm-eval cache clear

# Limpiar caché de un modelo específico
llm-eval cache invalidate gpt-4
```

### 🔧 Configurar Caché via CLI
```bash
# Usar caché de memoria para desarrollo
llm-eval gpt-4 math-basic --cache-provider memory --cache-ttl 3600

# Usar Redis para producción
llm-eval gpt-4 math-basic --cache-provider redis --cache-url redis://localhost:6379
```

## 🚀 Optimización de Caché

### 1. 📈 Maximizar Hit Rate

**❌ Lo que Reduce el Hit Rate:**
```typescript
// Usar temperatura aleatoria
temperature: Math.random()  // ¡Cada vez es diferente!

// Cambiar configuraciones constantemente
max_tokens: 50   // Una vez
max_tokens: 51   // Otra vez → Nueva clave de caché
```

**✅ Lo que Mejora el Hit Rate:**
```typescript
// Usar configuraciones consistentes
temperature: 0.0        // Siempre la misma
max_tokens: 100        // Valor fijo

// Reutilizar datasets
samples: same_dataset  // Mismas preguntas = más hits
```

### 2. ⚙️ TTL Inteligente

```typescript
// Desarrollo: TTL corto (cambias código frecuentemente)
ttl_seconds: 1800,  // 30 minutos

// Testing: TTL medio (datasets estables)
ttl_seconds: 86400, // 24 horas

// Producción: TTL largo (datasets raramente cambian)
ttl_seconds: 604800 // 7 días
```

### 3. 🎯 Estrategias por Caso de Uso

**🧪 Para Desarrollo:**
```typescript
{
  provider: 'memory',
  ttl_seconds: 3600,     // 1 hora
  max_memory_items: 200  // Límite bajo
}
```

**🔄 Para Testing Continuo:**
```typescript
{
  provider: 'redis',
  ttl_seconds: 86400,    // 24 horas
  max_memory_items: 1000
}
```

**🚀 Para Producción:**
```typescript
{
  provider: 'redis',
  redis_url: process.env.REDIS_URL,
  ttl_seconds: 604800,   // 7 días
  max_memory_items: 5000
}
```

## 💰 Calculadora de Ahorros

### Escenario Real: Evaluación con 100 Preguntas

**Sin Caché:**
```
100 preguntas × $0.0003/pregunta = $0.03 por evaluación

10 evaluaciones diarias × $0.03 = $0.30/día
$0.30 × 30 días = $9.00/mes
```

**Con Caché (30% hit rate):**
```
70 preguntas nuevas × $0.0003 = $0.021 por evaluación
30 preguntas cacheadas × $0.0000 = $0.000 por evaluación

Total: $0.021 por evaluación (30% ahorro)
$0.021 × 10 × 30 = $6.30/mes

AHORRO: $2.70/mes (30%)
```

**Con Caché (70% hit rate):**
```
30 preguntas nuevas × $0.0003 = $0.009 por evaluación
70 preguntas cacheadas × $0.0000 = $0.000 por evaluación

Total: $0.009 por evaluación (70% ahorro)
$0.009 × 10 × 30 = $2.70/mes

AHORRO: $6.30/mes (70%)
```

## 🚨 Consideraciones Importantes

### ⚠️ Cuándo NO Usar Caché

1. **Evaluaciones de creatividad**
```yaml
# Para estas evaluaciones, quieres respuestas diferentes
creative-writing:
  temperature: 1.5  # Alta creatividad
  # El caché no tiene sentido aquí
```

2. **Desarrollo de prompts**
```typescript
// Cuando estás refinando prompts constantemente
grading_prompt: "Versión experimental #47 del prompt..."
// Cada versión genera respuestas diferentes
```

3. **Testing de determinismo**
```typescript
// Cuando quieres verificar que el modelo es consistente
// Deshabilitar caché para forzar nuevas peticiones
cache_config: { enabled: false }
```

### 🔒 Seguridad y Privacidad

**❌ No Cachear:**
- Información personal sensible
- Datos confidenciales de empresa
- API keys o credenciales

**✅ Seguro para Cachear:**
- Preguntas educativas públicas
- Evaluaciones de benchmark estándar
- Datasets sintéticos

### 🧠 Gestión de Memoria

```typescript
// Monitorear uso de memoria
const stats = await cache.getCacheStats();
if (stats.memory_usage > 100 * 1024 * 1024) { // > 100MB
  console.log('⚠️ Cache usando mucha memoria, considera limpiar');
}

// Límites inteligentes
max_memory_items: process.env.NODE_ENV === 'production' ? 10000 : 1000
```

## 🎓 Puntos Clave para Recordar

1. **El caché ahorra dinero real** → Especialmente importante en producción
2. **Configuraciones consistentes = mejor hit rate** → No cambies parámetros aleatoriamente
3. **Redis > Memoria para equipos** → Compartir caché es poderoso
4. **TTL debe coincidir con tu flujo de trabajo** → Muy corto = poco ahorro, muy largo = datos obsoletos
5. **Monitorea las estadísticas** → Hit rate bajo indica problemas de configuración
6. **No todas las evaluaciones necesitan caché** → Creatividad y experimentación pueden no necesitarlo

### 🎯 Regla de Oro del Caché

**"Si haces la misma pregunta dos veces, deberías usar caché"**

**¡Siguiente paso:** Vamos a ver las métricas personalizadas que miden la calidad! 📊
