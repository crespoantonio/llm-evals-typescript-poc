# 🗄️ Base de Datos - El Archivo Histórico del Framework

## ¿Qué es el Sistema de Base de Datos?

La **base de datos de evaluaciones** (`evaluation-store.ts`) es como el **archivo histórico** de una empresa: guarda todos los registros de evaluaciones que has ejecutado para que puedas:

- **📊 Analizar tendencias** → ¿Mejora la performance con el tiempo?
- **💰 Controlar costos** → ¿Cuánto gasté este mes?
- **🔄 Comparar modelos** → ¿GPT-4 vs GPT-3.5 en la misma tarea?
- **📈 Generar reportes** → Para presentaciones o análisis de negocio
- **🏆 Establecer benchmarks** → ¿Cuál es mi mejor resultado histórico?

**Analogía:** Es como el **historial médico** de tus modelos de IA. Cada evaluación es como una consulta médica que queda registrada para referencia futura.

## 🏗️ Estructura de la Base de Datos

### Tablas Principales:

```sql
-- Tabla de evaluaciones (la principal)
evaluations:
  - id (único)
  - run_id (del EvalRunner)  
  - eval_name (nombre de la evaluación)
  - model (modelo usado)
  - total_samples (número de preguntas)
  - correct (respuestas correctas)
  - score (accuracy: 0.0-1.0)
  - duration_ms (tiempo que tardó)
  - created_at (cuándo se ejecutó)
  - token_usage (JSON con estadísticas de tokens)
  - custom_metrics (JSON con métricas personalizadas)

-- Tabla de costos (detalles financieros)
evaluation_costs:
  - evaluation_id (referencia a evaluations)
  - cost (costo en USD)
  - tokens_used (tokens totales)
  - cost_breakdown (JSON: prompt_cost, completion_cost, etc.)

-- Tabla de resultados detallados (cada pregunta individual)
evaluation_results:
  - evaluation_id (referencia a evaluations)
  - sample_id (ID de la pregunta)
  - input (pregunta original)
  - ideal (respuesta esperada)
  - completion (respuesta del modelo)
  - score (puntuación: 0.0-1.0)
  - passed (boolean: aprobó o no)
```

## 💾 Configuración de la Base de Datos

### SQLite Local (Por Defecto)

```typescript
// Se crea automáticamente en: ./data/evaluations.db
import { EvaluationStore } from './database/evaluation-store';

const store = new EvaluationStore();
// ✅ No necesita configuración adicional
// ✅ Perfecto para desarrollo
// ✅ Portátil y simple
```

### PostgreSQL (Producción)

```bash
# Variables de entorno
export DATABASE_URL="postgresql://user:password@localhost:5432/llm_evals"
```

```typescript
const store = new EvaluationStore({
  type: 'postgresql',
  url: process.env.DATABASE_URL
});
// ✅ Mejor para equipos
// ✅ Escalable
// ✅ Backups automáticos
```

## 📊 Guardado Automático de Resultados

### En el EvalRunner

```typescript
// Al final de cada evaluación, se guarda automáticamente
async runEval(options: RunOptions): Promise<EvalReport> {
  // ... ejecutar evaluación ...
  
  const report = {
    eval_name: options.eval,
    model: options.model,
    total_samples: 100,
    correct: 87,
    score: 0.87,
    // ... más datos ...
  };

  // 💾 Guardado automático
  try {
    const totalCost = tokenUsage?.estimated_cost || 0;
    await this.store.saveEvaluation(report, totalCost);
    
    if (options.verbose) {
      console.log('💾 Evaluation results saved to database');
    }
  } catch (error) {
    console.warn(`⚠️ Failed to save to database: ${error.message}`);
    // ⚠️ No falla la evaluación si no puede guardar
  }

  return report;
}
```

### Guardado Detallado

```typescript
// Estructura completa de lo que se guarda
const evaluationRecord = {
  // Información básica
  run_id: 'ABC123XYZ789',
  eval_name: 'math-basic',
  model: 'gpt-4',
  
  // Resultados
  total_samples: 100,
  correct: 87,
  incorrect: 13,
  score: 0.87,
  
  // Performance
  duration_ms: 45320,
  created_at: '2024-12-31T14:30:45.123Z',
  
  // Costos y tokens
  token_usage: {
    total_prompt_tokens: 12450,
    total_completion_tokens: 3280,
    total_tokens: 15730,
    estimated_cost: 0.2359,
    cost_breakdown: {
      prompt_cost: 0.1245,
      completion_cost: 0.1114
    }
  },
  
  // Métricas personalizadas
  custom_metrics: [
    {
      name: 'cost-efficiency',
      value: 369.2,
      display_name: 'Cost Efficiency'
    },
    {
      name: 'token-efficiency', 
      value: 157.3,
      display_name: 'Token Efficiency'
    }
  ]
};
```

## 🔍 Consultas y Análisis

### Consultas Básicas

```typescript
import { EvaluationStore } from './database/evaluation-store';

const store = new EvaluationStore();

// 📊 Obtener todas las evaluaciones
const todasLasEvaluaciones = await store.getAllEvaluations();

// 🎯 Obtener evaluaciones por modelo
const evaluacionesGPT4 = await store.getEvaluationsByModel('gpt-4');

// 📅 Obtener evaluaciones de los últimos 7 días
const evaluacionesRecientes = await store.getEvaluationsByDateRange(
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Hace 7 días
  new Date()                                        // Ahora
);

// 🧪 Obtener evaluaciones por tipo
const evalMatematicas = await store.getEvaluationsByName('math-basic');

// 💰 Obtener costos por período
const costosDelMes = await store.getCostsByDateRange(
  new Date('2024-12-01'),
  new Date('2024-12-31')
);
```

### Análisis de Tendencias

```typescript
// 📈 Evolución de accuracy en el tiempo
async function analizarTendencias(evalName: string) {
  const evaluaciones = await store.getEvaluationsByName(evalName);
  
  const tendencia = evaluaciones
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(eval => ({
      fecha: eval.created_at.split('T')[0], // Solo fecha
      accuracy: eval.score,
      costo: eval.token_usage?.estimated_cost || 0
    }));

  console.log('📊 Tendencia de Accuracy:');
  tendencia.forEach(punto => {
    console.log(`${punto.fecha}: ${(punto.accuracy * 100).toFixed(1)}% (${punto.costo.toFixed(4)}$)`);
  });

  // Calcular mejora/empeoramiento
  if (tendencia.length >= 2) {
    const primero = tendencia[0];
    const ultimo = tendencia[tendencia.length - 1];
    const cambio = ((ultimo.accuracy - primero.accuracy) * 100).toFixed(1);
    
    console.log(`📈 Cambio total: ${cambio > 0 ? '+' : ''}${cambio}%`);
  }
}
```

### Comparación de Modelos

```typescript
// 🥊 Comparar performance entre modelos
async function compararModelos(evalName: string, modelos: string[]) {
  const comparacion = [];

  for (const modelo of modelos) {
    const evals = await store.getEvaluationsByModelAndName(modelo, evalName);
    
    if (evals.length === 0) continue;

    // Promedios
    const avgAccuracy = evals.reduce((sum, e) => sum + e.score, 0) / evals.length;
    const avgCost = evals.reduce((sum, e) => sum + (e.token_usage?.estimated_cost || 0), 0) / evals.length;
    const totalEvals = evals.length;

    comparacion.push({
      modelo,
      accuracy_promedio: avgAccuracy,
      costo_promedio: avgCost,
      evaluaciones_ejecutadas: totalEvals,
      eficiencia: avgAccuracy / avgCost  // Accuracy por dólar
    });
  }

  // Ordenar por eficiencia
  comparacion.sort((a, b) => b.eficiencia - a.eficiencia);

  console.log('🏆 Ranking de Modelos:');
  comparacion.forEach((modelo, i) => {
    const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
    console.log(`${medalla} ${modelo.modelo}:`);
    console.log(`     Accuracy: ${(modelo.accuracy_promedio * 100).toFixed(1)}%`);
    console.log(`     Costo: $${modelo.costo_promedio.toFixed(4)}`);
    console.log(`     Eficiencia: ${modelo.eficiencia.toFixed(1)} accuracy/$`);
    console.log(`     Evaluaciones: ${modelo.evaluaciones_ejecutadas}`);
  });
}
```

## 📈 Integración con Analytics

### Token Analytics Service

```typescript
// El TokenAnalyticsService usa la base de datos para análisis
import { TokenAnalyticsService } from './analytics/token-analytics';

const store = new EvaluationStore();
const analytics = new TokenAnalyticsService(store);

// 📊 Reporte completo de analytics
const reporte = await analytics.generateAnalyticsReport(30); // Últimos 30 días

console.log('📈 Resumen Analytics:');
console.log(`Total evaluaciones: ${reporte.summary.total_evaluations}`);
console.log(`Total tokens: ${reporte.summary.total_tokens.toLocaleString()}`);
console.log(`Costo total: $${reporte.summary.total_cost.toFixed(4)}`);
console.log(`Modelo más eficiente: ${reporte.summary.most_efficient_model}`);

// 💰 Breakdown de costos por evaluación
reporte.evaluation_costs.forEach(evalCost => {
  console.log(`${evalCost.evaluation}: $${evalCost.total_cost.toFixed(4)} (${evalCost.total_runs} runs)`);
});
```

### Dashboard Integration

```typescript
// El dashboard web consulta la base de datos para gráficas
app.get('/api/evaluations/trends/:evalName', async (req, res) => {
  const { evalName } = req.params;
  const days = parseInt(req.query.days) || 30;
  
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const evaluations = await store.getEvaluationsByNameAndDateRange(evalName, startDate, new Date());
  
  const trends = evaluations.map(eval => ({
    date: eval.created_at.split('T')[0],
    accuracy: eval.score,
    cost: eval.token_usage?.estimated_cost || 0,
    duration: eval.duration_ms
  }));

  res.json(trends);
});
```

## 💰 Gestión de Costos

### Seguimiento de Presupuesto

```typescript
// 💵 Monitoreo de presupuesto mensual
async function verificarPresupuesto(presupuestoMensual: number) {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const finMes = new Date();
  
  const gastosDelMes = await store.getCostsByDateRange(inicioMes, finMes);
  const totalGastado = gastosDelMes.reduce((sum, cost) => sum + cost.cost, 0);

  const porcentajeUsado = (totalGastado / presupuestoMensual) * 100;

  console.log(`💰 Presupuesto Mensual:`);
  console.log(`   Gastado: $${totalGastado.toFixed(2)} de $${presupuestoMensual}`);
  console.log(`   Usado: ${porcentajeUsado.toFixed(1)}%`);

  if (porcentajeUsado > 80) {
    console.log(`⚠️ ALERTA: Has usado más del 80% del presupuesto mensual`);
  }

  return {
    totalGastado,
    presupuestoRestante: presupuestoMensual - totalGastado,
    porcentajeUsado
  };
}
```

### Predicción de Costos

```typescript
// 🔮 Predecir costos futuros basado en historial
async function predecirCostos(evalName: string, sampleCount: number) {
  // Obtener evaluaciones históricas similares
  const historial = await store.getEvaluationsByName(evalName);
  
  if (historial.length === 0) {
    console.log('⚠️ No hay historial para esta evaluación');
    return null;
  }

  // Calcular estadísticas
  const costosPorSample = historial.map(eval => 
    (eval.token_usage?.estimated_cost || 0) / eval.total_samples
  );

  const costPromedioPorSample = costosPorSample.reduce((a, b) => a + b, 0) / costosPorSample.length;
  const costoMaxPorSample = Math.max(...costosPorSample);
  const costoMinPorSample = Math.min(...costosPorSample);

  const prediccion = {
    evaluacion: evalName,
    samples_solicitadas: sampleCount,
    costo_estimado: costPromedioPorSample * sampleCount,
    rango_minimo: costoMinPorSample * sampleCount,
    rango_maximo: costoMaxPorSample * sampleCount,
    base_historica: historial.length
  };

  console.log(`🔮 Predicción de Costo:`);
  console.log(`   Evaluación: ${prediccion.evaluacion}`);
  console.log(`   Samples: ${prediccion.samples_solicitadas}`);
  console.log(`   Costo estimado: $${prediccion.costo_estimado.toFixed(4)}`);
  console.log(`   Rango: $${prediccion.rango_minimo.toFixed(4)} - $${prediccion.rango_maximo.toFixed(4)}`);
  console.log(`   Basado en: ${prediccion.base_historica} evaluaciones históricas`);

  return prediccion;
}
```

## 🚨 Mantenimiento de la Base de Datos

### Limpieza Automática

```typescript
// 🧹 Limpiar datos antiguos (opcional)
async function limpiarDatosAntiguos(diasAMantener: number = 90) {
  const fechaCorte = new Date(Date.now() - diasAMantener * 24 * 60 * 60 * 1000);
  
  const evaluacionesEliminadas = await store.deleteEvaluationsBefore(fechaCorte);
  
  console.log(`🧹 Limpieza completada:`);
  console.log(`   Evaluaciones eliminadas: ${evaluacionesEliminadas}`);
  console.log(`   Manteniendo datos de los últimos ${diasAMantener} días`);
}
```

### Backup y Exportación

```typescript
// 📦 Exportar datos para backup
async function exportarDatos() {
  const todasLasEvaluaciones = await store.getAllEvaluations();
  
  const backup = {
    exportDate: new Date().toISOString(),
    totalEvaluations: todasLasEvaluaciones.length,
    data: todasLasEvaluaciones
  };

  const fs = require('fs');
  const nombreArchivo = `backup-evaluaciones-${new Date().toISOString().split('T')[0]}.json`;
  
  fs.writeFileSync(nombreArchivo, JSON.stringify(backup, null, 2));
  
  console.log(`📦 Backup creado: ${nombreArchivo}`);
  console.log(`   ${backup.totalEvaluations} evaluaciones exportadas`);
}
```

## 🔍 Consultas Avanzadas

### Top Performers

```typescript
// 🏆 Mejores resultados históricos
async function topPerformers(evalName: string, limit: number = 5) {
  const evaluaciones = await store.getEvaluationsByName(evalName);
  
  const topResults = evaluaciones
    .sort((a, b) => b.score - a.score)  // Ordenar por score descendente
    .slice(0, limit)
    .map((eval, index) => ({
      ranking: index + 1,
      modelo: eval.model,
      accuracy: eval.score,
      fecha: eval.created_at.split('T')[0],
      costo: eval.token_usage?.estimated_cost || 0,
      run_id: eval.run_id
    }));

  console.log(`🏆 Top ${limit} Resultados para ${evalName}:`);
  topResults.forEach(result => {
    const medalla = result.ranking === 1 ? '🥇' : result.ranking === 2 ? '🥈' : result.ranking === 3 ? '🥉' : '  ';
    console.log(`${medalla} #${result.ranking}: ${result.modelo}`);
    console.log(`     Accuracy: ${(result.accuracy * 100).toFixed(2)}%`);
    console.log(`     Fecha: ${result.fecha}`);
    console.log(`     Costo: $${result.costo.toFixed(4)}`);
    console.log(`     Run ID: ${result.run_id}`);
  });

  return topResults;
}
```

## 🎓 Puntos Clave para Recordar

1. **Todo se guarda automáticamente** → No necesitas configuración extra
2. **SQLite es perfecto para empezar** → PostgreSQL para equipos
3. **Los datos históricos son oro** → Permiten análisis de tendencias
4. **La base de datos nunca debe fallar una evaluación** → Los errores de BD se registran como warnings
5. **Las consultas pueden ser lentas con muchos datos** → Considera indexes y limpieza periódica
6. **Los backups son importantes** → Especialmente para datos de producción
7. **La integración con analytics es poderosa** → Reportes automáticos y dashboards

### 🎯 Casos de Uso Principales

**🧪 Para Desarrollo:**
- Comparar diferentes prompts
- Ver evolución de experimentos
- Analizar costos de desarrollo

**🚀 Para Producción:**
- Monitorear performance en tiempo real
- Alertas de presupuesto
- Reportes ejecutivos automáticos

**📊 Para Investigación:**
- Análisis longitudinal de modelos
- Benchmarking comparativo
- Estudios de regresión de performance

**¡Siguiente paso:** Vamos a ver el sistema de monitoreo en tiempo real! 📡
