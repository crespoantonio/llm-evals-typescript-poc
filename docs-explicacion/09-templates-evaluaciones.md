# 🧪 Templates de Evaluaciones - Los Tipos de Exámenes

## ¿Qué son los Templates de Evaluación?

Los **templates de evaluación** son como **diferentes tipos de exámenes** que un profesor puede usar en su clase:

- **📝 Examen de respuesta única** → Solo hay una respuesta correcta (2+2=4)
- **👩‍🏫 Examen corregido por profesor** → Un experto evalúa la calidad 
- **☑️ Examen de opción múltiple** → Eliges entre opciones predefinidas
- **🧠 Examen de comprensión** → El significado importa más que las palabras exactas

Cada template **sabe cómo evaluar** un tipo específico de respuesta y **dar una calificación justa**.

## 🎯 Los 4 Tipos de Templates

### 1. 🎯 BasicEval - El Examinador Estricto

**¿Cuándo usar?**
- ✅ Preguntas con respuestas exactas y objetivas
- ✅ Matemáticas, fechas, nombres específicos
- ✅ Cuando necesitas precisión absoluta

**Ejemplo de uso:**
```yaml
evaluacion-matematicas:
  id: math.v1
  description: "Evaluación de matemáticas básicas"
  class: BasicEval
  args:
    samples_jsonl: math/basicas.jsonl
    match_type: exact      # exact, includes, fuzzy, regex
    case_sensitive: false  # true/false
```

#### 🔧 Tipos de Comparación

**`exact`** - Matching Exacto
```
Pregunta: "¿Cuánto es 2+2?"
Ideal: "4"
✅ Respuesta: "4" → APRUEBA
❌ Respuesta: "cuatro" → FALLA
❌ Respuesta: "La respuesta es 4" → FALLA
```

**`includes`** - Contiene la Respuesta
```
Pregunta: "¿Cuál es la capital de Francia?"  
Ideal: "París"
✅ Respuesta: "La capital es París" → APRUEBA
✅ Respuesta: "París es la capital" → APRUEBA
❌ Respuesta: "Es una ciudad francesa" → FALLA
```

**`fuzzy`** - Matching Aproximado (para typos)
```
Pregunta: "¿Cómo se llama el autor de Don Quijote?"
Ideal: "Cervantes"
✅ Respuesta: "Cervantes" → APRUEBA
✅ Respuesta: "Servantes" → APRUEBA (typo menor)
✅ Respuesta: "Miguel de Cervantes" → APRUEBA
❌ Respuesta: "Shakespeare" → FALLA
```

**`regex`** - Patrón Regular
```yaml
# Para validar formatos específicos
match_type: regex
ideal: "\\d{4}-\\d{2}-\\d{2}"  # Formato fecha YYYY-MM-DD

✅ Respuesta: "2024-12-31" → APRUEBA
❌ Respuesta: "31/12/2024" → FALLA
```

#### 💡 Ejemplo Práctico Completo

```jsonl
{"input": [{"role": "user", "content": "¿Cuánto es 15 + 27?"}], "ideal": "42"}
{"input": [{"role": "user", "content": "¿En qué año llegó Colón a América?"}], "ideal": ["1492", "En 1492"]}
{"input": [{"role": "user", "content": "¿Cómo se dice 'hello' en francés?"}], "ideal": "bonjour"}
```

**Dataset para múltiples respuestas válidas:**
```jsonl
{"input": [{"role": "user", "content": "¿Cuál es la capital de España?"}], "ideal": ["Madrid", "madrid", "La capital es Madrid"]}
```

### 2. 👩‍🏫 ModelGradedEval - El Profesor de IA

**¿Cuándo usar?**
- ✅ Respuestas abiertas que requieren comprensión
- ✅ Ensayos, explicaciones, análisis
- ✅ Cuando hay múltiples formas correctas de responder
- ✅ Evaluaciones cualitativas

**Ejemplo de configuración:**
```yaml
ensayos-historia:
  id: history-essays.v1
  description: "Evaluación de ensayos históricos por IA"
  class: ModelGradedEval
  args:
    samples_jsonl: historia/ensayos.jsonl
    eval_type: cot_classify           # classify o cot_classify
    grading_model: gpt-4             # Modelo que califica
    grading_prompt: |
      Eres un profesor de historia evaluando ensayos.
      
      PREGUNTA: {input}
      RESPUESTA DEL ESTUDIANTE: {completion}
      RESPUESTA IDEAL: {ideal}
      
      Evalúa la respuesta considerando:
      1. Precisión histórica
      2. Comprensión del tema
      3. Calidad de la argumentación
      
      Responde SOLO con:
      CORRECT - Si la respuesta es correcta y completa
      INCORRECT - Si la respuesta es incorrecta o incompleta
```

#### 🧠 Tipos de Evaluación

**`classify`** - Clasificación Simple
- El modelo califica directamente: CORRECT/INCORRECT
- Más rápido y barato
- Bueno para evaluaciones claras

**`cot_classify`** - Chain of Thought (Razonamiento Paso a Paso)
- El modelo explica su razonamiento primero
- Después da la calificación
- Más preciso pero más caro
- Mejor para evaluaciones complejas

#### 💡 Ejemplo de Dataset

```jsonl
{"input": [{"role": "user", "content": "Explica las causas principales de la Primera Guerra Mundial"}], "ideal": "Las principales causas fueron el imperialismo, el sistema de alianzas, el nacionalismo y el asesinato del archiduque Francisco Fernando"}

{"input": [{"role": "user", "content": "¿Por qué fue importante la Revolución Industrial?"}], "ideal": "Transformó la economía, la sociedad y la tecnología, cambiando de una economía agrícola a una industrial"}
```

### 3. ☑️ ChoiceBasedEval - El Examen Personalizado

**¿Cuándo usar?**
- ✅ Cuando quieres control granular sobre la calificación
- ✅ Evaluaciones con criterios múltiples
- ✅ Calificaciones no binarias (parcialmente correcto)
- ✅ Rubrics complejas de evaluación

**Ejemplo de configuración:**
```yaml
escritura-creativa:
  id: creative-writing.v1
  description: "Evaluación de escritura creativa con criterios múltiples"
  class: ChoiceBasedEval
  args:
    samples_jsonl: escritura/cuentos.jsonl
    grading_model: gpt-4
    prompt: |
      Evalúa este cuento considerando creatividad, gramática y estructura:
      
      CUENTO: {completion}
      CRITERIOS IDEALES: {ideal}
      
      ¿Cómo calificarías este cuento?
    choice_strings: 
      - "EXCELENTE"
      - "BUENO" 
      - "REGULAR"
      - "NECESITA_MEJORA"
    choice_scores:
      EXCELENTE: 1.0
      BUENO: 0.75
      REGULAR: 0.5
      NECESITA_MEJORA: 0.25
```

#### 🎯 Sistema de Puntuación Flexible

```yaml
# Evaluación de traducción con matices
choice_strings: ["PERFECTO", "CASI_PERFECTO", "CORRECTO", "PARCIAL", "INCORRECTO"]
choice_scores:
  PERFECTO: 1.0        # Traducción perfecta
  CASI_PERFECTO: 0.9   # Pequeños detalles menores
  CORRECTO: 0.7        # Correcto pero no idiomático
  PARCIAL: 0.4         # Algunas partes correctas
  INCORRECTO: 0.0      # Completamente incorrecto
```

#### 💡 Ejemplo de Dataset

```jsonl
{"input": [{"role": "user", "content": "Escribe un cuento corto sobre la luna"}], "ideal": "Debe incluir elementos creativos, buena gramática, estructura narrativa clara con inicio, desarrollo y final"}

{"input": [{"role": "user", "content": "Traduce: 'The weather is beautiful today'"}], "ideal": "El clima está hermoso hoy / El tiempo está precioso hoy / Hace un día hermoso"}
```

### 4. 🧠 SemanticSimilarityEval - El Entendedor de Significados

**¿Cuándo usar?**
- ✅ Respuestas conceptuales donde las palabras exactas no importan
- ✅ Sinónimos y paráfrasis son válidos
- ✅ Evaluaciones de comprensión de lectura
- ✅ Cuando el significado es más importante que la forma

**Ejemplo de configuración:**
```yaml
comprension-lectora:
  id: reading-comprehension.v1
  description: "Evaluación por similitud semántica"
  class: SemanticSimilarityEval
  args:
    samples_jsonl: lectura/comprension.jsonl
    threshold: 0.85                    # Mínima similitud para aprobar (0-1)
    embeddings_provider: openai        # openai o local
    embeddings_model: text-embedding-3-small
    match_mode: best                   # best, threshold, all
    cache_embeddings: true            # Cachear para ahorro
```

#### 🎚️ Parámetros Importantes

**`threshold`** - Umbral de Similitud
```yaml
threshold: 0.9   # Muy estricto (90% similitud)
threshold: 0.8   # Estricto (80% similitud)  
threshold: 0.7   # Moderado (70% similitud)
threshold: 0.6   # Relajado (60% similitud)
```

**`match_mode`** - Modo de Comparación
```yaml
match_mode: best      # Usa la mejor puntuación entre múltiples ideales
match_mode: threshold # Todas deben superar el threshold
match_mode: all      # Promedio de todas las comparaciones
```

**`embeddings_provider`** - Proveedor de Embeddings
```yaml
embeddings_provider: openai  # Más preciso, cuesta dinero
embeddings_provider: local   # Gratis, menos preciso
```

#### 💡 Ejemplo Práctico

```jsonl
{"input": [{"role": "user", "content": "¿Qué significa la expresión 'llover a cántaros'?"}], "ideal": ["Llueve mucho", "Llueve intensamente", "Lluvia muy fuerte"]}

{"input": [{"role": "user", "content": "Resume el concepto de fotosíntesis"}], "ideal": "Proceso por el cual las plantas convierten luz solar en energía usando dióxido de carbono y agua"}
```

**Respuestas que aprobarían:**
- "Las plantas usan la luz del sol para crear energía" ✅ (similitud: ~0.82)
- "Conversión de CO2 y H2O en glucosa mediante energía solar" ✅ (similitud: ~0.89)
- "Proceso que hacen las hojas para alimentarse con sol" ✅ (similitud: ~0.76)

## 🔄 Comparación de Templates

| Template | Precisión | Flexibilidad | Costo | Velocidad | Mejor para |
|----------|-----------|--------------|-------|-----------|------------|
| **BasicEval** | 🎯🎯🎯🎯🎯 | ⭐ | 💰 | ⚡⚡⚡ | Respuestas exactas |
| **ModelGraded** | 🎯🎯🎯🎯 | ⭐⭐⭐⭐⭐ | 💰💰💰 | ⚡ | Evaluaciones complejas |
| **ChoiceBased** | 🎯🎯🎯🎯 | ⭐⭐⭐⭐ | 💰💰💰 | ⚡ | Control granular |
| **Semantic** | 🎯🎯🎯 | ⭐⭐⭐ | 💰💰 | ⚡⚡ | Significado conceptual |

## 🛠️ Combinando Templates - Estrategias Avanzadas

### Estrategia 1: Pipeline de Evaluación
```yaml
# Primer filtro: BasicEval para respuestas obvias
matematicas-nivel1:
  class: BasicEval
  args:
    match_type: exact

# Segundo filtro: SemanticSimilarity para casos complejos  
matematicas-nivel2:
  class: SemanticSimilarityEval
  args:
    threshold: 0.8
```

### Estrategia 2: Evaluación por Dominio
```yaml
# Para código: BasicEval (sintaxis exacta)
codigo-sintaxis:
  class: BasicEval
  args:
    case_sensitive: true
    match_type: fuzzy

# Para explicaciones de código: ModelGraded
codigo-explicacion:
  class: ModelGradedEval
  args:
    grading_model: gpt-4
```

### Estrategia 3: Evaluación Multinivel
```yaml
# Nivel básico: ¿Es correcto?
nivel-basico:
  class: BasicEval
  
# Nivel avanzado: ¿Qué tan completo?
nivel-avanzado:
  class: ChoiceBasedEval
  choice_scores:
    COMPLETO: 1.0
    PARCIAL: 0.6
    BASICO: 0.3
```

## 💡 Casos de Uso Reales

### 📚 Evaluación Educativa
```yaml
# Matemáticas elementales
math-elementary:
  class: BasicEval
  args:
    match_type: exact

# Comprensión de lectura  
reading-comprehension:
  class: SemanticSimilarityEval
  args:
    threshold: 0.75

# Ensayos de literatura
literature-essays:
  class: ModelGradedEval
  args:
    eval_type: cot_classify
    grading_model: gpt-4
```

### 💻 Evaluación Técnica
```yaml
# Sintaxis de programación
code-syntax:
  class: BasicEval
  args:
    case_sensitive: true
    match_type: fuzzy

# Explicaciones técnicas
code-explanation:
  class: SemanticSimilarityEval
  args:
    threshold: 0.8

# Revisión de código
code-review:
  class: ChoiceBasedEval
  choice_strings: ["EXCELENTE", "BUENO", "NECESITA_MEJORA", "REFACTORIZAR"]
  choice_scores: {EXCELENTE: 1.0, BUENO: 0.75, NECESITA_MEJORA: 0.5, REFACTORIZAR: 0.2}
```

### 🌍 Evaluación de Idiomas
```yaml
# Vocabulario (respuesta exacta)
vocabulary:
  class: BasicEval
  args:
    match_type: includes
    case_sensitive: false

# Conversación (comprensión)
conversation:
  class: SemanticSimilarityEval
  args:
    threshold: 0.7

# Composición (calidad)
composition:
  class: ModelGradedEval
  args:
    grading_model: gpt-4
    eval_type: cot_classify
```

## 🚨 Errores Comunes y Cómo Evitarlos

### ❌ BasicEval demasiado estricto
```yaml
# Problema: No reconoce respuestas válidas
match_type: exact
ideal: "4"

# Usuario responde: "La respuesta es 4" → FALLA

# ✅ Solución: Usar includes o múltiples ideales
match_type: includes
ideal: ["4", "cuatro", "La respuesta es 4"]
```

### ❌ SemanticSimilarity threshold mal configurado
```yaml
# Problema: Threshold muy alto rechaza respuestas válidas
threshold: 0.95  # Demasiado estricto

# ✅ Solución: Probar diferentes valores
threshold: 0.8   # Más realista
```

### ❌ ModelGraded sin prompt específico
```yaml
# Problema: Prompt genérico da resultados inconsistentes
grading_prompt: "¿Está correcto?"

# ✅ Solución: Prompt específico con criterios claros
grading_prompt: |
  Evalúa si la respuesta matemática es correcta.
  Criterios: método correcto, cálculos precisos, respuesta final correcta.
  Responde CORRECT solo si cumple todos los criterios.
```

## 🎓 Puntos Clave para Recordar

1. **Cada template tiene su propósito específico** → Elige el correcto para tu caso
2. **BasicEval para precisión, otros para flexibilidad** → Balance entre exactitud y comprensión
3. **Los prompts de grading son críticos** → Invierte tiempo en hacerlos bien
4. **Los thresholds necesitan ajuste** → Experimenta para encontrar el balance
5. **Los datasets deben coincidir con el template** → Prepara datos apropiados
6. **La combinación de templates es poderosa** → Una evaluación puede usar varios
7. **El costo aumenta con la complejidad** → BasicEval es gratis, ModelGraded cuesta

### 🎯 Guía de Selección Rápida

**¿Hay una respuesta única y objetiva?** → **BasicEval**
**¿Necesitas evaluar comprensión o creatividad?** → **ModelGradedEval**  
**¿Quieres control granular de puntuaciones?** → **ChoiceBasedEval**
**¿El significado importa más que las palabras exactas?** → **SemanticSimilarityEval**

**¡Siguiente paso:** Vamos a ver cómo funciona el sistema de caché que ahorra dinero! ⚡
