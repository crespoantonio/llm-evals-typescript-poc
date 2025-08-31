# 📊 Cargador de Datos - El Organizador de Exámenes

## ¿Qué es el Cargador de Datos?

El **Cargador de Datos** (`dataset-loader.ts`) es como un **profesor organizando exámenes**. Su trabajo es:

1. **📂 Leer archivos de preguntas** → Como abrir un cuadernillo de examen
2. **✅ Verificar que todo esté correcto** → Como revisar que no falten páginas
3. **📝 Convertir al formato estándar** → Como pasar las preguntas a un formato uniforme
4. **💾 Guardar resultados** → Como archivar exámenes corregidos

## 📋 ¿Qué es un Dataset?

Un **dataset** es como un **cuadernillo de examen completo** que contiene:

- **🔢 Múltiples preguntas** (samples)
- **❓ Cada pregunta tiene su conversación** (input) 
- **✅ Cada pregunta tiene su respuesta correcta** (ideal)
- **📓 Información adicional opcional** (metadata)

### Ejemplo Visual de un Dataset:

```
📖 CUADERNILLO DE EXAMEN: Matemáticas Básicas
┌─────────────────────────────────────────┐
│ Pregunta 1:                             │
│ 👤 Usuario: "¿Cuánto es 2 + 3?"        │
│ ✅ Respuesta correcta: "5"             │
│ 📝 Nota: "Suma básica"                 │
├─────────────────────────────────────────┤
│ Pregunta 2:                             │
│ 🤖 Sistema: "Eres un tutor matemático" │
│ 👤 Usuario: "¿Cuánto es 10 - 4?"       │
│ ✅ Respuesta correcta: "6"             │
│ 📝 Nota: "Resta básica"                │
└─────────────────────────────────────────┘
```

## 📁 Formato JSONL - ¿Qué es esto?

**JSONL** = **JSON Lines** = Un archivo donde cada línea es un objeto JSON separado

### ❌ NO es JSON normal:
```json
{
  "preguntas": [
    {"input": [...], "ideal": "5"},
    {"input": [...], "ideal": "6"}
  ]
}
```

### ✅ SÍ es JSONL:
```jsonl
{"input": [{"role": "user", "content": "¿Cuánto es 2 + 3?"}], "ideal": "5"}
{"input": [{"role": "user", "content": "¿Cuánto es 10 - 4?"}], "ideal": "6"}
```

**¿Por qué JSONL?**
- **📈 Eficiente para archivos grandes** → Cargas línea por línea
- **🔧 Fácil de procesar** → Una pregunta por línea
- **💾 Menos memoria** → No cargas todo de una vez
- **🛠️ Estándar en ML** → Lo usan todos los frameworks de IA

## 🔍 Las Tres Funciones Principales

### 1. 📂 `loadDataset()` - Leer Exámenes

```typescript
const dataset = await loadDataset('examen-matematicas.jsonl');
```

**¿Qué hace por dentro?**

```typescript
// 1. 🔍 Verificar que el archivo existe
if (!fs.existsSync(filePath)) {
  throw new Error(`Dataset file not found: ${filePath}`);
}

// 2. 📖 Leer el archivo completo
const content = fs.readFileSync(filePath, 'utf-8');

// 3. ✂️ Dividir en líneas
const lines = content.trim().split('\n');

// 4. 🔄 Procesar cada línea
for (let i = 0; i < lines.length; i++) {
  const data = JSON.parse(lines[i]);           // Parsear JSON
  const sample = validateSample(data, i + 1);  // Validar estructura
  samples.push(sample);                        // Agregar a la lista
}
```

**Es como:** Un profesor leyendo cada pregunta del examen, verificando que esté bien escrita y que tenga respuesta.

### 2. ✅ `validateSample()` - El Control de Calidad

Esta función es como un **inspector de calidad** que verifica cada pregunta:

```typescript
// ✅ Verifica que la conversación sea un array válido
if (!Array.isArray(data.input)) {
  throw new Error("'input' debe ser un array");
}

// ✅ Verifica cada mensaje de la conversación  
for (let i = 0; i < data.input.length; i++) {
  const msg = data.input[i];
  
  // ¿Tiene rol válido? (system, user, assistant)
  if (!['system', 'user', 'assistant'].includes(msg.role)) {
    throw new Error("rol debe ser 'system', 'user', o 'assistant'");
  }
  
  // ¿El contenido es texto?
  if (typeof msg.content !== 'string') {
    throw new Error("el contenido debe ser texto");
  }
}

// ✅ Verifica que haya respuesta ideal
if (data.ideal === undefined || data.ideal === null) {
  throw new Error("'ideal' es requerido");
}
```

**Errores comunes que detecta:**

```jsonl
❌ {"input": "texto plano", "ideal": "5"}
✅ {"input": [{"role": "user", "content": "texto"}], "ideal": "5"}

❌ {"input": [{"role": "invalid", "content": "texto"}], "ideal": "5"}  
✅ {"input": [{"role": "user", "content": "texto"}], "ideal": "5"}

❌ {"input": [{"role": "user", "content": 123}], "ideal": "5"}
✅ {"input": [{"role": "user", "content": "123"}], "ideal": "5"}

❌ {"input": [{"role": "user", "content": "texto"}]}
✅ {"input": [{"role": "user", "content": "texto"}], "ideal": "5"}
```

### 3. 💾 `saveDataset()` - Guardar Resultados

```typescript
await saveDataset(dataset, 'resultados-evaluacion.jsonl');
```

**¿Qué hace?**
1. **📁 Crea la carpeta** si no existe
2. **🔄 Convierte cada sample a JSON** 
3. **📝 Escribe línea por línea** al archivo

```typescript
// 1. Crear directorio si no existe
const dir = path.dirname(filePath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// 2. Convertir samples a líneas JSONL
const lines = dataset.samples.map(sample => JSON.stringify({
  input: sample.input,
  ideal: sample.ideal,
  ...(sample.metadata ? { metadata: sample.metadata } : {}),
}));

// 3. Escribir archivo
fs.writeFileSync(filePath, lines.join('\n'));
```

## 🛠️ Función Auxiliar: `createSampleDataset()`

Esta función es como un **generador automático de exámenes** para cuando quieres crear datasets programáticamente:

```typescript
const dataset = createSampleDataset([
  {
    systemPrompt: "Eres un tutor de matemáticas",
    userInput: "¿Cuánto es 5 + 3?",
    ideal: "8",
    metadata: { difficulty: "easy", topic: "addition" }
  },
  {
    userInput: "¿Cuál es la capital de Francia?",
    ideal: "París",
    metadata: { difficulty: "easy", topic: "geography" }
  }
]);
```

**Se convierte automáticamente en:**
```typescript
{
  samples: [
    {
      input: [
        { role: 'system', content: 'Eres un tutor de matemáticas' },
        { role: 'user', content: '¿Cuánto es 5 + 3?' }
      ],
      ideal: '8',
      metadata: { difficulty: 'easy', topic: 'addition' }
    },
    {
      input: [
        { role: 'user', content: '¿Cuál es la capital de Francia?' }
      ],
      ideal: 'París', 
      metadata: { difficulty: 'easy', topic: 'geography' }
    }
  ]
}
```

## 💡 Ejemplo Práctico Completo

### Crear un dataset desde cero:

```typescript
import { createSampleDataset, saveDataset, loadDataset } from './dataset-loader';

async function ejemploCompleto() {
  // 1. 🏗️ Crear dataset programáticamente
  const miDataset = createSampleDataset([
    {
      systemPrompt: "Responde solo con números",
      userInput: "¿Cuánto es 15 + 27?",
      ideal: "42",
      metadata: { operación: "suma", dificultad: 1 }
    },
    {
      systemPrompt: "Responde solo con números", 
      userInput: "¿Cuánto es 100 - 58?",
      ideal: "42",
      metadata: { operación: "resta", dificultad: 2 }
    }
  ]);

  // 2. 💾 Guardar a archivo
  await saveDataset(miDataset, 'mi-examen-matematicas.jsonl');

  // 3. 📂 Cargar de vuelta (para verificar)
  const datasetCargado = await loadDataset('mi-examen-matematicas.jsonl');
  
  console.log(`✅ Dataset creado con ${datasetCargado.samples.length} preguntas`);
  console.log(`📅 Creado en: ${datasetCargado.metadata?.loaded_at}`);
}
```

### El archivo generado se ve así:

```jsonl
{"input":[{"role":"system","content":"Responde solo con números"},{"role":"user","content":"¿Cuánto es 15 + 27?"}],"ideal":"42","metadata":{"operación":"suma","dificultad":1}}
{"input":[{"role":"system","content":"Responde solo con números"},{"role":"user","content":"¿Cuánto es 100 - 58?"}],"ideal":"42","metadata":{"operación":"resta","dificultad":2}}
```

## 🎯 Casos de Uso Reales

### 📚 Para Evaluaciones Educativas:
```typescript
const datasetEducativo = createSampleDataset([
  {
    systemPrompt: "Eres un tutor de historia mundial",
    userInput: "¿En qué año comenzó la Primera Guerra Mundial?", 
    ideal: ["1914", "En 1914"],
    metadata: { materia: "historia", periodo: "siglo XX" }
  }
]);
```

### 🧪 Para Evaluaciones Técnicas:
```typescript  
const datasetTécnico = createSampleDataset([
  {
    systemPrompt: "Responde solo con código Python válido",
    userInput: "Función para calcular factorial",
    ideal: "def factorial(n):\n    return 1 if n <= 1 else n * factorial(n-1)",
    metadata: { lenguaje: "python", algoritmo: "recursión" }
  }
]);
```

### 🎭 Para Evaluaciones Creativas:
```typescript
const datasetCreativo = createSampleDataset([
  {
    userInput: "Escribe un haiku sobre la lluvia",
    ideal: ["Gotas cristalinas\nDanzan sobre hojas verdes\nPaz en el jardín"],
    metadata: { tipo: "poesía", forma: "haiku", tema: "naturaleza" }
  }
]);
```

## 🚨 Errores Comunes y Cómo Evitarlos

### ❌ Error: "Dataset file not found"
```typescript
// Problema: Ruta incorrecta
await loadDataset('no-existe.jsonl');

// ✅ Solución: Verificar ruta y archivo
const fs = require('fs');
if (fs.existsSync('mi-dataset.jsonl')) {
  const dataset = await loadDataset('mi-dataset.jsonl');
}
```

### ❌ Error: "Invalid JSON at line X"
```jsonl
// Problema: JSON malformado
{"input": [{"role": "user", "content": "pregunta"}] "ideal": "respuesta"}

// ✅ Solución: Coma faltante
{"input": [{"role": "user", "content": "pregunta"}], "ideal": "respuesta"}
```

### ❌ Error: "'input' must be an array"
```jsonl  
// Problema: input como string
{"input": "¿Cuánto es 2+2?", "ideal": "4"}

// ✅ Solución: input como array de mensajes
{"input": [{"role": "user", "content": "¿Cuánto es 2+2?"}], "ideal": "4"}
```

## 🎓 Puntos Clave para Recordar

1. **JSONL es línea por línea** → Un JSON por línea, no un JSON gigante
2. **Validación estricta** → Mejor fallar temprano que tener datos corruptos
3. **Metadata es opcional** → Pero muy útil para organizar y filtrar
4. **Input siempre es array** → Aunque sea un solo mensaje
5. **Ideal puede ser string o array** → Para múltiples respuestas válidas
6. **Los errores son descriptivos** → Te dicen exactamente qué línea y qué problema

**¡Siguiente paso:** Vamos a ver cómo el EvalRunner orquesta todo el proceso de evaluación! 🎭
