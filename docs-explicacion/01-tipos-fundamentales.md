# 🔤 Tipos Fundamentales - El Vocabulario del Framework

## ¿Qué son los "tipos" en TypeScript?

Los **tipos** son como las **definiciones en un diccionario**. Imagina que estás aprendiendo un nuevo idioma: antes de poder hablar, necesitas saber qué significan las palabras básicas.

En TypeScript, los tipos nos ayudan a:
- **Definir qué información puede contener** cada cosa
- **Prevenir errores** antes de que sucedan
- **Documentar automáticamente** cómo funciona nuestro código

## 🗣️ Tipos de Conversación

### `ChatMessage` - Un mensaje en una conversación
```typescript
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
```

**¿Qué es esto?**
Es como un **globo de diálogo en un cómic**:
- `role`: **Quién habla** → `'system'` (las reglas), `'user'` (tú), `'assistant'` (la IA)
- `content`: **Qué dice** → El texto del mensaje

**Ejemplo en la vida real:**
```typescript
const mensajeDelUsuario: ChatMessage = {
  role: 'user',
  content: '¿Cuál es la capital de Francia?'
}

const respuestaDeIA: ChatMessage = {
  role: 'assistant', 
  content: 'La capital de Francia es París.'
}
```

## 🧪 Tipos de Evaluación

### `EvalSample` - Una pregunta de examen
```typescript
interface EvalSample {
  input: ChatMessage[];        // La pregunta (puede ser una conversación)
  ideal: string | string[];    // La respuesta correcta (o varias opciones)
  metadata?: Record<string, any>; // Información extra (opcional)
}
```

**Analogía:** Es como una **pregunta de examen** con:
- **La pregunta** (`input`) → Puede ser una conversación completa
- **La respuesta correcta** (`ideal`) → Lo que esperamos que responda
- **Notas del profesor** (`metadata`) → Información adicional opcional

### `EvalDataset` - Un examen completo
```typescript
interface EvalDataset {
  samples: EvalSample[];           // Todas las preguntas del examen
  metadata?: Record<string, any>;  // Información sobre el examen
}
```

**Es como:** Un **cuadernillo de examen** completo con todas las preguntas y información sobre la materia.

## 🤖 Tipos de Respuestas de IA

### `CompletionResult` - La respuesta de la IA
```typescript
interface CompletionResult {
  content: string;                    // La respuesta en texto
  usage?: {                          // Cuántos "tokens" usó
    prompt_tokens: number;           // Tokens de la pregunta
    completion_tokens: number;       // Tokens de la respuesta  
    total_tokens: number;            // Total
  };
  model?: string;                    // Qué modelo respondió
  finish_reason?: string;            // Por qué terminó de responder
}
```

**¿Qué son los tokens?**
Los **tokens** son como **monedas en una máquina de videojuegos**:
- Cada palabra/pedazo de texto cuesta tokens
- Pagas por los tokens que usas
- Diferentes modelos tienen diferentes "precios"

### `EvalResult` - Calificación de una respuesta
```typescript
interface EvalResult {
  sample_id: string;              // ID de la pregunta
  input: ChatMessage[];           // La pregunta original
  ideal: string | string[];       // Respuesta correcta
  completion: CompletionResult;   // Lo que respondió la IA
  score: number;                  // Calificación (0-1, donde 1 = perfecto)
  passed: boolean;                // ¿Pasó la prueba?
  metadata?: Record<string, any>; // Info extra
  reasoning?: string;             // Explicación de la calificación
}
```

**Es como:** La **hoja de respuestas corregida** de un estudiante, con la calificación y comentarios del profesor.

## 💰 Tipos de Costos y Uso

### `TokenUsage` - Resumen de gastos
```typescript
interface TokenUsage {
  total_prompt_tokens: number;        // Total de tokens en preguntas
  total_completion_tokens: number;    // Total de tokens en respuestas
  total_tokens: number;               // Gran total
  average_tokens_per_sample: number;  // Promedio por pregunta
  max_tokens_per_sample: number;      // Máximo en una pregunta
  min_tokens_per_sample: number;      // Mínimo en una pregunta
  estimated_cost: number;             // Costo estimado en dinero
  cost_breakdown?: {                  // Desglose detallado
    prompt_cost: number;              // Costo de preguntas
    completion_cost: number;          // Costo de respuestas
    embedding_cost?: number;          // Costo de comparaciones semánticas
  };
}
```

**Es como:** El **recibo detallado** después de usar un servicio, mostrando exactamente en qué se gastó el dinero.

## 📊 Tipos de Reportes

### `EvalReport` - El reporte final
```typescript
interface EvalReport {
  eval_name: string;              // Nombre del examen
  model: string;                  // Modelo evaluado
  total_samples: number;          // Total de preguntas
  correct: number;                // Respuestas correctas
  incorrect: number;              // Respuestas incorrectas  
  score: number;                  // Calificación general
  results: EvalResult[];          // Todos los resultados detallados
  run_id: string;                 // ID único de esta ejecución
  created_at: string;             // Cuándo se hizo
  duration_ms: number;            // Cuánto tardó (en milisegundos)
  token_usage?: TokenUsage;       // Resumen de costos
  custom_metrics?: CustomMetricResult[]; // Métricas personalizadas
  metadata?: Record<string, any>; // Info adicional
}
```

**Es como:** El **boletín de calificaciones** final, con toda la información del rendimiento del estudiante.

## ⚙️ Tipos de Configuración

### `RunOptions` - Opciones para ejecutar una evaluación
```typescript
interface RunOptions {
  model: string;                    // Qué modelo usar
  eval: string;                     // Qué evaluación ejecutar
  max_samples?: number;             // Máximo de preguntas (opcional)
  registry_path?: string;           // Dónde están las configuraciones
  log_to_file?: string;            // Archivo para guardar logs
  seed?: number;                    // Semilla para reproducibilidad
  temperature?: number;             // "Creatividad" del modelo (0-1)
  max_tokens?: number;              // Límite de tokens por respuesta
  timeout?: number;                 // Tiempo límite en milisegundos
  dry_run?: boolean;                // Solo simular (no ejecutar realmente)
  verbose?: boolean;                // Mostrar información detallada
  // ... más opciones
}
```

**Es como:** El **formulario de configuración** antes de hacer un examen, donde eliges todas las opciones de cómo quieres que se ejecute.

## 🔍 Puntos Clave para Recordar

1. **Los tipos son documentación viva** → Te dicen exactamente qué esperar
2. **El `?` significa opcional** → Puedes incluirlo o no
3. **Los `|` significan "o"** → `'user' | 'assistant'` = puede ser user O assistant
4. **Los tokens cuestan dinero** → Por eso los medimos tan detalladamente
5. **Todo tiene un ID único** → Para poder rastrear y comparar resultados

### 🎯 ¿Por qué es importante entender esto?

Estos tipos son como el **manual de instrucciones** de todo el framework. Una vez que los entiendas, podrás:
- Saber exactamente qué información necesitas para cada función
- Entender los resultados que recibes
- Debuggear problemas más fácilmente
- Crear tus propias extensiones del framework

**¡Siguiente paso:** Vamos a ver cómo se usa todo esto en el punto de entrada principal! 🚀
