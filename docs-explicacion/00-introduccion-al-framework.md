# 🚀 Introducción al Framework de Evaluaciones de LLM

## ¿Qué es este framework?

Este proyecto es un **framework completo para evaluar modelos de inteligencia artificial** (específicamente modelos de lenguaje grande o "LLMs" como GPT, Claude, etc.). 

### 🤔 ¿Por qué necesitamos evaluar modelos de IA?

Imagina que tienes varios estudiantes y quieres saber cuál es mejor en matemáticas. Les darías un examen, ¿verdad? Lo mismo pasa con los modelos de IA:

- **Queremos saber cuál modelo es mejor** para una tarea específica
- **Necesitamos medir qué tan bien funcionan** antes de usarlos en producción
- **Debemos controlar costos** porque usar estos modelos cuesta dinero
- **Queremos asegurarnos de que la calidad se mantiene** a lo largo del tiempo

### 🎯 ¿Qué hace exactamente este framework?

Este framework es como un **laboratorio automatizado** que:

1. **🔌 Se conecta** a diferentes proveedores de IA (OpenAI, Ollama, Hugging Face)
2. **📊 Prepara exámenes** (datasets de evaluación) 
3. **🧪 Ejecuta las pruebas** automáticamente
4. **📈 Mide los resultados** con diferentes métricas
5. **💰 Calcula los costos** de usar cada modelo
6. **📱 Muestra resultados** en un dashboard bonito
7. **🗄️ Guarda todo** para comparaciones futuras

### 🏗️ Arquitectura del Framework

El proyecto está organizado como una **ciudad bien planificada**:

```
src/
├── 🏠 Archivos principales (la casa central)
│   ├── index.ts          → Puerta de entrada principal
│   ├── types.ts          → Definiciones de todo lo que usa el sistema
│   ├── cli.ts            → Interfaz de línea de comandos
│   └── eval-runner.ts    → El cerebro que ejecuta todo
│
├── 🔌 Conexiones externas
│   ├── llm-client.ts     → Se conecta con OpenAI, Ollama, etc.
│   └── dataset-loader.ts → Carga los datos de prueba
│
├── 🧪 Laboratorio de evaluaciones
│   └── templates/        → Diferentes tipos de exámenes
│       ├── basic-eval.ts        → Exámenes básicos
│       ├── choice-based-eval.ts → Exámenes de opción múltiple  
│       ├── model-graded-eval.ts → Exámenes calificados por IA
│       └── semantic-similarity-eval.ts → Exámenes de significado
│
├── ⚡ Optimizaciones
│   ├── caching/          → Sistema de caché (para ahorrar dinero)
│   └── embeddings/       → Comparaciones de significado
│
├── 📊 Análisis y métricas
│   ├── metrics/          → Métricas personalizadas
│   ├── analytics/        → Análisis de tokens y costos
│   ├── cost-tracking/    → Seguimiento detallado de costos
│   └── monitoring/       → Monitoreo en tiempo real
│
├── 🗄️ Almacenamiento
│   ├── database/         → Base de datos para resultados
│   └── ab-testing/       → Comparaciones A/B entre modelos
│
├── 🤖 Automatización
│   ├── automation/       → Pipelines automáticos
│   └── dashboard/        → Interfaz web para ver resultados
│
└── 🛠️ Utilidades
    └── utils/            → Herramientas auxiliares
```

### 🎓 Tu viaje de Zero a Hero

En esta documentación vas a aprender:

1. **🔤 Los conceptos básicos** → Qué son los "tipos" en TypeScript
2. **🏗️ La estructura** → Cómo está organizado todo
3. **🔧 Los componentes** → Qué hace cada pieza
4. **🧪 Las evaluaciones** → Cómo funcionan los diferentes tipos de exámenes
5. **⚡ Las optimizaciones** → Cómo el sistema ahorra tiempo y dinero
6. **📊 Los análisis** → Cómo interpretar los resultados
7. **🚀 El uso práctico** → Cómo usar todo esto en tu proyecto

### 💡 Conceptos clave que aprenderás

- **LLM (Large Language Model)**: Los modelos de IA como GPT-4, Claude, etc.
- **Evaluación**: Un conjunto de pruebas para medir qué tan bien funciona un modelo
- **Dataset**: Una colección de preguntas y respuestas correctas para probar
- **Token**: Las "palabras" que consume un modelo (y por las que pagas)
- **Embeddings**: Una forma de convertir texto en números para comparar significados
- **Cache**: Guardar resultados para no repetir trabajo costoso
- **Pipeline**: Un proceso automatizado que ejecuta todo paso a paso

¡Empecemos este viaje! 🚀
