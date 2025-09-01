# 🤖 Cliente LLM - El Traductor Universal de IA

## ¿Qué es el cliente LLM?

El **cliente LLM** es como un **traductor universal** que sabe hablar con diferentes servicios de inteligencia artificial. Imagina que tienes que comunicarte con personas que hablan idiomas diferentes (inglés, francés, japonés) - necesitarías traductores especializados para cada idioma.

**LLM** significa "Large Language Model" (Modelo de Lenguaje Grande) - es decir, los cerebros de IA como GPT-4, Claude, Llama, etc.

## 🌍 Los Cuatro "Idiomas" que Maneja

### 1. 🏢 OpenAI (GPT-4, GPT-3.5, etc.)
**Es como:** Una empresa de traducción profesional de lujo
- **Ventajas:** Muy inteligente, respuestas excelentes
- **Desventajas:** Cuesta dinero por cada uso
- **Cuándo usarlo:** Cuando necesitas la mejor calidad posible

### 2. 🏠 Ollama (Modelos locales como Llama)  
**Es como:** Tener tu propio traductor viviendo en casa
- **Ventajas:** Gratis una vez instalado, privacidad total
- **Desventajas:** Más lento, necesitas una computadora potente
- **Cuándo usarlo:** Cuando quieres ahorrar dinero o mantener datos privados

### 3. 🌐 Hugging Face (Comunidad de modelos)
**Es como:** Una biblioteca pública de traductores de todo el mundo
- **Ventajas:** Miles de modelos diferentes, muchos gratis
- **Desventajas:** Calidad variable, algunos son experimentales
- **Cuándo usarlo:** Cuando quieres experimentar con modelos específicos

### 4. 🔍 Google Gen AI (Gemini, modelos de Google)
**Es como:** El servicio de traducción oficial de Google
- **Ventajas:** Muy inteligente, integración con servicios de Google, multimodal
- **Desventajas:** Cuesta dinero por cada uso, requiere API key
- **Cuándo usarlo:** Cuando necesitas capacidades multimodales o integración con Google

## 🏗️ Cómo Funciona por Dentro

### La Interfaz Común (`LLMClient`)
```typescript
interface LLMClient {
  complete(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResult>;
  getModel(): string;
}
```

**¿Qué significa esto?**
Es como **un contrato estándar** que todos los traductores deben cumplir:
- **`complete()`** → "Traduce esta conversación para mí"
- **`getModel()`** → "¿Qué tipo de traductor eres?"

Todos los clientes (OpenAI, Ollama, Hugging Face) implementan esta misma interfaz, así que **puedes cambiar de uno a otro sin cambiar tu código**.

## 🎭 OpenAIClient - El Profesional

### ¿Cómo se inicializa?
```typescript
const client = new OpenAIClient('gpt-4', 'tu-api-key', 60000);
```

**Los parámetros son:**
- **`'gpt-4'`** → Qué modelo quieres usar
- **`'tu-api-key'`** → Tu llave secreta (como tu número de tarjeta de crédito)
- **`60000`** → Tiempo límite en milisegundos (60 segundos)

### 🔒 Validación de API Key
El sistema es muy estricto con las claves de API porque **protegen tu dinero**:

```typescript
// ❌ Errores comunes que detecta:
'your_openai_api_key_here'  // ¡Todavía es un placeholder!
''                          // ¡Está vacío!
undefined                   // ¡No existe!
```

**¿Por qué es tan estricto?**
Porque sin una API key válida:
- No puedes usar OpenAI
- Recibirás errores confusos
- Perderás tiempo debugging

### 🗨️ Cómo hace una petición
```typescript
async complete(messages: ChatMessage[], options?: CompletionOptions)
```

**Lo que pasa por dentro:**
1. **Convierte el formato** → De nuestro formato estándar al formato de OpenAI
2. **Configura opciones** → Temperatura, máximo de tokens, etc.
3. **Envía la petición** → A los servidores de OpenAI
4. **Maneja errores** → Con mensajes útiles y específicos
5. **Convierte la respuesta** → De vuelta a nuestro formato estándar

### 🚨 Manejo Inteligente de Errores

En lugar de errores crípticos, obtienes mensajes útiles:

```typescript
// ❌ Error original: "401 Unauthorized"
// ✅ Mensaje útil: "OpenAI authentication failed. Check your OPENAI_API_KEY environment variable."

// ❌ Error original: "429 Rate Limit"  
// ✅ Mensaje útil: "OpenAI rate limit exceeded. Please wait and try again."

// ❌ Error original: "404 Not Found"
// ✅ Mensaje útil: "OpenAI model 'gpt-5' not found. Check model name and availability."
```

## 🏠 OllamaClient - El Local

### ¿Qué hace especial a Ollama?
```typescript
const client = new OllamaClient('llama3.1', 'http://localhost:11434', 300000);
```

**Características únicas:**
- **Timeout más largo (5 minutos)** → Los modelos locales son más lentos
- **Detección de modelos de razonamiento** → Maneja especialmente modelos como DeepSeek-R1
- **Extracción inteligente de respuestas** → Para modelos que "piensan" paso a paso

### 🧠 Modelos de Razonamiento Especiales
```typescript
const isReasoningModel = this.model.includes('deepseek-r1') || 
                        this.model.includes('r1') || 
                        this.model.includes('qwen');
```

**¿Qué son los modelos de razonamiento?**
Son modelos que **"piensan en voz alta"** antes de responder:

```
🧠 Pensamiento del modelo:
"Hmm, me preguntan 2+2. Eso es una suma básica. 
2 más 2... eso es 4. Sí, estoy seguro."

📝 Respuesta final: \\boxed{4}
```

### 🎯 Extracción de Respuestas
El cliente es inteligente para extraer la respuesta final:

```typescript
// Busca estos patrones en orden de prioridad:
\\boxed{4}                    // Formato LaTeX (más confiable)
**4**                         // Números en negritas
answer is 4                   // Indicadores de respuesta  
4.                           // Números al final
```

## 🌐 HuggingFaceClient - El Explorador

### 🔍 Detección Inteligente de Modelos
```typescript
const likelyChatModel = this.model.includes('instruct') || 
                       this.model.includes('chat') || 
                       this.model.includes('llama') ||
                       // ... más patrones
```

**¿Por qué hace esto?**
Hugging Face tiene **miles de modelos diferentes**, algunos usan una API y otros usan otra:
- **Modelos de chat** → Usan `chatCompletion` (más moderno)
- **Modelos de texto** → Usan `textGeneration` (más básico)

### 🎭 Estrategia de Respaldo
```typescript
try {
  // Intenta primero con chatCompletion
  response = await this.client.chatCompletion({...});
} catch (error) {
  // Si falla, intenta con textGeneration
  response = await this.client.textGeneration({...});
}
```

**Es como:** Intentar hablar formalmente primero, y si no funciona, cambiar a un lenguaje más simple.

## 🔍 GoogleGenAIClient - El Servicio Oficial de Google

### ¿Cómo se inicializa?
```typescript
const client = new GoogleGenAIClient('gemini-2.0-flash-001', 'tu-api-key', 120000);
```

**Parámetros:**
- **Modelo:** `'gemini-2.0-flash-001'`, `'gemini-1.5-pro'`, etc.
- **API Key:** Tu clave de Google AI Studio
- **Timeout:** 120000ms (2 minutos por defecto)

### 🌟 Características Especiales

#### 🎭 Manejo Inteligente de Mensajes del Sistema
**Problema:** Google Gen AI no acepta mensajes con role "system" como OpenAI.
**Solución:** Los convierte automáticamente:
```typescript
// ❌ Esto falla en Google:
const mensajes = [
  { role: 'system', content: 'Eres un asistente matemático' },
  { role: 'user', content: '¿Cuánto es 2+2?' }
];

// ✅ GoogleGenAIClient lo convierte a:
generateParams = {
  config: {
    systemInstruction: 'Eres un asistente matemático'
  },
  contents: [
    { role: 'user', parts: [{ text: '¿Cuánto es 2+2?' }] }
  ]
}
```

#### 🔄 Conversión de Roles Automática
```typescript
// Entrada (formato OpenAI):
{ role: 'assistant', content: 'La respuesta es 4' }

// Google Gen AI necesita:
{ role: 'model', parts: [{ text: 'La respuesta es 4' }] }
```

**Es como:** Un traductor automático que convierte entre el "acento" de OpenAI y el "acento" de Google.

#### 🚫 Manejo de Errores Específicos
```typescript
// Detecta errores específicos de Google:
if (error.message.includes('API_KEY_INVALID')) {
  throw new Error('Google Gen AI authentication failed. Check your GEMINI_API_KEY');
}
```

### 🔧 Configuración Requerida

```bash
# En tu archivo .env:
GEMINI_API_KEY=tu-clave-real-aqui
```

**🔑 Obtener API Key:**
1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Crea una nueva API key
3. Cópiala a tu archivo .env

### 🎯 Patrones de Nombres Soportados
```typescript
// Todos estos funcionan:
createLLMClient('gemini-2.0-flash-001')
createLLMClient('google/gemini-1.5-pro')  
createLLMClient('genai/gemini-2.0-flash-001')
```

### 💰 Gestión de Costos
```typescript
const resultado = await client.complete(mensajes);
console.log('Tokens usados:', resultado.usage?.total_tokens);

// Estimación de costo aproximada:
// gemini-1.5-pro: ~$0.003 per 1K tokens
// gemini-2.0-flash: ~$0.0015 per 1K tokens
```

## 🏭 La Función Creadora Universal

```typescript
export function createLLMClient(model: string, timeout?: number): LLMClient
```

**Es como un factory automático:**
```typescript
// ✅ Todos estos funcionan:
const openai = createLLMClient('gpt-4');
const ollama = createLLMClient('ollama/llama2');
const hf = createLLMClient('hf/google/flan-t5-large');
const google = createLLMClient('gemini-2.0-flash-001');  // ← ¡NUEVO!
```

**Ventajas:**
- **Un solo punto de entrada** → No necesitas recordar diferentes constructores
- **Validación automática** → Detecta configuraciones incorrectas
- **Flexibilidad** → Fácil cambiar de proveedor sin cambiar código

## 💡 Ejemplo Práctico Completo

```typescript
import { createLLMClient } from './llm-client';

async function ejemploCompleto() {
  // 1. Crear diferentes clientes
  const openai = createLLMClient('gpt-4');
  const google = createLLMClient('gemini-2.0-flash-001');  // ← ¡NUEVO!
  const ollama = createLLMClient('ollama/llama2');
  
  // 2. Preparar conversación (¡mismo formato para todos!)
  const mensajes = [
    { role: 'system', content: 'Eres un asistente matemático' },
    { role: 'user', content: '¿Cuánto es 15 + 27?' }
  ];
  
  // 3. Comparar respuestas de diferentes modelos
  console.log('🤖 OpenAI GPT-4:');
  const resultadoOpenAI = await openai.complete(mensajes, { temperature: 0.0 });
  console.log('Respuesta:', resultadoOpenAI.content);
  console.log('Costo:', resultadoOpenAI.usage?.total_tokens * 0.00003);
  
  console.log('\n🔍 Google Gemini:');
  const resultadoGoogle = await google.complete(mensajes, { temperature: 0.0 });
  console.log('Respuesta:', resultadoGoogle.content);
  console.log('Costo:', resultadoGoogle.usage?.total_tokens * 0.0015 / 1000);
  
  console.log('\n🏠 Ollama Local:');
  const resultadoOllama = await ollama.complete(mensajes, { temperature: 0.0 });
  console.log('Respuesta:', resultadoOllama.content);
  console.log('Costo: GRATIS! 💰');
}
```

## 🎯 Puntos Clave para Recordar

1. **Cuatro proveedores soportados** → OpenAI, Ollama, HuggingFace, y Google Gen AI
2. **Interfaz consistente** → Mismo código funciona con cualquier proveedor
3. **Manejo inteligente de errores** → Mensajes útiles, no códigos crípticos
4. **Optimizaciones específicas** → Cada proveedor tiene sus peculiaridades
5. **Conversión automática** → Google Gen AI maneja system messages de forma especial
6. **Extracción automática** → Para modelos de razonamiento complejos (Ollama)
7. **Estimación de costos** → Para modelos que cobran por uso
8. **Timeouts inteligentes** → Diferentes para cada tipo de servicio

### 🚨 Cuidados Importantes

- **API Keys son secretos** → Nunca los publiques en GitHub
- **Los modelos locales son lentos** → Usa timeouts largos (Ollama: 5 min)
- **Los costos se acumulan** → Monitorea el uso de tokens (OpenAI, Google)
- **Google tiene formato diferente** → Los system messages van en systemInstruction
- **No todos los modelos son iguales** → Algunos son mejores para tareas específicas

**¡Siguiente paso:** Vamos a ver cómo el framework carga y maneja los datasets de evaluación! 📊
