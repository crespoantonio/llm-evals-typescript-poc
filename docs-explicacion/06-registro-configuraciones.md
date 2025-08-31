# 📋 Registro de Configuraciones - El Catálogo del Framework

## ¿Qué es el Registry?

El **Registry** es como el **catálogo de una biblioteca**: organiza y mantiene un registro de todas las evaluaciones disponibles. Imagina una biblioteca donde cada libro (evaluación) tiene su ficha con:

- **📖 Título y descripción** → Qué evalúa
- **🔧 Instrucciones de uso** → Cómo configurarlo  
- **📊 Tipo de examen** → BasicEval, ModelGradedEval, etc.
- **📁 Ubicación de datos** → Dónde están las preguntas

## 🏗️ Estructura de Directorios

```
mi-proyecto/
├── registry/                    ← Carpeta principal del catálogo
│   ├── evals/                  ← Configuraciones de evaluaciones
│   │   ├── matematicas.yaml    ← Evaluaciones de matemáticas
│   │   ├── historia.yaml       ← Evaluaciones de historia  
│   │   └── programacion.yaml   ← Evaluaciones de código
│   └── data/                   ← Datasets de preguntas
│       ├── math/
│       │   └── basicas.jsonl
│       └── historia/
│           └── mundial.jsonl
```

**Es como:** Una biblioteca bien organizada con **catálogos por materia** y **libros en estanterías separadas**.

## 📄 Archivos YAML - El Lenguaje del Catálogo

### ¿Qué es YAML?
**YAML** es como **llenar un formulario estructurado** pero más amigable que JSON:

```yaml
# ✅ YAML (fácil de leer y escribir)
nombre: Juan Pérez  
edad: 25
hobbies:
  - programar
  - leer
  - viajar
```

```json
// ❌ JSON equivalente (más difícil para humanos)
{
  "nombre": "Juan Pérez",
  "edad": 25, 
  "hobbies": ["programar", "leer", "viajar"]
}
```

### Estructura de una Evaluación

```yaml
math-basic:                           # 🏷️ Nombre de la evaluación
  id: math-basic.dev.v0              # 🆔 ID único y versionado
  description: "Evaluación básica de matemáticas con matching exacto"
  metrics: ["accuracy"]              # 📊 Métricas que se calculan
  class: BasicEval                   # 🧪 Tipo de evaluación
  args:                              # ⚙️ Configuración específica
    samples_jsonl: math/basic.jsonl  # 📁 Archivo de preguntas
    match_type: exact                # 🎯 Tipo de comparación
    case_sensitive: false            # 🔤 Sensible a mayúsculas/minúsculas
```

**Es como una ficha de biblioteca:**
- **🏷️ Nombre** → Para encontrarla fácilmente
- **🆔 ID** → Identificación única (con versión)
- **📝 Descripción** → Qué hace esta evaluación
- **📊 Métricas** → Qué se va a medir
- **🧪 Clase** → Qué tipo de examen es
- **⚙️ Args** → Configuración detallada

## 🔧 Funcionamiento Interno del Registry

### 1. 📂 Carga de Configuraciones

```typescript
async loadRegistry(): Promise<void> {
  const evalsDir = path.join(this.registryPath, 'evals');
  
  // 🔍 1. Buscar todos los archivos .yaml/.yml
  const files = fs.readdirSync(evalsDir).filter(file => 
    file.endsWith('.yaml') || file.endsWith('.yml')
  );

  // 📖 2. Leer cada archivo  
  for (const file of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = yaml.parse(content);      // Parsear YAML
    
    // ✅ 3. Validar y guardar configuraciones
    Object.entries(data).forEach(([key, config]) => {
      if (this.isValidConfig(config)) {
        this.configs[key] = config;
      }
    });
  }
}
```

**Es como:** Un bibliotecario que revisa cada ficha, verifica que esté completa, y la archiva en el catálogo.

### 2. ✅ Validación de Configuraciones

```typescript
private isValidConfig(config: any): boolean {
  return (
    config &&
    typeof config.id === 'string' &&           // ✅ Debe tener ID
    typeof config.description === 'string' &&  // ✅ Debe tener descripción
    Array.isArray(config.metrics) &&           // ✅ Métricas debe ser array
    typeof config.class === 'string' &&        // ✅ Debe especificar tipo
    config.args &&                             // ✅ Debe tener configuración
    typeof config.args === 'object'            // ✅ Args debe ser objeto
  );
}
```

**Errores comunes que detecta:**

```yaml
❌ # Falta descripción
math-test:
  id: math-test.v1
  metrics: ["accuracy"]
  class: BasicEval

✅ # Configuración válida  
math-test:
  id: math-test.v1
  description: "Evaluación de matemáticas"
  metrics: ["accuracy"] 
  class: BasicEval
  args:
    samples_jsonl: math.jsonl
```

### 3. 🏭 Creación de Templates

```typescript
createTemplate(evalName: string, gradingClient?: LLMClient): EvalTemplate {
  const config = this.getConfig(evalName);
  const className = config.class;

  switch (className) {
    case 'BasicEval':
      return new BasicEval(config.args);
      
    case 'ModelGradedEval':
      return new ModelGradedEval(config.args, gradingClient);
      
    case 'SemanticSimilarityEval':
      return new SemanticSimilarityEval(config.args);
      
    default:
      throw new Error(`Unknown evaluation template: ${className}`);
  }
}
```

**Es como:** Una fábrica que lee las especificaciones y crea el tipo correcto de examen.

## 📝 Tipos de Evaluaciones Disponibles

### 1. 🎯 BasicEval - Comparación Exacta

```yaml
evaluacion-simple:
  id: simple.v1
  description: "Evaluación con respuestas exactas"
  metrics: ["accuracy"]
  class: BasicEval
  args:
    samples_jsonl: preguntas-simples.jsonl
    match_type: exact        # exact, includes, fuzzy, regex
    case_sensitive: false    # true/false
```

**¿Cuándo usar?**
- ✅ Preguntas con respuestas únicas y específicas
- ✅ Matemáticas, fechas, nombres propios
- ❌ Preguntas abiertas o creativas

### 2. 🧠 ModelGradedEval - Calificado por IA

```yaml
evaluacion-gradeada:
  id: graded.v1  
  description: "IA califica las respuestas"
  metrics: ["accuracy", "reasoning_quality"]
  class: ModelGradedEval
  args:
    samples_jsonl: preguntas-abiertas.jsonl
    eval_type: classify              # classify, cot_classify
    grading_model: gpt-4            # Modelo que califica
    grading_prompt: |               # Prompt personalizado
      Evalúa si la respuesta del estudiante es correcta.
      Respuesta del estudiante: {completion}
      Respuesta ideal: {ideal}
      
      Califica como CORRECT si la respuesta es factualmente correcta,
      aunque use palabras diferentes.
```

**¿Cuándo usar?**
- ✅ Preguntas abiertas que requieren comprensión
- ✅ Ensayos, explicaciones, análisis
- ✅ Cuando hay múltiples formas correctas de responder

### 3. 🎲 ChoiceBasedEval - Opción Múltiple

```yaml
evaluacion-opciones:
  id: choice.v1
  description: "Evaluación de opción múltiple"
  metrics: ["accuracy"]
  class: ChoiceBasedEval
  args:
    samples_jsonl: opciones-multiples.jsonl
    prompt: |
      Pregunta: {input}
      Respuesta del modelo: {completion}
      Respuesta correcta: {ideal}
      
      ¿La respuesta es correcta?
    choice_strings: ["CORRECT", "INCORRECT"]
    choice_scores:
      CORRECT: 1.0
      INCORRECT: 0.0
    grading_model: gpt-3.5-turbo
```

**¿Cuándo usar?**
- ✅ Cuando quieres control granular sobre la calificación
- ✅ Evaluaciones con múltiples criterios
- ✅ Calificaciones no binarias (parcialmente correcto)

### 4. 🧠 SemanticSimilarityEval - Significado

```yaml
evaluacion-semantica:
  id: semantic.v1
  description: "Evaluación por similitud de significado"
  metrics: ["accuracy", "semantic_similarity"]
  class: SemanticSimilarityEval
  args:
    samples_jsonl: preguntas-conceptuales.jsonl
    threshold: 0.85                 # Mínima similitud para aprobar
    embeddings_provider: openai     # openai, local
    embeddings_model: text-embedding-3-small
    match_mode: best               # best, threshold, all
    cache_embeddings: true         # Cachear para ahorro
```

**¿Cuándo usar?**
- ✅ Respuestas conceptuales donde las palabras exactas no importan
- ✅ Sinónimos y paráfrasis son válidos
- ✅ Evaluaciones de comprensión de lectura

## 💡 Ejemplos Prácticos

### 📚 Ejemplo 1: Evaluación de Matemáticas

**Archivo:** `registry/evals/matematicas.yaml`

```yaml
# Matemáticas básicas para principiantes
suma-basica:
  id: suma-basica.v1
  description: "Evaluación de sumas básicas con números de 1-2 dígitos"
  metrics: ["accuracy"]
  class: BasicEval
  args:
    samples_jsonl: math/sumas-basicas.jsonl
    match_type: exact
    case_sensitive: false

# Matemáticas avanzadas
algebra-compleja:
  id: algebra.v2
  description: "Problemas de álgebra evaluados por GPT-4"
  metrics: ["accuracy", "step_by_step_reasoning"]
  class: ModelGradedEval
  args:
    samples_jsonl: math/algebra-avanzada.jsonl
    eval_type: cot_classify  # Chain-of-thought
    grading_model: gpt-4
    grading_prompt: |
      Evalúa la solución paso a paso:
      1. ¿El método es correcto?
      2. ¿Los cálculos son precisos?
      3. ¿La respuesta final es correcta?
      
      Problema: {input}
      Respuesta del estudiante: {completion}
      Respuesta esperada: {ideal}
```

### 🌍 Ejemplo 2: Evaluación de Historia

**Archivo:** `registry/evals/historia.yaml`

```yaml
# Fechas históricas exactas
fechas-importantes:
  id: fechas.v1
  description: "Fechas históricas importantes - matching exacto"
  metrics: ["accuracy"]
  class: BasicEval
  args:
    samples_jsonl: historia/fechas-importantes.jsonl
    match_type: includes  # Permite "1492" o "en 1492"
    case_sensitive: false

# Análisis histórico
ensayos-historia:
  id: ensayos-historia.v1  
  description: "Análisis de eventos históricos evaluados semánticamente"
  metrics: ["accuracy", "semantic_similarity", "depth_of_analysis"]
  class: SemanticSimilarityEval
  args:
    samples_jsonl: historia/ensayos-analisis.jsonl
    threshold: 0.75  # Menos estricto para ensayos
    embeddings_provider: openai
    match_mode: best
```

### 💻 Ejemplo 3: Evaluación de Programación

**Archivo:** `registry/evals/programacion.yaml`

```yaml
# Sintaxis básica
sintaxis-python:
  id: python-syntax.v1
  description: "Sintaxis básica de Python - matching exacto"
  metrics: ["accuracy"]
  class: BasicEval
  args:
    samples_jsonl: codigo/python-basico.jsonl
    match_type: fuzzy  # Permite pequeñas diferencias de formato
    case_sensitive: true  # El código SÍ es sensible a mayúsculas

# Lógica de programación
logica-algoritmos:
  id: algorithms.v1
  description: "Evaluación de lógica algorítmica por modelo"
  metrics: ["accuracy", "code_efficiency", "readability"]
  class: ModelGradedEval
  args:
    samples_jsonl: codigo/algoritmos.jsonl
    eval_type: classify
    grading_model: gpt-4
    grading_prompt: |
      Evalúa el código considerando:
      1. ¿Resuelve el problema correctamente?
      2. ¿La lógica es eficiente?
      3. ¿Es legible y está bien estructurado?
      
      Problema: {input}
      Código del estudiante: {completion}
      Solución de referencia: {ideal}
```

## 🛠️ Uso Práctico del Registry

### Crear un Registry desde cero:

```typescript
import { Registry } from './registry';

async function crearMiRegistry() {
  // 1. 🏗️ Crear estructura de directorios
  await Registry.createDefaultRegistry('./mi-registry');

  // 2. 📋 Cargar el registry
  const registry = new Registry('./mi-registry');
  await registry.loadRegistry();

  // 3. 📊 Ver evaluaciones disponibles
  const evaluaciones = registry.listEvals();
  console.log('Evaluaciones disponibles:', evaluaciones);
  
  // 4. 🔍 Obtener configuración específica
  const config = registry.getConfig('math-basic');
  console.log('Configuración:', config);
  
  // 5. 🏭 Crear template de evaluación
  const template = registry.createTemplate('math-basic');
  
  // 6. 📁 Obtener ruta del dataset
  const datasetPath = registry.getDatasetPath('math-basic');
  console.log('Dataset en:', datasetPath);
}
```

### Gestionar múltiples versiones:

```yaml
# Archivo: registry/evals/matematicas.yaml
suma-basica:
  id: suma-basica.v1
  description: "Versión básica - solo números pequeños"
  class: BasicEval
  args:
    samples_jsonl: math/sumas-v1.jsonl

suma-basica.v2:
  id: suma-basica.v2  
  description: "Versión avanzada - números más grandes"
  class: BasicEval
  args:
    samples_jsonl: math/sumas-v2.jsonl
    
suma-basica.dev:
  id: suma-basica.dev
  description: "Versión de desarrollo - dataset pequeño"
  class: BasicEval
  args:
    samples_jsonl: math/sumas-dev.jsonl
```

## 🚨 Errores Comunes y Soluciones

### ❌ "Registry directory not found"

```typescript
// Problema: Ruta incorrecta
const registry = new Registry('./no-existe');

// ✅ Solución: Verificar y crear estructura
await Registry.createDefaultRegistry('./mi-registry');
const registry = new Registry('./mi-registry');
```

### ❌ "Evaluation 'xyz' not found in registry"

```typescript
// Problema: Nombre de evaluación incorrecto
const config = registry.getConfig('matematicas');  // No existe

// ✅ Solución: Verificar nombres disponibles
const disponibles = registry.listEvals();
console.log('Disponibles:', disponibles);
const config = registry.getConfig('math-basic');  // ✅ Correcto
```

### ❌ "samples_jsonl not specified"

```yaml
❌ # Falta especificar el dataset
mi-evaluacion:
  id: test.v1
  description: "Evaluación de prueba"
  metrics: ["accuracy"]
  class: BasicEval
  args:
    match_type: exact

✅ # Con dataset especificado
mi-evaluacion:
  id: test.v1
  description: "Evaluación de prueba" 
  metrics: ["accuracy"]
  class: BasicEval
  args:
    samples_jsonl: mi-dataset.jsonl  # ✅ Agregado
    match_type: exact
```

## 🎯 Mejores Prácticas

### 📛 Nomenclatura de IDs
```yaml
# ✅ Buena práctica: nombreclaro.entorno.version
math-basic.prod.v2      # Producción, versión 2
math-basic.dev.v1       # Desarrollo, versión 1
history-essay.test.v3   # Testing, versión 3

# ❌ Evitar:
math1                   # Sin contexto
test-eval-final-v2-new  # Demasiado largo y confuso
```

### 📁 Organización de Archivos
```
registry/
├── evals/
│   ├── matematicas.yaml       # Por materia
│   ├── ciencias.yaml
│   └── idiomas.yaml
├── data/
│   ├── math/                  # Datasets organizados
│   │   ├── basicas.jsonl
│   │   └── avanzadas.jsonl
│   ├── ciencias/
│   └── idiomas/
```

### 🔄 Versionado
- **v1, v2, v3** → Versiones estables
- **dev** → En desarrollo
- **test** → Para testing
- **prod** → Producción actual

## 🎓 Puntos Clave para Recordar

1. **El Registry es el catálogo central** → Todo empieza aquí
2. **YAML es más amigable que JSON** → Fácil de leer y editar
3. **La validación previene errores** → Configuraciones incorrectas fallan temprano
4. **Versionado permite evolución** → Mantén versiones para comparar
5. **Organización por temas** → Facilita el mantenimiento
6. **Rutas relativas al registry** → Portabilidad del proyecto

**¡Siguiente paso:** Vamos a ver cómo funciona el sistema de logging para rastrear todo lo que pasa! 📝
