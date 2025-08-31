# 🧠 Embeddings y Similitud Semántica - El Traductor de Significados

## ¿Qué son los Embeddings?

Los **embeddings** son como **traductores universales de significados**. Imagina que puedes convertir cualquier texto en un "código numérico" que representa su significado, de tal manera que:

- **Textos con significado similar** → Códigos numéricos similares
- **Textos con significado diferente** → Códigos numéricos diferentes

**Analogía:** Es como asignar coordenadas GPS a cada idea. Ideas relacionadas estarán "cerca" en el mapa conceptual, ideas no relacionadas estarán "lejos".

### Ejemplo Visual:

```
"El gato está feliz" → [0.2, 0.8, 0.1, 0.5, ...] (1536 números)
"El felino se encuentra contento" → [0.21, 0.79, 0.11, 0.49, ...] 

Distancia entre vectores = 0.05 (¡Muy similar!)

"El auto es rojo" → [0.7, 0.1, 0.9, 0.2, ...]

Distancia a los anteriores = 0.83 (¡Muy diferente!)
```

## 🔄 ¿Cómo Funciona la Similitud Semántica?

### Paso 1: 📝 Convertir Texto a Números
```typescript
const texto1 = "El perro corre rápido";
const embedding1 = await embeddings.embed(texto1);
// Resultado: [0.1, 0.3, 0.7, 0.2, 0.9, ...] (1536 dimensiones)

const texto2 = "El can se mueve velozmente";  
const embedding2 = await embeddings.embed(texto2);
// Resultado: [0.11, 0.29, 0.71, 0.19, 0.91, ...] (1536 dimensiones)
```

### Paso 2: 📐 Calcular Similitud
```typescript
const similitud = cosineSimilarity(embedding1, embedding2);
// Resultado: 0.87 (87% similares)

// Interpretación:
// 0.9-1.0 = Prácticamente idénticos
// 0.8-0.9 = Muy similares  
// 0.7-0.8 = Moderadamente similares
// 0.6-0.7 = Algo similares
// 0.0-0.6 = Poco o nada similares
```

### Paso 3: ✅ Decidir si Pasa la Evaluación
```typescript
const threshold = 0.8;  // Umbral del 80%
const pasa = similitud >= threshold;

console.log(`Similitud: ${similitud.toFixed(3)} - ${pasa ? 'PASA' : 'FALLA'}`);
// Similitud: 0.870 - PASA
```

## 🏭 Proveedores de Embeddings

### 1. 🏢 OpenAI Embeddings (Recomendado)

```typescript
import { OpenAIEmbeddingsProvider } from './embeddings-service';

const provider = new OpenAIEmbeddingsProvider('text-embedding-3-small');

// Características:
// ✅ Muy precisos y consistentes
// ✅ Optimizados para múltiples idiomas
// ✅ Dimensiones configurables
// ❌ Cuestan dinero por uso
// ❌ Requieren conexión a internet
```

**Modelos disponibles:**
```typescript
'text-embedding-3-small'  // $0.00002 per 1K tokens - Recomendado
'text-embedding-3-large'  // $0.00013 per 1K tokens - Más preciso
'text-embedding-ada-002'  // $0.00010 per 1K tokens - Anterior generación
```

### 2. 🏠 Local Embeddings (Experimental)

```typescript
import { LocalEmbeddingsProvider } from './embeddings-service';

const provider = new LocalEmbeddingsProvider();

// Características:
// ✅ Gratis una vez instalado
// ✅ Privacidad total
// ✅ Funciona offline
// ❌ Menos preciso
// ❌ Requiere recursos computacionales
// ❌ Más lento
```

## 🛠️ Usando el Sistema de Embeddings

### Configuración Básica

```yaml
# En tu registry/evals/comprension.yaml
comprension-lectura:
  id: reading.v1
  description: "Evaluación de comprensión usando similitud semántica"
  class: SemanticSimilarityEval
  args:
    samples_jsonl: lectura/comprension.jsonl
    threshold: 0.8                      # 80% similitud mínima
    embeddings_provider: openai         # openai o local
    embeddings_model: text-embedding-3-small
    match_mode: best                    # best, threshold, all
    cache_embeddings: true             # Cachear embeddings
```

### Ejemplo de Dataset

```jsonl
{"input": [{"role": "user", "content": "¿Qué significa 'biodiversidad'?"}], "ideal": ["La variedad de vida en el planeta", "Diversidad de especies y ecosistemas", "Riqueza de seres vivos en la naturaleza"]}

{"input": [{"role": "user", "content": "Explica la fotosíntesis"}], "ideal": "Proceso por el cual las plantas convierten luz solar en energía usando CO2 y agua"}
```

### Uso Programático

```typescript
import { 
  SemanticSimilarityService, 
  createEmbeddingsProvider,
  cosineSimilarity 
} from './embeddings/embeddings-service';

async function ejemploUso() {
  // 1. Crear proveedor
  const provider = createEmbeddingsProvider('openai', 'text-embedding-3-small');
  
  // 2. Crear servicio
  const service = new SemanticSimilarityService(provider);
  
  // 3. Comparar textos
  const similitud = await service.calculateSimilarity(
    "El gato duerme en la cama",
    "Un felino descansa sobre el colchón"
  );
  
  console.log(`Similitud: ${similitud.toFixed(3)}`); // 0.847
  
  // 4. Comparar con múltiples opciones
  const respuestaEstudiante = "Las plantas usan el sol para hacer comida";
  const respuestasCorrectas = [
    "La fotosíntesis convierte luz solar en energía",
    "Las plantas transforman luz en glucosa",
    "Conversión de CO2 y agua en azúcar usando luz"
  ];
  
  const mejorSimilitud = await service.findBestMatch(
    respuestaEstudiante,
    respuestasCorrectas
  );
  
  console.log(`Mejor match: ${mejorSimilitud.score.toFixed(3)} con "${mejorSimilitud.text}"`);
}
```

## 🎚️ Parámetros de Configuración

### `threshold` - Umbral de Similitud

```yaml
threshold: 0.9   # Muy estricto (solo respuestas casi idénticas)
threshold: 0.8   # Estricto (respuestas muy similares)
threshold: 0.7   # Moderado (respuestas moderadamente similares)
threshold: 0.6   # Relajado (respuestas algo similares)
threshold: 0.5   # Muy relajado (puede aceptar respuestas marginales)
```

**¿Cómo elegir?**
- **Matemáticas/Ciencias exactas** → 0.8-0.9 (precisión importante)
- **Comprensión de lectura** → 0.7-0.8 (permitir paráfrasis)
- **Preguntas creativas** → 0.6-0.7 (múltiples enfoques válidos)

### `match_mode` - Modo de Comparación

```yaml
match_mode: best      # Usa la MEJOR similitud entre múltiples ideales
match_mode: threshold # TODOS los ideales deben superar el threshold
match_mode: all       # PROMEDIO de similitudes con todos los ideales
```

**Ejemplo práctico:**
```jsonl
{"ideal": ["París", "La capital de Francia es París", "París es la capital francesa"]}
```

**Con `match_mode: best`:**
- Respuesta: "París" → Compara con los 3, usa el mejor resultado (1.0)

**Con `match_mode: threshold`:**
- Respuesta: "París" → TODOS deben superar threshold para aprobar

**Con `match_mode: all`:**
- Respuesta: "París" → Promedia las 3 similitudes

### `cache_embeddings` - Caché de Embeddings

```yaml
cache_embeddings: true   # Recomendado - ahorra dinero y tiempo
cache_embeddings: false  # Solo si los textos cambian constantemente
```

**¿Por qué usar caché?**
- **💰 Ahorro**: No pagas por el mismo embedding dos veces
- **⚡ Velocidad**: Embeddings cacheados son instantáneos
- **🔄 Consistencia**: Mismos textos → mismos embeddings

## 📊 Casos de Uso Reales

### 📚 Evaluación Educativa

```yaml
# Comprensión de conceptos
conceptos-biologia:
  class: SemanticSimilarityEval
  args:
    threshold: 0.75  # Moderado - permite explicaciones variadas
    match_mode: best
```

```jsonl
{"input": [{"role": "user", "content": "¿Qué es la mitosis?"}], "ideal": ["División celular que produce dos células idénticas", "Proceso de reproducción celular", "División del núcleo celular en dos partes iguales"]}
```

**Respuestas que aprobarían:**
- "División de células en dos partes iguales" ✅ (0.82)
- "Proceso donde una célula se divide en dos" ✅ (0.78) 
- "Reproducción celular que crea células idénticas" ✅ (0.85)

### 💻 Evaluación de Código - Explicaciones

```yaml
# Comprensión de conceptos de programación  
conceptos-programacion:
  class: SemanticSimilarityEval
  args:
    threshold: 0.8   # Más estricto - terminología técnica importante
    match_mode: best
```

```jsonl
{"input": [{"role": "user", "content": "¿Qué es recursión?"}], "ideal": ["Función que se llama a sí misma", "Método que se invoca recursivamente", "Técnica donde una función se ejecuta dentro de sí misma"]}
```

### 🌍 Evaluación de Idiomas

```yaml
# Comprensión en idioma extranjero
comprension-ingles:
  class: SemanticSimilarityEval
  args:
    threshold: 0.7   # Relajado - permitir errores menores
    match_mode: all  # Considerar todos los aspectos
```

```jsonl
{"input": [{"role": "user", "content": "What does 'serendipity' mean?"}], "ideal": ["Finding something valuable by accident", "Fortunate discovery by chance", "Lucky accident that leads to good things"]}
```

## ⚡ Optimización y Performance

### 💰 Control de Costos

```typescript
// Estimar costo antes de ejecutar
const tokenCount = countTokens(allTexts);  // Función personalizada
const estimatedCost = tokenCount * 0.00002;  // $0.00002 per 1K tokens

console.log(`Estimated embedding cost: $${estimatedCost.toFixed(4)}`);

if (estimatedCost > 1.0) {  // Más de $1
  console.log("⚠️ High embedding cost, consider using cache or local provider");
}
```

### ⚡ Estrategias de Caché

```typescript
// Caché inteligente por contenido
const embeddings_cache = new Map();

async function getEmbeddingCached(text: string) {
  const textHash = crypto.createHash('md5').update(text).digest('hex');
  
  if (embeddings_cache.has(textHash)) {
    return embeddings_cache.get(textHash);  // Gratis!
  }
  
  const embedding = await provider.embed(text);  // Pagar
  embeddings_cache.set(textHash, embedding);
  return embedding;
}
```

### 📊 Batch Processing

```typescript
// Procesar múltiples textos en lotes (más eficiente)
const textos = ["texto1", "texto2", "texto3", ...];
const embeddings = await provider.embedBatch(textos);  // Una sola llamada API

// vs ineficiente:
// const embeddings = await Promise.all(textos.map(t => provider.embed(t)));  // Múltiples llamadas
```

## 🚨 Consideraciones Importantes

### 🌍 Idiomas y Contexto

```typescript
// ✅ Funciona bien
"The cat is sleeping" vs "El gato está durmiendo"  // Similitud: ~0.85

// ❌ Puede fallar
"Bank" (banco financiero) vs "Bank" (orilla del río)  // Contexto ambiguo
```

**Solución:** Proporcionar contexto en el prompt
```
Sistema: Responde en el contexto de instituciones financieras.
Usuario: ¿Qué es un banco?
```

### 🎯 Ajuste de Threshold

```typescript
// Experimentar con diferentes valores
const thresholds = [0.6, 0.7, 0.8, 0.9];
const resultados = [];

for (const threshold of thresholds) {
  const accuracy = await testWithThreshold(threshold);
  resultados.push({ threshold, accuracy });
}

// Encontrar el balance óptimo
const optimal = resultados.reduce((best, current) => 
  current.accuracy > best.accuracy ? current : best
);
```

### 🔄 Consistency vs Flexibility Trade-off

```typescript
// Más consistente (threshold alto)
threshold: 0.9,  // Solo respuestas muy similares pasan
// Pro: Resultados predecibles
// Con: Puede rechazar respuestas válidas

// Más flexible (threshold bajo)  
threshold: 0.6,  // Respuestas más variadas pasan
// Pro: Acepta más variabilidad
// Con: Puede aceptar respuestas incorrectas
```

## 🎓 Puntos Clave para Recordar

1. **Los embeddings capturan significado, no solo palabras** → "Feliz" ≈ "Contento"
2. **El threshold es crítico** → Muy alto rechaza válidas, muy bajo acepta inválidas
3. **OpenAI es más preciso pero cuesta dinero** → Local es gratis pero menos preciso
4. **El caché es esencial** → Los embeddings son caros de calcular
5. **El contexto importa** → Mismas palabras pueden tener significados diferentes
6. **Match_mode afecta comportamiento** → Experimenta para encontrar el mejor para tu caso
7. **Las evaluaciones semánticas son más lentas** → Pero más flexibles que matching exacto

### 🎯 Cuándo Usar Similitud Semántica

**✅ Úsala para:**
- Preguntas conceptuales donde la forma no importa
- Múltiples formas válidas de expresar la misma idea
- Comprensión de lectura y análisis
- Evaluaciones en idiomas con sinónimos ricos

**❌ No la uses para:**
- Respuestas que deben ser exactas (fechas, nombres, números)
- Cuando la forma específica importa (código, fórmulas)
- Presupuestos muy limitados (usa BasicEval)
- Evaluaciones que requieren velocidad extrema

**¡Siguiente paso:** Vamos a ver cómo se almacenan y gestionan todos los resultados! 🗄️
