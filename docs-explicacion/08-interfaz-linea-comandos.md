# 🖥️ Interfaz de Línea de Comandos - Tu Varita Mágica

## ¿Qué es la CLI?

La **CLI** (Command Line Interface) es como una **varita mágica** que te permite controlar todo el framework con comandos simples. Imagina poder decir hechizos como:

- `llm-eval gpt-4 math-basic` → "¡Evalúa GPT-4 con matemáticas básicas!"
- `llm-eval gemini-2.0-flash-001 math-basic` → "¡Evalúa Google Gemini con matemáticas!"
- `llm-eval ollama/llama2 math-basic` → "¡Evalúa Llama local con matemáticas!"
- `llm-eval list` → "¡Muéstrame todas las evaluaciones disponibles!"
- `llm-eval dashboard` → "¡Abre el dashboard mágico!"

**¿Por qué usar CLI en lugar de código?**
- **🚀 Más rápido** → Un comando vs escribir código completo
- **🔧 Más flexible** → Cambiar parámetros sin tocar código
- **📊 Análisis instantáneo** → Comandos para estadísticas y reportes
- **🤖 Automatizable** → Perfecta para scripts y CI/CD

## 🛠️ Instalación y Configuración del CLI

### 🔗 Opción 1: Comando Global con `npm link` (Recomendado)

**La mejor opción para desarrollo** - NO instala dependencias globalmente:

```bash
# 1. Compilar el proyecto
npm run build

# 2. Crear enlace simbólico (symlink) - ¡MUY superior a npm install -g!
npm link

# 3. ¡Ya puedes usar llm-eval desde cualquier lugar!
llm-eval --help
llm-eval gpt-4 math-basic
llm-eval list

# Para desinstalar limpiamente
npm unlink -g llm-evals-ts
```

**¿Por qué `npm link` es mejor que `npm install -g`?**
- ✅ **NO instala dependencias globalmente** 
- ✅ Crea un **enlace simbólico** al proyecto local
- ✅ Los **cambios se reflejan inmediatamente** sin reinstalar
- ✅ Usa las dependencias ya instaladas en `node_modules/`
- ✅ **Práctica estándar** para desarrollo de CLIs

### ⚡ Opción 2: Script de Desarrollo (Para cambios frecuentes)

Si estás desarrollando o modificando el framework:

```bash
# Usar el script npm dev
npm run dev -- gpt-4 math-basic
npm run dev -- --help
npm run dev -- list
```

### 🔧 Opción 3: Uso Directo con ts-node

Para uso ocasional sin instalación global:

```bash
# Ejecutar directamente desde el código fuente
npx ts-node src/cli.ts gpt-4 math-basic
npx ts-node src/cli.ts --help
npx ts-node src/cli.ts list
```

### 📦 Opción 4: Instalación Global Completa (No recomendada)

⚠️ **Solo si `npm link` no funciona en tu sistema:**

```bash
# Instala todo globalmente (incluyendo dependencias)
npm run build
npm install -g .

# Para desinstalar
npm uninstall -g llm-evals-ts
```

**Desventajas:** Instala todas las dependencias globalmente, ocupa más espacio.

### ⚠️ Troubleshooting

Si `llm-eval` no funciona después de usar `npm link`:

```bash
# 1. Desenlazar y volver a enlazar
npm unlink -g llm-evals-ts
npm run build
npm link

# 2. Verificar instalación
llm-eval --version
which llm-eval  # Debe apuntar a tu directorio del proyecto

# 3. Si sigue fallando, usar npm run dev como alternativa
npm run dev -- --help

# 4. Verificar que package.json tiene el campo "bin" correcto
cat package.json | grep -A2 '"bin"'
```

### 🎯 Verificar que Todo Funciona

```bash
# 1. Inicializar registry (si no existe)
llm-eval init

# 2. Listar evaluaciones disponibles
llm-eval list

# 3. Ejecutar prueba sin gastar dinero
llm-eval gpt-3.5-turbo math-basic --dry-run --max-samples 3
```

## 🧙‍♂️ Los Hechizos Principales

### 1. ⚡ Comando Principal - Ejecutar Evaluaciones

```bash
# Hechizo básico
llm-eval gpt-4 math-basic

# Hechizo con parámetros mágicos
llm-eval gpt-4 math-basic \
  --max-samples 50 \
  --temperature 0.0 \
  --verbose \
  --log-to-file mi-evaluacion.jsonl
```

**¿Qué hace cada parámetro?**

- **`gpt-4`** → El modelo de IA que quieres evaluar
- **`math-basic`** → La evaluación que quieres ejecutar  
- **`--max-samples 50`** → Solo evaluar 50 preguntas (en lugar de todas)
- **`--temperature 0.0`** → Respuestas determinísticas (0.0 = más predecible, 2.0 = más creativo)
- **`--verbose`** → Mostrar progreso detallado
- **`--log-to-file`** → Guardar logs detallados en un archivo

### 2. 📋 Hechizo para Ver Evaluaciones

```bash
llm-eval list
```

**Resultado:**
```
📋 Available Evaluations
Registry: ./registry

math-basic
  Basic math evaluation using exact matching
  Metrics: accuracy
  Class: BasicEval

history-essays
  Historical essay evaluation using semantic similarity
  Metrics: accuracy, semantic_similarity
  Class: SemanticSimilarityEval
```

### 3. 🏗️ Hechizo de Inicialización

```bash
llm-eval init [ruta-opcional]
```

**¿Qué hace?**
- ✅ Crea la estructura de carpetas del registry
- ✅ Genera configuraciones de ejemplo
- ✅ Crea datasets de muestra
- ✅ Te da instrucciones de qué hacer después

## 🎭 Modos Especiales de Ejecución

### 🧪 Modo Dry Run (Simulación)

```bash
llm-eval gpt-4 math-basic --dry-run
```

**Es como:** Ensayar una obra de teatro sin subir al escenario real

**¿Qué hace?**
- ✅ No hace peticiones reales a la API (no gastas dinero)
- ✅ Te muestra qué preguntas ejecutaría
- ✅ Te permite verificar configuraciones
- ✅ Estima costos sin gastar

**Cuándo usar:**
- 🔍 Verificar que el dataset está correcto
- 💰 Estimar costos antes de ejecutar
- ⚙️ Probar configuraciones nuevas

### 🔍 Modo Verbose (Detallado)

```bash
llm-eval gpt-4 math-basic --verbose
```

**Resultado:**
```
🧠 LLM Evaluation Framework
Model: gpt-4 | Eval: math-basic

Loading dataset from: registry/data/math/basic.jsonl
Evaluating 100 samples

Progress: 1/100 (1%)
✅ Sample 1 - Score: 1.0 - PASS
   Reasoning: La respuesta '5' coincide exactamente con el ideal '5'
💾 Cache hit for sample 2
✅ Sample 2 - Score: 1.0 - PASS

📊 Calculated 3 custom metrics
💾 Cache Performance:
   • Requests: 100
   • Hits: 23
   • Hit rate: 23.0%
```

### 🎯 Limitación de Muestras

```bash
# Solo las primeras 10 preguntas (perfecto para testing)
llm-eval gpt-4 math-basic --max-samples 10

# Ideal para desarrollo rápido
llm-eval gpt-3.5-turbo math-basic --max-samples 5 --dry-run
```

## 📊 Comandos de Análisis - Los Hechizos de Estadísticas

### 💰 Análisis de Costos

```bash
# Desglose de costos de los últimos 30 días
llm-eval costs breakdown

# Desglose de la última semana
llm-eval costs breakdown 7

# Predecir costos para una evaluación futura
llm-eval costs predict gpt-4 math-basic 100

# Estimación rápida
llm-eval costs estimate gpt-4 50 --input-length 300 --output-length 100
```

**Resultado de `costs breakdown`:**
```
💰 Cost Breakdown
Period: Last 30 days

📊 Summary:
   Total cost: $12.4567
   Total runs: 45
   Average cost per run: $0.2768

💸 Cost by Evaluation:
   1. math-advanced (34.2%)
      • Total: $4.26 over 15 runs
      • Avg per run: $0.284
      • Models: gpt-4, gpt-3.5-turbo
      • Trend: increasing 📈

   2. history-essays (28.7%)
      • Total: $3.58 over 12 runs  
      • Models: gpt-4
      • Trend: stable ➡️
```

### 📈 Análisis de Tokens

```bash
# Reporte general de tokens
llm-eval tokens report

# Tendencias de una evaluación específica
llm-eval tokens trends math-basic 14  # Últimos 14 días

# Comparar eficiencia entre modelos
llm-eval tokens efficiency gpt-4 gpt-3.5-turbo claude-3-sonnet
```

**Resultado de `tokens report`:**
```
📊 Token Analytics Report
Period: Last 30 days

📈 Summary:
   Total evaluations: 87
   Total tokens: 1,247,839
   Total cost: $18.7234
   Most efficient model: gpt-3.5-turbo
   Most expensive model: gpt-4

🏆 Model Efficiency Ranking:
   1. gpt-3.5-turbo - $0.0034/sample (127 tokens)
   2. claude-3-sonnet - $0.0045/sample (134 tokens)
   3. gpt-4 - $0.0089/sample (145 tokens)

💡 Recommendations:
   • Consider using gpt-3.5-turbo for cost-sensitive evaluations
   • gpt-4 shows 23% higher accuracy but 160% higher cost
```

### 🎯 Análisis de Métricas

```bash
# Listar métricas disponibles
llm-eval metrics list

# Probar métricas en una evaluación existente
llm-eval metrics test math-basic
```

## 💾 Comandos de Gestión de Caché

### ⚡ Cache - Tu Ahorro Inteligente

```bash
# Ver estadísticas de caché
llm-eval cache stats

# Limpiar todo el caché (¡cuidado!)
llm-eval cache clear

# Invalidar caché de un modelo específico
llm-eval cache invalidate gpt-4
```

**Resultado de `cache stats`:**
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
```

## 📱 Dashboard - Tu Centro de Control

```bash
# Iniciar dashboard en puerto por defecto (3000)
llm-eval dashboard

# Usar puerto personalizado
llm-eval dashboard 8080
```

**¿Qué obtienes?**
- 📊 **Gráficas interactivas** de rendimiento
- 💰 **Análisis de costos en tiempo real**
- 📈 **Tendencias de accuracy**
- 🔍 **Exploración detallada de resultados**
- 📋 **Comparaciones entre modelos**

## 🛠️ Opciones Globales - Los Modificadores Universales

### Opciones que funcionan con todos los comandos:

```bash
# Registry personalizado
llm-eval gpt-4 math-basic --registry ./mi-registry

# Diferentes modelos con sus timeouts recomendados
llm-eval gemini-2.0-flash-001 math-basic --timeout 120000  # Google: 2 minutos
llm-eval ollama/llama3.1 math-basic --timeout 300000      # Ollama: 5 minutos
llm-eval hf/google/flan-t5-large math-basic --timeout 180000  # HuggingFace: 3 minutos

# Temperatura personalizada por modelo
llm-eval gpt-4 creative-writing --temperature 1.2          # OpenAI más creativo
llm-eval google/gemini-1.5-pro creative-writing --temperature 0.9  # Google creativo

# Límite de tokens
llm-eval gemini-2.0-flash-001 short-answers --max-tokens 50

# Semilla para reproducibilidad
llm-eval gpt-4 math-basic --seed 42  # Siempre los mismos resultados

# Logs personalizados
llm-eval google/gemini-1.5-pro math-basic --log-to-file experimento-gemini.jsonl
```

## 💡 Ejemplos de Workflows Reales

### 🧪 Workflow de Desarrollo

```bash
# 1. Verificar que todo está bien (sin gastar dinero)
llm-eval gpt-3.5-turbo math-basic --dry-run --max-samples 5

# 2. Prueba rápida con pocas muestras
llm-eval gpt-3.5-turbo math-basic --max-samples 10 --verbose

# 3. Si funciona bien, evaluación completa
llm-eval gpt-3.5-turbo math-basic --log-to-file dev-test.jsonl
```

### 🚀 Workflow de Producción

```bash
# 1. Estimar costos primero
llm-eval costs predict gpt-4 production-eval 500

# 2. Ejecutar evaluación completa
llm-eval gpt-4 production-eval \
  --temperature 0.0 \
  --log-to-file prod-$(date +%Y%m%d).jsonl \
  --verbose

# 3. Análisis posterior
llm-eval tokens report 1  # Último día
llm-eval costs breakdown 1
```

### 📊 Workflow de Comparación

```bash
# 1. Evaluar múltiples modelos
llm-eval gpt-4 comparison-test --log-to-file gpt4-results.jsonl
llm-eval gpt-3.5-turbo comparison-test --log-to-file gpt35-results.jsonl
llm-eval claude-3-sonnet comparison-test --log-to-file claude-results.jsonl

# 2. Comparar eficiencia
llm-eval tokens efficiency gpt-4 gpt-3.5-turbo claude-3-sonnet --eval comparison-test

# 3. Iniciar dashboard para análisis visual
llm-eval dashboard
```

### 🔄 Workflow de Experimentación

```bash
# Experimento con diferentes temperaturas
for temp in 0.0 0.3 0.7 1.0; do
  llm-eval gpt-4 creative-eval \
    --temperature $temp \
    --max-samples 20 \
    --log-to-file "experiment-temp-$temp.jsonl"
done

# Experimento con diferentes límites de tokens
for tokens in 50 100 200 500; do
  llm-eval gpt-4 summary-eval \
    --max-tokens $tokens \
    --max-samples 20 \
    --log-to-file "experiment-tokens-$tokens.jsonl"
done
```

## 🚨 Validación Automática de Entorno

La CLI es inteligente y verifica tu configuración automáticamente:

```bash
llm-eval gpt-4 math-basic
```

**Si tu .env no está configurado correctamente:**
```
🔍 Environment Validation:
❌ OPENAI_API_KEY: Missing or invalid
   Expected format: sk-...
   Set up: Create .env file with OPENAI_API_KEY=your_key

⚠️  Redis: Not configured (optional)
   Cache will use memory instead
   For better performance, install Redis

✅ Registry: Found at ./registry

Cannot proceed without valid OPENAI_API_KEY
```

## 🎯 Tips y Trucos Profesionales

### 💰 Control de Costos
```bash
# Siempre estimar antes de ejecutar
llm-eval costs estimate gpt-4 100 && \
llm-eval gpt-4 math-basic --max-samples 100

# Usar modelos más baratos para desarrollo
llm-eval gpt-3.5-turbo math-basic --max-samples 10  # Desarrollo
llm-eval gpt-4 math-basic  # Producción
```

### ⚡ Optimización de Velocidad
```bash
# Usar caché Redis para equipos
export REDIS_URL=redis://localhost:6379
llm-eval gpt-4 math-basic  # Compartirá caché con el equipo

# Timeouts apropiados por tipo de modelo
llm-eval gpt-4 math-basic --timeout 60000                 # OpenAI: 1 minuto
llm-eval gemini-2.0-flash-001 math-basic --timeout 120000 # Google: 2 minutos
llm-eval hf/google/flan-t5-large math-basic --timeout 180000  # HuggingFace: 3 minutos
llm-eval ollama/llama3.1 math-basic --timeout 300000      # Ollama Local: 5 minutos
```

### 📊 Análisis Sistemático
```bash
# Crear reports periódicos
llm-eval tokens report 7 > weekly-report.txt
llm-eval costs breakdown 7 >> weekly-report.txt

# Monitoreo de tendencias
llm-eval tokens trends production-eval 30
```

## 🎓 Puntos Clave para Recordar

1. **Cuatro proveedores soportados** → OpenAI, Google Gen AI, Ollama, HuggingFace
2. **La CLI es tu navaja suiza** → Un comando para cada necesidad
3. **Dry run es tu mejor amigo** → Nunca gastes dinero sin probar
4. **Timeouts por proveedor** → OpenAI (1min), Google (2min), HF (3min), Ollama (5min)
5. **El verbose mode es para debugging** → Úsalo cuando algo falle
6. **Los logs son oro** → Siempre especifica --log-to-file
7. **El dashboard visualiza todo** → Para análisis complejos
8. **La validación automática previene errores** → Confía en los mensajes
9. **Los comandos de análisis ahorran tiempo** → No reinventes la rueda

### 🚀 Comando de Ayuda Universal

Cuando tengas dudas:
```bash
llm-eval --help              # Ayuda general
llm-eval costs --help        # Ayuda de costos
llm-eval tokens --help       # Ayuda de tokens
llm-eval dashboard --help    # Ayuda del dashboard
```

**¡Siguiente paso:** Vamos a explorar los diferentes tipos de evaluaciones (templates)! 🧪
