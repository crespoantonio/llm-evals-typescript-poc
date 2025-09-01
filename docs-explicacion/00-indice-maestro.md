# 🎓 Guía Completa: De Zero a Hero en LLM Evaluations

## 🚀 Tu Viaje de Aprendizaje

¡Bienvenido al mundo de las evaluaciones de modelos LLM! Esta guía te llevará paso a paso desde los conceptos más básicos hasta convertirte en un experto en evaluaciones de IA.

### 📋 ¿Qué vas a aprender?

Al completar esta guía, podrás:
- ✅ **Entender qué son las evaluaciones de LLM** y por qué son importantes
- ✅ **Configurar y ejecutar evaluaciones** con diferentes modelos de IA
- ✅ **Crear tus propios tipos de exámenes** para casos específicos
- ✅ **Optimizar costos** y mejorar eficiencia
- ✅ **Interpretar resultados** y tomar decisiones informadas
- ✅ **Automatizar evaluaciones** para uso en producción
- ✅ **Construir dashboards** y sistemas de monitoreo

---

## 🎯 Ruta de Aprendizaje Recomendada

### 🏁 **NIVEL 1: FUNDAMENTOS** (Empieza aquí si eres nuevo)

#### [📖 00. Introducción al Framework](./00-introduccion-al-framework.md)
🕐 **Tiempo:** 15 minutos  
🎯 **Objetivo:** Entender qué es este framework y para qué sirve  
**Lo que aprenderás:**
- Qué son las evaluaciones de LLM
- Por qué necesitamos evaluar modelos de IA
- Arquitectura general del framework
- Conceptos clave y vocabulario básico

---

#### [🔤 01. Tipos Fundamentales](./01-tipos-fundamentales.md)
🕐 **Tiempo:** 20 minutos  
🎯 **Objetivo:** Aprender el "vocabulario" del framework  
**Lo que aprenderás:**
- Qué son los tipos en TypeScript (explicado de manera simple)
- Estructura de mensajes, evaluaciones y resultados
- Cómo leer y entender los tipos de datos
- Por qué los tipos previenen errores

**💡 Consejo:** No te preocupes si no entiendes TypeScript, se explica todo desde cero.

---

### 🔧 **NIVEL 2: COMPONENTES BÁSICOS** (Construye tu base)

#### [🚪 02. Punto de Entrada](./02-punto-de-entrada.md)
🕐 **Tiempo:** 15 minutos  
🎯 **Objetivo:** Entender cómo se organiza el framework  
**Lo que aprenderás:**
- Qué hace el archivo principal (index.ts)
- Cómo están organizados los componentes
- Principios de arquitectura de software

---

#### [🤖 03. Cliente LLM](./03-cliente-llm.md)
🕐 **Tiempo:** 30 minutos  
🎯 **Objetivo:** Conectarte con diferentes modelos de IA  
**Lo que aprenderás:**
- Cómo conectarse a OpenAI, Ollama, HuggingFace, y Google Gen AI
- Diferencias entre proveedores y sus peculiaridades
- Manejo de errores y timeouts específicos
- Estimación de costos por proveedor
- Conversión automática de system messages (Google)

**🎯 Ejercicio práctico:** Configurar tu primera conexión con un modelo de IA.

---

#### [📊 04. Cargador de Datos](./04-cargador-datos.md)
🕐 **Tiempo:** 20 minutos  
🎯 **Objetivo:** Preparar datos para evaluaciones  
**Lo que aprenderás:**
- Formato JSONL y por qué se usa
- Cómo estructurar preguntas y respuestas
- Validación de datasets
- Crear datasets de ejemplo

**🎯 Ejercicio práctico:** Crear tu primer dataset de evaluación.

---

### 🎭 **NIVEL 3: EL CEREBRO DEL SISTEMA** (Orquestación)

#### [🎭 05. Ejecutor de Evaluaciones](./05-ejecutor-evaluaciones.md)
🕐 **Tiempo:** 30 minutos  
🎯 **Objetivo:** Entender el "director de orquesta"  
**Lo que aprenderás:**
- Cómo se ejecuta una evaluación completa
- Modo dry-run para probar sin gastar
- Sistema de caché para ahorrar dinero
- Manejo de errores y recuperación

**🎯 Ejercicio práctico:** Ejecutar tu primera evaluación completa.

---

#### [📋 06. Registro de Configuraciones](./06-registro-configuraciones.md)
🕐 **Tiempo:** 25 minutos  
🎯 **Objetivo:** Organizar y gestionar evaluaciones  
**Lo que aprenderás:**
- Archivos YAML para configuraciones
- Versionado de evaluaciones
- Organización por temas y tipos
- Mejores prácticas de nomenclatura

**🎯 Ejercicio práctico:** Crear tu propio registry de evaluaciones.

---

#### [📝 07. Sistema de Logging](./07-sistema-logging.md)
🕐 **Tiempo:** 20 minutos  
🎯 **Objetivo:** Rastrear y debuggear evaluaciones  
**Lo que aprenderás:**
- Por qué el logging es crucial
- Formato JSONL para logs
- Análisis de logs con herramientas
- Debugging de problemas

---

### 🖥️ **NIVEL 4: INTERFAZ Y USABILIDAD** (Herramientas prácticas)

#### [🖥️ 08. Interfaz de Línea de Comandos](./08-interfaz-linea-comandos.md)
🕐 **Tiempo:** 35 minutos  
🎯 **Objetivo:** Dominar la "varita mágica" del framework  
**Lo que aprenderás:**
- Todos los comandos disponibles
- Opciones avanzadas y modificadores
- Análisis de costos y tokens
- Workflows recomendados

**🎯 Ejercicio práctico:** Ejecutar evaluaciones con diferentes configuraciones.

---

### 🧪 **NIVEL 5: TIPOS DE EVALUACIONES** (El corazón del sistema)

#### [🧪 09. Templates de Evaluaciones](./09-templates-evaluaciones.md)
🕐 **Tiempo:** 45 minutos  
🎯 **Objetivo:** Dominar los 4 tipos de "exámenes"  
**Lo que aprenderás:**
- BasicEval: Respuestas exactas
- ModelGradedEval: Calificación por IA
- ChoiceBasedEval: Opciones múltiples personalizadas
- SemanticSimilarityEval: Comprensión de significado

**🎯 Ejercicio práctico:** Crear evaluaciones de cada tipo.

---

### ⚡ **NIVEL 6: OPTIMIZACIÓN Y EFICIENCIA** (Ahorro y velocidad)

#### [⚡ 10. Sistema de Caché](./10-sistema-cache.md)
🕐 **Tiempo:** 25 minutos  
🎯 **Objetivo:** Ahorrar dinero y mejorar velocidad  
**Lo que aprenderás:**
- Configuración de caché en memoria y Redis
- Cálculo de ahorros de costos
- Optimización de hit rate
- Estrategias por caso de uso

**🎯 Ejercicio práctico:** Configurar caché y medir ahorros.

---

#### [📊 11. Métricas Personalizadas](./11-metricas-personalizadas.md)
🕐 **Tiempo:** 30 minutos  
🎯 **Objetivo:** Medir más allá de la simple accuracy  
**Lo que aprenderás:**
- Métricas de costo, eficiencia, calidad
- Configuración de métricas personalizadas
- Interpretación de resultados
- Creación de tus propias métricas

**🎯 Ejercicio práctico:** Configurar métricas para tu caso de uso.

---

#### [🧠 12. Embeddings y Similitud](./12-embeddings-y-similitud.md)
🕐 **Tiempo:** 35 minutos  
🎯 **Objetivo:** Entender evaluaciones semánticas  
**Lo que aprenderás:**
- Qué son los embeddings (explicado simple)
- Configuración de similitud semántica
- OpenAI vs proveedores locales
- Optimización de thresholds

**🎯 Ejercicio práctico:** Crear evaluaciones de comprensión conceptual.

---

### 📊 **NIVEL 7: ANÁLISIS Y PERSISTENCIA** (Datos a largo plazo)

#### [🗄️ 13. Base de Datos](./13-base-datos.md)
🕐 **Tiempo:** 25 minutos  
🎯 **Objetivo:** Almacenar y analizar historial  
**Lo que aprenderás:**
- Configuración de SQLite vs PostgreSQL
- Consultas y análisis de tendencias
- Predicción de costos basada en historial
- Backup y mantenimiento

---

#### [🛠️ 14. Componentes Auxiliares](./14-componentes-auxiliares.md)
🕐 **Tiempo:** 40 minutos  
🎯 **Objetivo:** Herramientas avanzadas de producción  
**Lo que aprenderás:**
- Monitoreo en tiempo real
- A/B testing de modelos
- Automatización con pipelines
- Dashboard web interactivo

---

## 🎯 Rutas Especializadas

### 🧪 **Para Investigadores y Científicos de Datos**
```
Orden recomendado: 1→2→3→5→6→7→11→12→13
Enfoque en: Métricas, embeddings, análisis estadístico
```

### 💼 **Para Equipos de Producto**
```
Orden recomendado: 1→2→4→8→9→10→11→14
Enfoque en: Usabilidad, costos, dashboards, automatización
```

### 🏗️ **Para DevOps y SRE**
```
Orden recomendado: 1→2→3→4→5→7→8→10→13→14
Enfoque en: Monitoreo, logging, caché, base de datos, CLI
```

### 🎓 **Para Educadores**
```
Orden recomendado: 1→2→4→9→8→11→12→14
Enfoque en: Templates educativos, métricas pedagógicas, dashboard
```

---

## 📚 Recursos Adicionales

### 🔗 Enlaces Útiles
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Google AI Studio](https://aistudio.google.com/app/apikey) - Para API keys de Gemini
- [HuggingFace Inference API](https://huggingface.co/docs/api-inference)
- [Ollama Documentation](https://ollama.ai/docs)  
- [Redis Quick Start](https://redis.io/docs/getting-started/)
- [JSONL Format Specification](https://jsonlines.org/)

### 🛠️ Herramientas Complementarias
- **jq**: Para análisis de logs JSONL
- **Redis**: Para caché compartido
- **PostgreSQL**: Para base de datos de producción
- **Docker**: Para deployments consistentes

### 📖 Conceptos de Background
- **LLMs (Large Language Models)**: GPT, Claude, Gemini, Llama, etc.
- **Tokens**: Unidades de texto que procesan los modelos
- **Embeddings**: Representaciones numéricas de significado
- **Cosine Similarity**: Método para comparar similitud semántica
- **System Instructions**: Instrucciones de comportamiento para el modelo (Google uses systemInstruction)

---

## 🏆 Certificación de Conocimiento

### 📝 **Nivel Principiante** (Completar niveles 1-3)
- [ ] Ejecutar una evaluación básica
- [ ] Crear un dataset simple
- [ ] Interpretar resultados básicos
- [ ] Usar el CLI para tareas comunes

### 📊 **Nivel Intermedio** (Completar niveles 1-6)
- [ ] Configurar los 4 tipos de templates
- [ ] Optimizar costos con caché
- [ ] Interpretar métricas personalizadas
- [ ] Crear evaluaciones semánticas

### 🚀 **Nivel Avanzado** (Completar todos los niveles)
- [ ] Configurar monitoreo de producción
- [ ] Crear pipelines automatizados
- [ ] Implementar A/B testing de modelos
- [ ] Generar reportes ejecutivos

---

## 💡 Tips para el Éxito

### 🎯 **Para Maximizar el Aprendizaje**
1. **Practica mientras lees** → Ejecuta todos los ejemplos
2. **Experimenta con tus datos** → Usa casos reales de tu trabajo
3. **Empieza simple** → No intentes todo a la vez
4. **Mide todo** → Los datos guían las decisiones
5. **Comparte resultados** → Enseñar refuerza el aprendizaje

### ⚠️ **Errores Comunes a Evitar**
1. **No validar el entorno** → Siempre verifica configuración primero
2. **Ignorar los costos** → Usa dry-run antes de evaluaciones grandes
3. **No usar caché** → Es la forma más fácil de ahorrar dinero
4. **Thresholds inadecuados** → En similitud semántica, experimenta
5. **No leer los logs** → Contienen información valiosa para debugging

---

## 🎉 ¡Comienza Tu Viaje!

**👇 Empieza aquí:** [📖 Introducción al Framework](./00-introduccion-al-framework.md)

**¿Tienes prisa?** Prueba la **Ruta Rápida**:
1. [Introducción](./00-introduccion-al-framework.md) (15 min)
2. [CLI](./08-interfaz-linea-comandos.md) (35 min)
3. [Templates](./09-templates-evaluaciones.md) (45 min)

En menos de 2 horas estarás ejecutando evaluaciones como un profesional!

---

**🚀 ¡Tu viaje de Zero a Hero en LLM Evaluations comienza ahora!**
