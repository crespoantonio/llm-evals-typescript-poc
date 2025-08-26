# 🧠 LLM Evaluation Framework - Complete Beginner's Guide

## 📋 Table of Contents
1. [What This Framework Does](#what-this-framework-does)
2. [Big Picture: How Everything Fits Together](#big-picture-how-everything-fits-together)
3. [File-by-File Explanation](#file-by-file-explanation)
4. [Production Features Explained](#production-features-explained)
5. [Data Flow: From Start to Finish](#data-flow-from-start-to-finish)
6. [How to Use the Framework](#how-to-use-the-framework)
7. [How to Add New Features](#how-to-add-new-features)
8. [Common Patterns in TypeScript](#common-patterns-in-typescript)

---

## 🎯 What This Framework Does

Imagine you have an AI model (like ChatGPT) and you want to test how good it is at different tasks. This framework:

1. **Gives the AI questions** (like math problems or requests to write code)
2. **Gets the AI's answers**
3. **Grades those answers** (either automatically or using another AI)
4. **Tracks token usage and costs** in real-time for budget management
5. **Gives you a comprehensive report** showing performance, costs, and efficiency metrics

Think of it like a **complete testing and cost management system for AI models** - similar to how students take exams, but with detailed analytics on performance, spending, and efficiency.

---

## 🏗️ Big Picture: How Everything Fits Together

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   1. DATASET    │───▶│   2. AI MODEL   │───▶│  3. GRADING     │
│   (Questions)   │    │   (Answers)     │    │  (Scoring)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
    ┌────▼────┐              ┌────▼────┐              ┌────▼────┐
    │Questions│              │AI gives │              │Framework│
    │stored in│              │answers  │              │grades   │
    │JSONL    │              │to each  │              │answers &│
    │files    │              │question │              │reports  │
    └─────────┘              └─────────┘              └─────────┘
```

### The Main Components:

#### **Core Framework:**
1. **Configuration Files** (`registry/evals/*.yaml`) - Define what tests to run
2. **Dataset Files** (`registry/data/*.jsonl`) - Contain the actual questions
3. **AI Clients** (`src/llm-client.ts`) - Talk to different AI models (OpenAI, Ollama, HuggingFace)
4. **Evaluation Templates** (`src/templates/*.ts`) - Different ways to grade answers:
   - BasicEval (exact matching)
   - ModelGradedEval (AI judges AI) 
   - ChoiceBasedEval (structured choices)
   - SemanticSimilarityEval (meaning-based with embeddings)
5. **CLI Tool** (`src/cli.ts`) - Enhanced command interface with token analytics, cost management, cache control, and custom metrics
6. **Token Analytics** (`src/analytics/token-analytics.ts`) - Comprehensive token usage analysis and cost tracking
7. **Intelligent Caching** (`src/caching/evaluation-cache.ts`) - Redis/in-memory caching with smart invalidation reduces API costs up to 80%
8. **Custom Metrics Framework** (`src/metrics/custom-metrics.ts`) - Extensible system for business-specific performance metrics
9. **Results & Logs** (`logs/*.jsonl`) - Where results are saved with detailed token usage data and cache statistics

#### **Production Features:**
7. **Interactive Web Dashboard** (`src/dashboard/dashboard-server.ts`) - Advanced web interface with token tracking, cost visualization, and real-time analytics
8. **Database Storage** (`src/database/evaluation-store.ts`) - Historical data and performance tracking with token usage history
9. **A/B Testing** (`src/ab-testing/model-comparisons.ts`) - Statistical model comparisons with cost-efficiency analysis
10. **Advanced Cost Management** (`src/cost-tracking/cost-manager.ts`) - Budget tracking, cost prediction, and optimization recommendations
11. **Token Analytics Service** (`src/analytics/token-analytics.ts`) - Comprehensive token usage analysis, efficiency comparison, and predictive modeling
12. **Monitoring & Alerts** (`src/monitoring/evaluation-monitor.ts`) - Performance regression detection with cost overrun alerts
13. **Automated Pipelines** (`src/automation/evaluation-pipeline.ts`) - CI/CD integration with quality gates and budget controls

---

## 📁 File-by-File Explanation

### 🔧 Core Configuration Files

#### `package.json`
**What it is:** Tells Node.js about our project and what libraries we need.

**Key parts:**
```json
{
  "name": "llm-evals-ts",           // Project name
  "dependencies": {                  // External libraries we use
    "openai": "^4.0.0",             // To talk to OpenAI models
    "yargs": "^17.0.0",             // To build command-line tools
    "yaml": "^2.0.0"                // To read configuration files
  },
  "scripts": {
    "build": "tsc",                 // Compile TypeScript to JavaScript
    "dev": "ts-node src/cli.ts"     // Run without compiling first
  }
}
```

#### `tsconfig.json`
**What it is:** Tells TypeScript how to compile our code.

**Why we need it:** TypeScript is like JavaScript but with extra safety features. This file configures those features.

---

### 🏛️ Core Types (`src/types.ts`)

**What it is:** Defines the "shape" of all our data. Think of it like blueprints for different types of information.

**Key types explained:**

```typescript
// A message in a conversation with AI
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';  // Who's talking?
  content: string;                         // What they said
}

// A test question for the AI
export interface EvalSample {
  input: ChatMessage[];    // The question/conversation
  ideal: string | string[]; // The correct answer(s)
  metadata?: Record<string, any>; // Extra info (optional)
}

// The AI's response
export interface CompletionResult {
  content: string;         // What the AI said
  usage?: {               // How many tokens used (optional)
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;         // Which AI model responded
}

// The final grade for one question with comprehensive tracking
export interface EvalResult {
  sample_id: string;      // Unique ID for this test
  input: ChatMessage[];   // The original question
  ideal: string | string[]; // The correct answer
  completion: CompletionResult; // What the AI said (with token usage)
  score: number;          // Grade (0.0 to 1.0)
  passed: boolean;        // Did it pass? (true/false)
  reasoning?: string;     // Why this grade? (optional)
  metadata?: Record<string, any>; // Additional data (e.g., token costs, timing)
}

// Final evaluation report with complete analytics
export interface EvalReport {
  eval_name: string;
  model: string;
  total_samples: number;
  correct: number;
  incorrect: number;
  score: number;           // Overall accuracy
  results: EvalResult[];
  run_id: string;
  created_at: string;
  duration_ms: number;
  token_usage?: TokenUsage; // Comprehensive token and cost tracking
  metadata?: Record<string, any>;
}
```

**Why types matter:** They prevent bugs by making sure we always use data correctly. If we try to put text where a number should go, TypeScript will warn us.

---

### 💾 Intelligent Caching System (`src/caching/evaluation-cache.ts`)

**What it is:** A sophisticated caching system that stores evaluation results to dramatically reduce API costs and improve performance.

**Key Benefits:**
- **80% Cost Reduction**: Avoid re-calling APIs for identical inputs
- **10x Speed Improvement**: Instant responses for cached results
- **Smart Invalidation**: Automatically clears cache when models or templates change
- **Production Ready**: Supports Redis (production) with graceful fallback to in-memory (development)

**How it works:**
```typescript
export class EvaluationCache {
  // Generate unique cache keys based on model + sample + template
  private generateCacheKey(model: string, sample: any, templateConfig: any): string {
    const modelHash = this.hashString(model);
    const sampleHash = this.hashString(JSON.stringify(sample));
    const templateHash = this.hashString(JSON.stringify(templateConfig));
    return `eval:${modelHash}:${sampleHash}:${templateHash}`;
  }

  // Store evaluation result with TTL (time to live)
  async setCachedResult(model: string, sample: any, templateConfig: any, result: any): Promise<void> {
    const key = this.generateCacheKey(model, sample, templateConfig);
    // Store in Redis or memory with automatic expiration
  }

  // Retrieve cached result if available and not expired
  async getCachedResult(model: string, sample: any, templateConfig: any): Promise<any | null> {
    const key = this.generateCacheKey(model, sample, templateConfig);
    // Return cached result or null if not found/expired
  }
}
```

**Configuration Options:**
```typescript
const cacheConfig = {
  enabled: true,
  provider: 'redis',                    // 'redis' or 'memory'
  redis_url: 'redis://localhost:6379',  // Redis connection
  ttl_seconds: 3600,                    // 1 hour cache lifetime
  max_memory_items: 1000                // Memory cache limit
};
```

**Real-world Example:**
```bash
# First run: All API calls made
npx ts-node src/cli.ts gpt-3.5-turbo math-basic --max-samples 10
# Result: 10 samples, 2,340 tokens, $0.0047, Duration: 15.3s

# Second run: All results from cache
npx ts-node src/cli.ts gpt-3.5-turbo math-basic --max-samples 10  
# Result: 10 samples, 0 tokens, $0.0000, Duration: 1.2s
# 💾 Cache: 100% hit rate, Saved: $0.0047, 10x faster!
```

**When cache helps most:**
- **Development**: Testing configurations repeatedly
- **A/B Testing**: Running same evaluation on multiple models
- **Debugging**: Re-running evaluations to fix issues
- **Regression Testing**: Ensuring consistent results over time

---

### 📊 Custom Metrics Framework (`src/metrics/custom-metrics.ts`)

**What it is:** An extensible system for calculating business-specific performance metrics beyond simple accuracy.

**Built-in Custom Metrics:**

1. **🎯 Cost Efficiency Metric** - Accuracy achieved per dollar spent
2. **✨ Response Consistency Metric** - How consistent responses are for similar inputs  
3. **⚡ Token Efficiency Metric** - Average tokens used per correct answer
4. **📊 Business Impact Metric** - Customizable business value scoring
5. **📈 Latency Percentile Metric** - Response time analysis (P95, P99, etc.)

**How to create custom metrics:**
```typescript
export class CustomerSatisfactionMetric extends CustomMetric {
  readonly name = 'customer_satisfaction';
  readonly display_name = 'Customer Satisfaction Score';
  readonly description = 'Estimated customer satisfaction based on response quality';
  readonly higher_is_better = true;
  readonly category = 'business' as const;

  async calculate(results: EvalResult[], report?: EvalReport): Promise<MetricResult> {
    let totalSatisfaction = 0;
    
    for (const result of results) {
      const response = result.completion.content;
      let satisfaction = 0.5; // Base score
      
      // Scoring factors
      if (response.length > 50) satisfaction += 0.2;        // Complete answers
      if (/please|thank|help/i.test(response)) satisfaction += 0.15; // Polite
      satisfaction += result.score * 0.25;                  // Accurate
      if (response.length < 200) satisfaction += 0.1;       // Concise
      
      totalSatisfaction += Math.min(1.0, satisfaction);
    }
    
    return {
      name: this.name,
      value: totalSatisfaction / results.length,
      display_name: this.display_name,
      description: this.description,
      higher_is_better: this.higher_is_better,
      category: this.category,
      metadata: {
        factors: ['completeness', 'politeness', 'accuracy', 'conciseness']
      }
    };
  }
}
```

**Metrics Registry Management:**
```typescript
// Register custom metrics
metricsRegistry.registerMetric(new CustomerSatisfactionMetric());

// Configure metrics
metricsRegistry.configureMetrics({
  'cost_efficiency': { enabled: true, weight: 1.0 },
  'customer_satisfaction': { enabled: true, threshold: 0.7 }
});

// Calculate all enabled metrics
const metrics = await metricsRegistry.calculateAllMetrics(results, report);
```

**Enhanced CLI Output with Custom Metrics:**
```bash
==================================================
🎯 Final Results:
   Total samples: 10
   Accuracy: 85.0%
   Duration: 12.3s

📈 Custom Metrics:
   ⚡ EFFICIENCY:
      ↗️ Cost Efficiency: 8,673.47
      ↙️ Token Efficiency: 39.3

   ✨ QUALITY:
      ↗️ Response Consistency: 0.924

   📊 BUSINESS:
      ↗️ Customer Satisfaction: 0.847

💾 Cache Performance:
   • Hit rate: 45.0%
   • Est. tokens saved: 1,250
==================================================
```

**Why Custom Metrics Matter:**
- **Business Alignment**: Measure what actually matters to your use case
- **Beyond Accuracy**: Quality, efficiency, cost, and user experience
- **Decision Making**: Data-driven model selection and optimization
- **Monitoring**: Track business-relevant performance over time

---

### 🤖 LLM Client (`src/llm-client.ts`)

**What it is:** The code that talks to AI models (like ChatGPT, local models, and HuggingFace models).

**How it works:**
```typescript
// This is like a universal translator for AI models
export interface LLMClient {
  complete(messages: ChatMessage[]): Promise<CompletionResult>;
  getModel(): string;
}

// Implementation for OpenAI (ChatGPT)
export class OpenAIClient implements LLMClient {
  private client: OpenAI;
  private model: string;

  async complete(messages: ChatMessage[]): Promise<CompletionResult> {
    // Send messages to OpenAI
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages,
      temperature: 0.0  // Make responses consistent
    });
    
    // Return the response in our standard format
    return {
      content: response.choices[0].message.content,
      usage: response.usage,
      model: response.model
    };
  }
}
```

**Why it's designed this way:** By using an interface (`LLMClient`), we can easily add support for different AI models without changing the rest of our code.

#### **Ollama Client (Local Models)**

**What it is:** Integration with Ollama for running AI models locally on your computer.

**Key benefits:**
- **Free**: No API costs, unlimited testing
- **Private**: All data stays on your machine  
- **Offline**: Works without internet connection
- **Custom Models**: Use your own fine-tuned models

```typescript
export class OllamaClient implements LLMClient {
  private model: string;
  private baseUrl: string = 'http://localhost:11434'; // Default Ollama server

  async complete(messages: ChatMessage[]): Promise<CompletionResult> {
    // Convert chat messages to a prompt format Ollama understands
    const prompt = this.formatMessagesAsPrompt(messages);
    
    // Send request to local Ollama server
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
        stream: false // Get complete response at once
      })
    });
    
    const data = await response.json();
    return {
      content: data.response,
      usage: {
        prompt_tokens: data.prompt_eval_count || 0,
        completion_tokens: data.eval_count || 0,
        total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      },
      model: this.model
    };
  }
}
```

**Usage examples:**
```bash
# Run with Llama2 model
npx ts-node src/cli.ts ollama/llama2 math-basic --max-samples 5

# Run with CodeLlama for programming tasks  
npx ts-node src/cli.ts ollama/codellama sql-basic --verbose

# Test any configuration without starting Ollama
npx ts-node src/cli.ts ollama/any-model math-basic --dry-run
```

#### **HuggingFace Client (Community Models)**

**What it is:** Integration with HuggingFace Inference API for access to 100,000+ community models.

**Key benefits:**
- **Huge Selection**: 100,000+ models from the community
- **Free Tier**: Many models work without API keys
- **Specialized Models**: Domain-specific fine-tuned models
- **Cutting Edge**: Latest research models appear here first

```typescript
export class HuggingFaceClient implements LLMClient {
  private model: string;
  private apiKey?: string;
  private baseUrl = 'https://api-inference.huggingface.co/models';

  async complete(messages: ChatMessage[]): Promise<CompletionResult> {
    // Convert messages to prompt format for HF models
    const prompt = this.formatMessagesAsPrompt(messages);
    
    // Send request to HuggingFace Inference API
    const response = await fetch(`${this.baseUrl}/${this.model}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          temperature: 0.7,
          max_new_tokens: 256,
          return_full_text: false
        }
      })
    });
    
    const data = await response.json();
    return {
      content: data[0].generated_text,
      usage: {
        prompt_tokens: Math.ceil(prompt.length / 4), // Estimated
        completion_tokens: Math.ceil(data[0].generated_text.length / 4),
        total_tokens: Math.ceil((prompt.length + data[0].generated_text.length) / 4)
      },
      model: this.model
    };
  }
}
```

**Usage examples:**
```bash
# Popular instruction-following models
npx ts-node src/cli.ts hf/google/flan-t5-large math-basic
npx ts-node src/cli.ts hf/microsoft/DialoGPT-large toxicity --max-samples 3

# Code generation models
npx ts-node src/cli.ts hf/codellama/CodeLlama-7b-Instruct-hf sql-basic
npx ts-node src/cli.ts hf/Salesforce/codegen-350M-mono math-basic

# Quick testing with lightweight models
npx ts-node src/cli.ts hf/distilgpt2 math-basic --max-samples 5
npx ts-node src/cli.ts hf/gpt2 toxicity --max-samples 3
```

#### **Universal Model Factory**

The framework automatically detects which provider to use based on the model name:

```typescript
export function createLLMClient(model: string): LLMClient {
  // OpenAI models
  if (model.startsWith('gpt-') || model.startsWith('o1-')) {
    return new OpenAIClient(model);
  }
  
  // Ollama local models  
  if (model.startsWith('ollama/') || model.includes('ollama')) {
    return new OllamaClient(model);
  }
  
  // HuggingFace models
  if (model.startsWith('hf/') || model.includes('huggingface.co')) {
    return new HuggingFaceClient(model);
  }
  
  // Default to OpenAI
  console.warn(`Unknown model provider for ${model}, defaulting to OpenAI`);
  return new OpenAIClient(model);
}
```

**This means the same evaluation can run on any model:**
```bash
# Same evaluation, different providers
npx ts-node src/cli.ts gpt-4 math-basic              # OpenAI (cloud)
npx ts-node src/cli.ts ollama/llama2 math-basic      # Local (free)
npx ts-node src/cli.ts hf/flan-t5-large math-basic   # HuggingFace (community)
```

---

### 📊 Dataset Loader (`src/dataset-loader.ts`)

**What it is:** Reads test questions from files and validates they're correct.

**JSONL format explained:**
```javascript
// Each line is a separate JSON object (that's what JSONL means)
{"input": [{"role": "user", "content": "What is 2+2?"}], "ideal": "4"}
{"input": [{"role": "user", "content": "What is 3+3?"}], "ideal": "6"}
```

**Key functions:**
```typescript
// Load questions from a file
export async function loadDataset(filePath: string): Promise<EvalDataset> {
  // 1. Read the file
  const content = fs.readFileSync(filePath, 'utf-8');
  // 2. Split into lines
  const lines = content.trim().split('\n');
  // 3. Parse each line as JSON
  // 4. Validate each question is formatted correctly
  // 5. Return all questions as an EvalDataset
}

// Validate one question is correct
function validateSample(data: any, lineNumber: number): EvalSample {
  // Check that 'input' exists and is an array
  if (!Array.isArray(data.input)) {
    throw new Error(`Line ${lineNumber}: 'input' must be an array`);
  }
  
  // Check each message in the input
  for (let msg of data.input) {
    if (!msg.role || !msg.content) {
      throw new Error(`Line ${lineNumber}: messages need 'role' and 'content'`);
    }
  }
  
  // Check that 'ideal' exists
  if (!data.ideal) {
    throw new Error(`Line ${lineNumber}: 'ideal' is required`);
  }
  
  return data as EvalSample;
}
```

**Why validation matters:** If our test questions are formatted wrong, the whole evaluation fails. This catches problems early.

---

### 🎯 Evaluation Templates

These are different ways to grade AI responses. Think of them as different types of exams.

**Available Evaluation Templates:**
- **BasicEval**: Exact text matching (strict)
- **ModelGradedEval**: AI judges AI (flexible, subjective)  
- **ChoiceBasedEval**: AI picks from predefined choices (structured)
- **SemanticSimilarityEval**: Meaning-based evaluation (intelligent, robust)

#### Basic Evaluation (`src/templates/basic-eval.ts`)

**What it does:** Simple text matching - checks if the AI's answer matches the expected answer exactly.

**When to use:** Multiple choice questions, simple math problems, factual answers.

```typescript
export class BasicEval implements EvalTemplate {
  async evaluate(sample: EvalSample, completion: CompletionResult): Promise<EvalResult> {
    // Get the AI's answer
    const actualAnswer = completion.content.trim();
    
    // Get the expected answer
    const expectedAnswers = Array.isArray(sample.ideal) ? sample.ideal : [sample.ideal];
    
    // Check if any expected answer matches
    let passed = false;
    for (const expected of expectedAnswers) {
      if (this.matchTexts(actualAnswer, expected)) {
        passed = true;
        break;
      }
    }
    
    return {
      sample_id: "sample_123",
      input: sample.input,
      ideal: sample.ideal,
      completion: completion,
      score: passed ? 1.0 : 0.0,
      passed: passed,
      reasoning: passed ? "Answer matches expected" : "Answer doesn't match"
    };
  }
}
```

#### Model-Graded Evaluation (`src/templates/model-graded-eval.ts`)

**What it does:** Uses another AI to grade the first AI's response.

**When to use:** Complex questions like essays, creative writing, or explanations where exact matching won't work.

**How it works:**
1. AI Model A answers the question: *"Write a story about friendship"*
2. AI Model B gets asked: *"Is this story about friendship good? Rate it 0-1."*
3. We use Model B's score as the grade

```typescript
export class ModelGradedEval implements EvalTemplate {
  private gradingClient: LLMClient; // The AI that grades responses
  
  async evaluate(sample: EvalSample, completion: CompletionResult): Promise<EvalResult> {
    // Build a prompt asking the grading AI to evaluate the response
    const gradingPrompt = `
      Please evaluate this response:
      Question: ${sample.input[0].content}
      Expected: ${sample.ideal}
      Actual: ${completion.content}
      
      Rate from 0.0 to 1.0 how good this answer is.
      SCORE: [your score]
    `;
    
    // Ask the grading AI
    const gradingResponse = await this.gradingClient.complete([
      { role: 'user', content: gradingPrompt }
    ]);
    
    // Extract the score from the response
    const score = this.extractScore(gradingResponse.content);
    
    return {
      sample_id: "sample_123",
      input: sample.input,
      ideal: sample.ideal,
      completion: completion,
      score: score,
      passed: score >= 0.5,
      reasoning: gradingResponse.content
    };
  }
}
```

#### Choice-Based Evaluation (`src/templates/choice-based-eval.ts`)

**What it does:** The grading AI must choose from specific options (like "Correct" or "Incorrect").

**When to use:** When you want consistent, structured grading.

**Your example:**
```yaml
sql:
  prompt: |-
    [Question]: {input}
    [Expert]: {ideal}  
    [Submission]: {completion}
    
    Is the submission correct?
  choice_strings:
    - "Correct"
    - "Incorrect"
  choice_scores:
    "Correct": 1.0
    "Incorrect": 0.0
```

**How it works:**
```typescript
export class ChoiceBasedEval implements EvalTemplate {
  async evaluate(sample: EvalSample, completion: CompletionResult): Promise<EvalResult> {
    // 1. Build the grading prompt by replacing variables
    let prompt = this.args.prompt;
    prompt = prompt.replace('{input}', sample.input[0].content);
    prompt = prompt.replace('{ideal}', sample.ideal);
    prompt = prompt.replace('{completion}', completion.content);
    
    // 2. Ask the grading AI
    const gradingResponse = await this.gradingClient.complete([
      { 
        role: 'user', 
        content: prompt + `\n\nRespond with exactly one of: ${this.args.choice_strings.join(', ')}`
      }
    ]);
    
    // 3. Find which choice the grading AI picked
    let chosenOption = '';
    for (const choice of this.args.choice_strings) {
      if (gradingResponse.content.includes(choice)) {
        chosenOption = choice;
        break;
      }
    }
    
    // 4. Get the score for that choice
    const score = this.args.choice_scores[chosenOption] || 0;
    
    return {
      sample_id: "sample_123",
      input: sample.input,
      ideal: sample.ideal,
      completion: completion,
      score: score,
      passed: score >= 0.5,
      reasoning: `Chose: ${chosenOption}`,
      metadata: { chosen_option: chosenOption }
    };
  }
}
```

#### Semantic Similarity Evaluation (`src/templates/semantic-similarity-eval.ts`)

**What it does:** Uses embeddings and cosine similarity to compare model outputs with ideal answers based on **meaning** rather than exact text matches.

**When to use:** Creative tasks, translations, question answering, explanations - any scenario where multiple phrasings can be correct.

**Why it's revolutionary:** Traditional evaluations fail when responses are correct but worded differently. Semantic similarity solves this by understanding **meaning**.

```typescript
// Example: Traditional vs Semantic
// Question: "What is the capital of France?"
// Expected: "Paris"
// Model says: "The capital city of France is Paris."

// Traditional exact match: ❌ FAIL (different text)
// Semantic similarity: ✅ PASS (same meaning, similarity: 0.87)
```

**How it works:**

```typescript
export class SemanticSimilarityEval implements EvalTemplate {
  private semanticService: SemanticSimilarityService;
  private args: SemanticSimilarityEvalArgs;

  constructor(args: SemanticSimilarityEvalArgs) {
    // Configuration with defaults
    this.args = {
      threshold: 0.8,                    // Minimum similarity to pass
      embeddings_provider: 'openai',     // or 'local'
      match_mode: 'best',                // 'best', 'threshold', or 'all'
      cache_embeddings: true,            // Performance optimization
      ...args
    };
    
    // Create embeddings service
    const provider = createEmbeddingsProvider(this.args.embeddings_provider);
    this.semanticService = new SemanticSimilarityService(provider);
  }

  async evaluate(sample: EvalSample, completion: CompletionResult): Promise<EvalResult> {
    const actualText = completion.content.trim();
    const idealAnswers = Array.isArray(sample.ideal) ? sample.ideal : [sample.ideal];
    
    let score: number;
    let passed: boolean;
    let reasoning: string;

    switch (this.args.match_mode) {
      case 'best':
        // Find the highest similarity among all ideal answers
        const bestMatch = await this.semanticService.calculateBestMatch(actualText, idealAnswers);
        score = bestMatch.bestSimilarity;
        passed = score >= this.args.threshold;
        reasoning = `Best semantic match: ${bestMatch.bestMatch} (similarity: ${score.toFixed(4)})`;
        break;

      case 'threshold':
        // Pass if ANY ideal answer meets threshold
        const similarities = await Promise.all(
          idealAnswers.map(ideal => 
            this.semanticService.calculateSimilarity(actualText, ideal)
          )
        );
        const maxSim = Math.max(...similarities.map(s => s.similarity));
        const passingCount = similarities.filter(s => s.similarity >= this.args.threshold).length;
        
        score = maxSim;
        passed = passingCount > 0;
        reasoning = `Threshold mode: ${passingCount}/${idealAnswers.length} answers above threshold`;
        break;

      case 'all':
        // Must meet threshold for ALL ideal answers
        const allSims = await Promise.all(
          idealAnswers.map(ideal => 
            this.semanticService.calculateSimilarity(actualText, ideal)
          )
        );
        const avgSim = allSims.reduce((sum, s) => sum + s.similarity, 0) / allSims.length;
        const allPassing = allSims.filter(s => s.similarity >= this.args.threshold).length;
        
        score = avgSim;
        passed = allPassing === idealAnswers.length;
        reasoning = `All mode: ${allPassing}/${idealAnswers.length} answers above threshold`;
        break;
    }

    return {
      sample_id: this.generateSampleId(sample),
      input: sample.input,
      ideal: sample.ideal,
      completion,
      score,
      passed,
      reasoning,
      metadata: {
        embeddings_provider: this.args.embeddings_provider,
        match_mode: this.args.match_mode,
        threshold: this.args.threshold,
        similarity_scores: score
      }
    };
  }
}
```

**The Three Match Modes Explained:**

**🥇 Best Mode (`match_mode: 'best'`)** - Most common
- Finds the **highest similarity** among all ideal answers
- Uses the best match for scoring
- **When to use**: When any of multiple correct answers is acceptable

```typescript
// Example: Multiple greetings
// Ideal: ["Hello", "Hi", "Hey", "Greetings"]  
// Model says: "Good morning"
// Similarities: [0.75, 0.73, 0.68, 0.81]
// Score: 0.81 (best match with "Greetings")
```

**🎯 Threshold Mode (`match_mode: 'threshold'`)** - Most lenient
- Passes if **ANY ideal answer** meets the threshold
- Uses maximum similarity for scoring
- **When to use**: When you want to be generous with multiple answers

```typescript
// Example: Creative responses
// Threshold: 0.7
// If ANY ideal answer gets ≥0.7 similarity → PASS
// Score: Maximum similarity found
```

**📏 All Mode (`match_mode: 'all'`)** - Most strict  
- Requires **ALL ideal answers** to meet threshold
- Uses average similarity for scoring
- **When to use**: When response must be similar to all acceptable answers

```typescript
// Example: Comprehensive requirements
// ALL ideal answers must get ≥threshold similarity
// Score: Average similarity across all answers
```

**Embeddings Providers:**

**🌐 OpenAI Embeddings (Recommended)**
```yaml
args:
  embeddings_provider: openai
  embeddings_model: text-embedding-3-small  # Fast, cheap
  # OR
  embeddings_model: text-embedding-3-large  # Accurate, expensive
```

- ✅ **High accuracy**: State-of-the-art semantic understanding
- ✅ **Multilingual**: Supports many languages  
- ✅ **Consistent**: Reliable, updated models
- ❌ **Costs money**: ~$0.00002 per 1K tokens (small), ~$0.00013 per 1K tokens (large)
- ❌ **Requires internet**: API calls needed

**💻 Local Embeddings (Free)**
```yaml
args:
  embeddings_provider: local
  embeddings_model: all-MiniLM-L6-v2  # Mock implementation
```

- ✅ **Free**: No API costs ever
- ✅ **Private**: Data stays on your machine
- ✅ **Offline**: Works without internet
- ❌ **Mock implementation**: Not production-ready (currently)
- ❌ **Lower accuracy**: Simple hash-based similarity

**Example YAML configurations:**

```yaml
# Basic semantic similarity
semantic-basic:
  class: SemanticSimilarityEval
  args:
    samples_jsonl: semantic/basic.jsonl
    threshold: 0.8
    embeddings_provider: openai
    match_mode: best

# Creative writing evaluation
semantic-creative:
  class: SemanticSimilarityEval  
  args:
    samples_jsonl: semantic/creative.jsonl
    threshold: 0.65                    # Lower threshold for creativity
    embeddings_provider: openai
    embeddings_model: text-embedding-3-large
    match_mode: best

# Local development (free)
semantic-local:
  class: SemanticSimilarityEval
  args:
    samples_jsonl: semantic/basic.jsonl
    threshold: 0.75                    # Slightly lower for local
    embeddings_provider: local         # No API costs
    match_mode: best
```

**Usage examples:**
```bash
# Basic semantic similarity with OpenAI
npx ts-node src/cli.ts gpt-3.5-turbo semantic-basic --max-samples 10

# Creative writing with verbose output
npx ts-node src/cli.ts gpt-4 semantic-creative --verbose --max-samples 5

# Free local evaluation
npx ts-node src/cli.ts ollama/llama2 semantic-local --max-samples 10

# Test configuration without API costs
npx ts-node src/cli.ts any-model semantic-qa --dry-run --verbose
```

**Real-world example output:**
```bash
Sample 1/5: ✅ PASS 
  Expected: "Paris"
  Got: "The capital of France is Paris."
  Similarity: 0.8542 (threshold: 0.8)
  Reasoning: Best semantic match: Paris (similarity: 0.8542)

Sample 2/5: ❌ FAIL
  Expected: "Blue" 
  Got: "The ocean appears blue due to light scattering."
  Similarity: 0.7834 (threshold: 0.8)
  Reasoning: Best semantic match: Blue (similarity: 0.7834)

🎯 Final Results: 80% accuracy (4/5 passed)
```

**Why Semantic Similarity is Game-Changing:**

1. **Meaningful Evaluation**: Judges understanding, not memorization
2. **Handles Creativity**: Works with poetry, stories, explanations  
3. **Multiple Correct Answers**: Flexible for real-world scenarios
4. **Language Agnostic**: Works across different languages
5. **Future-Proof**: Adapts to new AI capabilities automatically

**Common Use Cases:**
- **Question Answering**: "What is photosynthesis?" has many correct explanations
- **Creative Writing**: Poetry, stories, creative descriptions
- **Translation**: Multiple valid translations for same source
- **Educational**: Student answers with different valid phrasings
- **Conversational AI**: Natural responses vs. scripted answers

---

### 🗂️ Registry System (`src/registry.ts`)

**What it is:** Manages all the evaluation configurations. Think of it as a library catalog that knows about all available tests.

**How it works:**

1. **Loads YAML files** from `registry/evals/` that define evaluations
2. **Validates** the configurations are correct
3. **Creates the right evaluation template** when you want to run a test

```typescript
export class Registry {
  private configs: EvalRegistry = {}; // Stores all loaded configurations
  
  // Load all YAML files from the registry directory
  async loadRegistry(): Promise<void> {
    const evalsDir = path.join(this.registryPath, 'evals');
    const files = fs.readdirSync(evalsDir).filter(file => 
      file.endsWith('.yaml') || file.endsWith('.yml')
    );
    
    for (const file of files) {
      const filePath = path.join(evalsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = yaml.parse(content); // Convert YAML to JavaScript object
      
      // Store each evaluation configuration
      Object.entries(data).forEach(([key, config]) => {
        this.configs[key] = config as EvalConfig;
      });
    }
  }
  
  // Create the right type of evaluation template
  createTemplate(evalName: string, gradingClient?: LLMClient): EvalTemplate {
    const config = this.getConfig(evalName);
    
    // Look at the 'class' field to know which template to create
    switch (config.class) {
      case 'BasicEval':
        return new BasicEval(config.args);
      case 'ModelGradedEval':
        return new ModelGradedEval(config.args, gradingClient);
      case 'ChoiceBasedEval':
        return new ChoiceBasedEval(config.args, gradingClient);
      case 'SemanticSimilarityEval':
        return new SemanticSimilarityEval(config.args);
      default:
        throw new Error(`Unknown evaluation template: ${config.class}`);
    }
  }
}
```

**Example YAML configuration:**
```yaml
# registry/evals/math.yaml
math-basic:
  id: math-basic.dev.v0
  description: Basic arithmetic evaluation
  metrics: [accuracy]
  class: BasicEval
  args:
    samples_jsonl: math/basic.jsonl
    match_type: exact
    case_sensitive: false
```

---

### 🏃 Evaluation Runner (`src/eval-runner.ts`)

**What it is:** The main orchestrator that runs the entire evaluation process.

**What it does step-by-step:**

```typescript
export class EvalRunner {
  async runEval(options: RunOptions): Promise<EvalReport> {
    // 1. Load the registry (all available evaluations)
    await this.registry.loadRegistry();
    
    // 2. Get the specific evaluation configuration
    const config = this.registry.getConfig(options.eval);
    
    // 3. Load the dataset (questions)
    const dataset = await loadDataset(this.registry.getDatasetPath(options.eval));
    
    // 4. Limit samples if requested
    const samples = options.max_samples 
      ? dataset.samples.slice(0, options.max_samples)
      : dataset.samples;
    
    // 5. Create LLM client to talk to the AI
    const llmClient = createLLMClient(options.model);
    
    // 6. Create the evaluation template (how to grade)
    const template = this.registry.createTemplate(options.eval, llmClient);
    
    // 7. Run evaluation on each sample
    const results: EvalResult[] = [];
    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];
      
      // Ask the AI the question
      const completion = await llmClient.complete(sample.input);
      
      // Grade the AI's answer
      const result = await template.evaluate(sample, completion);
      results.push(result);
      
      // Log progress
      console.log(`Progress: ${i + 1}/${samples.length}`);
    }
    
    // 8. Calculate final statistics
    const correct = results.filter(r => r.passed).length;
    const score = correct / results.length;
    
    // 9. Create and return the final report
    return {
      eval_name: options.eval,
      model: options.model,
      total_samples: results.length,
      correct: correct,
      incorrect: results.length - correct,
      score: score,
      results: results,
      // ... other report fields
    };
  }
}
```

---

### 📝 Logger (`src/logger.ts`)

**What it is:** Records everything that happens during an evaluation for later analysis.

**What it logs:**
- Which evaluation was run
- Each question and answer
- Each grade and reasoning
- Final statistics
- Timestamps for everything

```typescript
export class Logger {
  private events: Map<string, LogEvent[]> = new Map();
  
  // Record something that happened
  async logEvent(event: LogEvent): Promise<void> {
    const runEvents = this.events.get(event.run_id) || [];
    runEvents.push(event);
    this.events.set(event.run_id, runEvents);
  }
  
  // Save all events to a file in JSONL format
  async saveToFile(filePath: string, runId: string): Promise<void> {
    const events = this.getEvents(runId);
    const jsonlContent = events
      .map(event => JSON.stringify(event))
      .join('\n');
    fs.writeFileSync(filePath, jsonlContent);
  }
}
```

**Example log entry:**
```json
{
  "run_id": "20231201123456ABC123",
  "event_id": 1,
  "sample_id": "sample_0",
  "type": "sampling",
  "data": {
    "input": [{"role": "user", "content": "What is 2+2?"}],
    "completion": "The answer is 4.",
    "usage": {"total_tokens": 25}
  },
  "created_at": "2023-12-01T12:34:56.789Z"
}
```

---

### 💻 CLI Tool (`src/cli.ts`)

**What it is:** The enhanced command-line interface with comprehensive token analytics, cost management, intelligent caching, and custom metrics.

**How it works:**
```bash
# Basic evaluation with automatic token tracking and caching
npx ts-node src/cli.ts gpt-3.5-turbo math-basic --max-samples 10

# Token analytics commands
npx ts-node src/cli.ts tokens report 30              # Generate comprehensive token report
npx ts-node src/cli.ts tokens trends math-basic 7    # Show token trends over time
npx ts-node src/cli.ts tokens efficiency gpt-4 gpt-3.5-turbo # Compare model efficiency

# Cost management commands
npx ts-node src/cli.ts costs breakdown 30           # Cost breakdown by evaluation
npx ts-node src/cli.ts costs predict gpt-4 math-basic 100  # Predict costs for future runs
npx ts-node src/cli.ts costs estimate gpt-3.5-turbo 50     # Quick cost estimation
npx ts-node src/cli.ts costs budget math-basic 25.00       # Set/check budget limits

# Cache management commands (NEW)
npx ts-node src/cli.ts cache stats                  # View cache performance metrics
npx ts-node src/cli.ts cache clear                  # Clear all cached results
npx ts-node src/cli.ts cache invalidate gpt-3.5-turbo # Invalidate cache for specific model

# Custom metrics commands (NEW)
npx ts-node src/cli.ts metrics list                 # List all available custom metrics
npx ts-node src/cli.ts metrics test demo            # Test metrics framework with sample data

# Interactive web dashboard
npx ts-node src/cli.ts dashboard 3000               # Start analytics dashboard
```

**Key parts:**
```typescript
// Enhanced command line with token analytics and cost management
const argv = await yargs(hideBin(process.argv))
  .command('$0 <model> <eval>', 'Run an evaluation', (yargs) => {
    return yargs
      .positional('model', { describe: 'Model to evaluate', type: 'string' })
      .positional('eval', { describe: 'Evaluation to run', type: 'string' });
  })
  
  // Token Analytics Commands
  .command('tokens [command]', 'Token usage analytics and management', (yargs) => {
    return yargs
      .command('report [days]', 'Generate comprehensive token analytics report')
      .command('trends <eval_name> [days]', 'Show token usage trends')
      .command('efficiency [models..]', 'Compare token efficiency between models');
  })
  
  // Cost Management Commands  
  .command('costs [command]', 'Cost analysis and budget management', (yargs) => {
    return yargs
      .command('breakdown [days]', 'Show cost breakdown by evaluation')
      .command('predict <model> <eval_name> <sample_count>', 'Predict costs')
      .command('estimate <model> <sample_count>', 'Quick cost estimate')
      .command('budget <eval_name> [amount]', 'Set or check budget');
  })
  
  // Interactive Dashboard
  .command('dashboard [port]', 'Start analytics dashboard server');

// Enhanced evaluation with automatic token tracking
async function runEval(options: RunOptions): Promise<void> {
  try {
    const runner = new EvalRunner(options.registry_path);
    const report = await runner.runEval(options); // Now includes token tracking
    
    // Enhanced output with token and cost information
    console.log(`🎯 Final Score: ${(report.score * 100).toFixed(1)}%`);
    if (report.token_usage) {
      console.log(`📊 Tokens Used: ${report.token_usage.total_tokens.toLocaleString()}`);
      console.log(`💰 Estimated Cost: $${report.token_usage.estimated_cost.toFixed(4)}`);
    }
  } catch (error) {
    console.error('❌ Evaluation failed:', error.message);
    process.exit(1);
  }
}
```

---

## 🚀 Production Features Explained

The framework includes advanced production features that transform it from a basic evaluation tool into an enterprise-grade AI quality assurance platform.

### 📊 Interactive Analytics Dashboard (`src/dashboard/dashboard-server.ts`)

**What it is:** An advanced web server providing comprehensive token analytics, cost visualization, and performance insights through an interactive dashboard.

**What it does:**
- **Real-time Analytics Dashboard** at `http://localhost:3000` with auto-refresh
- **Token Usage Visualization** - Charts showing token consumption patterns and trends
- **Cost Tracking & Budget Monitoring** - Live budget status with color-coded health indicators
- **Model Efficiency Comparison** - Side-by-side performance and cost analysis
- **AI-Powered Recommendations** - Automated optimization suggestions
- **Complete API Explorer** - Interactive documentation for all endpoints

**New Token & Cost Features:**
- Live token usage metrics and trend analysis
- Budget health monitoring with alerts (🟢🟡🟠🔴)
- Model efficiency rankings with cost per correct answer
- Cost prediction with confidence intervals
- Real-time cost breakdown by evaluation type
- Historical spending analysis and forecasting

**How it works:**
```typescript
export class DashboardServer {
  private app: any; // Express web server
  private analytics: EvaluationAnalytics; // Performance analysis
  private store: EvaluationStore; // Database access
  private tokenAnalytics: TokenAnalyticsService; // NEW: Token analytics
  private costManager: CostManager; // NEW: Cost management

  constructor(store?: EvaluationStore) {
    this.store = store || new EvaluationStore();
    this.analytics = new EvaluationAnalytics(this.store);
    this.tokenAnalytics = new TokenAnalyticsService(this.store); // NEW
    this.costManager = new CostManager(); // NEW
    this.app = this.createApp();
    this.setupRoutes();
  }

  private setupRoutes() {
    // ========== ORIGINAL ENDPOINTS ==========
    // Performance trends and model comparisons
    this.app.get('/api/trends/:evalName', async (req, res) => { ... });
    this.app.get('/api/compare', async (req, res) => { ... });

    // ========== NEW TOKEN ANALYTICS ENDPOINTS ==========
    // Comprehensive token analytics report
    this.app.get('/api/analytics/tokens', async (req, res) => {
      const days = parseInt(req.query.days) || 30;
      const report = await this.tokenAnalytics.generateAnalyticsReport(days);
      res.json(report);
    });

    // Token usage trends over time  
    this.app.get('/api/analytics/tokens/trends', async (req, res) => {
      const evalName = req.query.eval_name;
      const trends = await this.tokenAnalytics.getTokenTrends(evalName, days);
      res.json(trends);
    });

    // Model efficiency comparison
    this.app.get('/api/analytics/tokens/efficiency', async (req, res) => {
      const models = req.query.models?.split(',') || [];
      const efficiency = await this.tokenAnalytics.compareModelEfficiency(models, evalName, days);
      res.json(efficiency);
    });

    // ========== NEW COST MANAGEMENT ENDPOINTS ==========
    // Cost breakdown by evaluation
    this.app.get('/api/analytics/costs/breakdown', async (req, res) => {
      const breakdown = await this.tokenAnalytics.getCostBreakdown(days);
      res.json(breakdown);
    });

    // Cost prediction with confidence intervals
    this.app.get('/api/analytics/costs/predict', async (req, res) => {
      const { model, eval_name, sample_count } = req.query;
      const prediction = await this.tokenAnalytics.predictCosts(model, eval_name, parseInt(sample_count));
      res.json(prediction);
    });

    // Budget management
    this.app.post('/api/budget/:evalName', async (req, res) => {
      const { budget } = req.body;
      this.costManager.setBudget(req.params.evalName, budget);
      res.json({ success: true });
    });

    this.app.get('/api/budget/:evalName/status', async (req, res) => {
      const status = this.costManager.checkBudgetStatus(req.params.evalName);
      res.json(status || { status: 'no_budget_set' });
    });

    // ========== INTERACTIVE DASHBOARD UI ==========
    // Main dashboard data aggregation
    this.app.get('/api/dashboard', async (req, res) => {
      const days = parseInt(req.query.days) || 7;
      const [tokenAnalytics, trends, efficiency] = await Promise.all([
        this.tokenAnalytics.generateAnalyticsReport(days),
        this.tokenAnalytics.getTokenTrends(undefined, days),
        this.tokenAnalytics.compareModelEfficiency([], undefined, days)
      ]);
      
      res.json({
        summary: tokenAnalytics.summary,
        recent_trends: trends.slice(0, 10),
        top_models: efficiency.slice(0, 5),
        recommendations: tokenAnalytics.recommendations,
        period_days: days
      });
    });

    // Serve interactive HTML dashboard
    this.app.get('/', (req, res) => {
      res.send(this.generateDashboardHTML()); // Full interactive UI
    });
  }
}
```

**When to use:** Essential for ongoing monitoring, cost control, executive reporting, and when non-technical stakeholders need visual insights into AI performance and spending.

**Example usage:**
```bash
# Start the enhanced dashboard
npx ts-node src/cli.ts dashboard 3000

# Visit http://localhost:3000 to see:
# • Real-time token usage and cost analytics
# • Model efficiency comparisons with ROI analysis  
# • Budget monitoring with color-coded health indicators
# • AI-powered optimization recommendations
# • Interactive API explorer with live data
# • Auto-refreshing charts and metrics
```

**Key Dashboard Features:**
- **📈 Summary Cards**: Total evaluations, tokens, costs with period comparison
- **🏆 Model Rankings**: Efficiency-based ranking with cost per correct answer
- **💡 AI Recommendations**: Automated suggestions for cost optimization
- **⚡ System Status**: Real-time health monitoring of all services
- **🔌 API Explorer**: Interactive documentation with live endpoint testing
- **📊 Responsive Design**: Works on desktop, tablet, and mobile devices

---

### 🗄️ Database Storage (`src/database/evaluation-store.ts`)

**What it is:** Stores all evaluation results in a database for historical analysis and trend tracking.

**What it does:**
- Saves every evaluation result permanently
- Tracks performance trends over weeks/months  
- Enables comparison between different model versions
- Provides data for regression detection and analytics

**How it works:**
```typescript
export class EvaluationStore {
  private db: Database; // SQLite database connection

  // Save a complete evaluation report
  async saveEvaluation(report: EvalReport, cost?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO eval_runs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          report.run_id,      // Unique ID
          report.eval_name,   // Which evaluation
          report.model,       // Which AI model
          report.score,       // Overall score
          report.total_samples, // Number of questions
          report.correct,     // Number correct
          report.incorrect,   // Number wrong
          report.duration_ms, // How long it took
          cost || 0,          // How much it cost
          report.created_at,  // When it ran
          JSON.stringify(report.metadata || {}) // Extra data
        ],
        (err: Error | null) => err ? reject(err) : resolve()
      );
    });
  }

  // Get performance trends over time
  async getPerformanceTrends(evalName: string, days: number = 30): Promise<EvaluationTrend[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT 
          DATE(created_at) as date,
          AVG(score) as score,
          model,
          eval_name as evaluation,
          SUM(total_samples) as sample_count
        FROM eval_runs 
        WHERE eval_name = ? 
          AND created_at > datetime('now', '-${days} days')
        GROUP BY DATE(created_at), model, eval_name
        ORDER BY date DESC`,
        [evalName],
        (err: Error | null, rows: any[]) => 
          err ? reject(err) : resolve(rows as EvaluationTrend[])
      );
    });
  }
}
```

**Database tables created:**
1. `eval_runs` - Stores overall evaluation results
2. `eval_results` - Stores individual question results  
3. `model_comparisons` - Stores A/B test comparisons

**When to use:** Always! Historical data is crucial for understanding AI performance over time.

**Graceful fallback:** If SQLite isn't installed, uses in-memory storage with a warning.

---

### ⚔️ A/B Testing (`src/ab-testing/model-comparisons.ts`)

**What it is:** Statistical comparison of multiple AI models to determine which performs better.

**What it does:**
- Runs the same evaluation on multiple models
- Performs statistical significance testing (t-tests, confidence intervals)
- Calculates effect sizes to measure practical significance
- Provides evidence-based recommendations

**How it works:**
```typescript
export class ModelComparison {
  async runComparison(config: ComparisonConfig): Promise<ComparisonResult> {
    console.log(`🔬 Starting A/B test: "${config.name}"`);

    const results: Record<string, EvalReport[]> = {};

    // Step 1: Run each model on each evaluation
    for (const model of config.models) {
      results[model] = [];
      for (const evaluation of config.evaluations) {
        console.log(`🧪 Testing ${model} on ${evaluation}...`);
        
        const options: RunOptions = {
          model,
          eval: evaluation,
          registry_path: './registry',
          max_samples: config.sample_size,
          verbose: false
        };

        const report = await this.runner.runEval(options);
        results[model].push(report);
      }
    }

    // Step 2: Perform statistical analysis
    const statistical_analysis = this.performStatisticalAnalysis(results, config);
    
    // Step 3: Generate recommendations
    const recommendations = this.generateRecommendations(statistical_analysis, results);

    return {
      comparison_id: `comparison_${Date.now()}`,
      config,
      model_results: results,
      statistical_analysis,
      recommendations,
      created_at: new Date().toISOString()
    };
  }

  // Simplified t-test for comparing model performance
  private simpleTTest(scoresA: number[], scoresB: number[]) {
    const meanA = scoresA.reduce((a, b) => a + b, 0) / scoresA.length;
    const meanB = scoresB.reduce((a, b) => a + b, 0) / scoresB.length;
    
    // Calculate variance for each group
    const varA = scoresA.reduce((sum, score) => sum + Math.pow(score - meanA, 2), 0) / (scoresA.length - 1);
    const varB = scoresB.reduce((sum, score) => sum + Math.pow(score - meanB, 2), 0) / (scoresB.length - 1);
    
    // Calculate t-statistic
    const pooledStd = Math.sqrt((varA / scoresA.length) + (varB / scoresB.length));
    const tStat = (meanA - meanB) / pooledStd;
    
    // Calculate p-value (simplified)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(tStat)));
    
    // Calculate effect size (Cohen's d)
    const pooledVariance = ((scoresA.length - 1) * varA + (scoresB.length - 1) * varB) / 
                          (scoresA.length + scoresB.length - 2);
    const effectSize = (meanA - meanB) / Math.sqrt(pooledVariance);
    
    return {
      meanDifference: meanA - meanB,
      pValue: Math.max(0.001, pValue),
      effectSize
    };
  }
}
```

**Example configuration:**
```typescript
const result = await comparison.runComparison({
  name: "Safety Evaluation Comparison",
  models: ['gpt-4', 'claude-3-opus', 'gemini-pro'],
  evaluations: ['safety_comprehensive', 'bias_detection'],
  sample_size: 100,
  confidence_level: 0.95
});

console.log(result.recommendations);
// ["🏆 Best performing model: gpt-4 (94.2% accuracy)",
//  "✅ gpt-4 is statistically significantly better than claude-3-opus",
//  "📊 Found 3 statistically significant performance differences"]
```

**When to use:** When choosing between models, validating performance claims, or ensuring model changes are actual improvements.

---

### 💰 Cost Management (`src/cost-tracking/cost-manager.ts`)

**What it is:** Tracks API costs and manages budgets to prevent overspending on evaluations.

**What it does:**
- Calculates real-time costs based on token usage and model pricing
- Sets budget limits with automatic alerts
- Tracks costs per evaluation and per model
- Provides cost forecasting and optimization recommendations

**How it works:**
```typescript
export class CostManager {
  private costs: Map<string, CostConfig> = new Map(); // Model pricing data
  private budgets: Map<string, number> = new Map(); // Budget limits
  private currentCosts: Map<string, number> = new Map(); // Current spending

  constructor() {
    this.initDefaultCosts(); // Load pricing for OpenAI, Anthropic, etc.
  }

  // Set a budget limit for an evaluation
  setBudget(evaluation: string, budget: number) {
    this.budgets.set(evaluation, budget);
    if (!this.currentCosts.has(evaluation)) {
      this.currentCosts.set(evaluation, 0);
    }
  }

  // Calculate cost of a single API call
  calculateCompletionCost(model: string, completion: CompletionResult, inputTokens?: number): number {
    const config = this.findCostConfig(model);
    if (!config) {
      console.warn(`⚠️  No cost config found for model ${model}`);
      return 0;
    }

    // Estimate tokens if not provided (rough approximation: 1 token = 4 characters)
    const estimatedInputTokens = inputTokens || Math.ceil(completion.content.length / 4);
    const estimatedOutputTokens = Math.ceil(completion.content.length / 4);

    // Calculate costs
    const inputCost = (estimatedInputTokens / 1000) * config.input_cost_per_1k_tokens;
    const outputCost = (estimatedOutputTokens / 1000) * config.output_cost_per_1k_tokens;

    return inputCost + outputCost;
  }

  // Check if budget limits are being approached
  checkBudgetStatus(evaluation: string): BudgetAlert | null {
    const budget = this.budgets.get(evaluation);
    const currentCost = this.currentCosts.get(evaluation) || 0;

    if (!budget) return null;

    const percentageUsed = (currentCost / budget) * 100;

    if (currentCost >= budget) {
      return {
        type: 'exceeded',
        message: `🚨 Budget exceeded for ${evaluation}! Used $${currentCost.toFixed(4)} of $${budget.toFixed(4)} budget`,
        current_cost: currentCost,
        budget_limit: budget,
        percentage_used: percentageUsed
      };
    }

    if (percentageUsed >= 90) {
      return {
        type: 'limit_reached',
        message: `⚠️  Budget limit reached for ${evaluation}: ${percentageUsed.toFixed(1)}% used`,
        current_cost: currentCost,
        budget_limit: budget,
        percentage_used: percentageUsed
      };
    }

    if (percentageUsed >= 75) {
      return {
        type: 'warning',
        message: `⚠️  Budget warning for ${evaluation}: ${percentageUsed.toFixed(1)}% used`,
        current_cost: currentCost,
        budget_limit: budget,
        percentage_used: percentageUsed
      };
    }

    return null;
  }

  // Estimate cost before running evaluation
  estimateEvaluationCost(model: string, sampleCount: number, avgInputLength: number = 500, avgOutputLength: number = 200): number {
    const config = this.findCostConfig(model);
    if (!config) return 0;

    const avgInputTokens = Math.ceil(avgInputLength / 4);
    const avgOutputTokens = Math.ceil(avgOutputLength / 4);

    const costPerSample = 
      (avgInputTokens / 1000) * config.input_cost_per_1k_tokens +
      (avgOutputTokens / 1000) * config.output_cost_per_1k_tokens;

    return costPerSample * sampleCount;
  }
}
```

**Example usage:**
```typescript
const costManager = new CostManager();

// Set budget limits
costManager.setBudget('safety_evaluations', 100.00); // $100 monthly budget
costManager.setBudget('experimental_tests', 25.00);  // $25 monthly budget

// Estimate costs before running
const estimated = costManager.estimateEvaluationCost('gpt-4', 50, 500, 200);
console.log(`Estimated cost: $${estimated.toFixed(4)}`);

// Track actual costs during evaluation
const costBreakdown = costManager.trackEvaluationCost('safety_eval', 'gpt-4', completions);

// Check budget status
const alert = costManager.checkBudgetStatus('safety_evaluations');
if (alert) {
  console.log(`🚨 ${alert.message}`);
}
```

**When to use:** Always! Cost control is essential to prevent accidentally spending hundreds of dollars on evaluations.

---

### 🚨 Monitoring & Alerts (`src/monitoring/evaluation-monitor.ts`)

**What it is:** Automated monitoring system that detects performance regressions and sends alerts.

**What it does:**
- Monitors evaluation performance in real-time
- Detects when models perform worse than baseline
- Tracks failure rates, latency spikes, and cost overruns
- Sends alerts via Slack, email, logs, or webhooks

**How it works:**
```typescript
export class EvaluationMonitor {
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private store: EvaluationStore;

  constructor(store: EvaluationStore) {
    this.store = store;
    this.setupDefaultRules(); // Creates common alert rules
  }

  // Add a custom alert rule
  addRule(rule: AlertRule) {
    this.alertRules.set(rule.id, rule);
  }

  // Check all rules after an evaluation completes
  async checkAlerts(report: EvalReport): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = [];

    for (const [ruleId, rule] of this.alertRules.entries()) {
      if (!rule.enabled) continue;

      // Check cooldown period to prevent spam
      const lastAlertTime = this.lastAlertTimes.get(ruleId) || 0;
      const cooldownMs = (rule.cooldown_minutes || 0) * 60 * 1000;
      if (Date.now() - lastAlertTime < cooldownMs) continue;

      // Evaluate the rule
      const alert = await this.evaluateRule(rule, report);
      if (alert) {
        triggeredAlerts.push(alert);
        this.activeAlerts.set(alert.id, alert);
        this.lastAlertTimes.set(ruleId, Date.now());
        
        // Execute alert actions
        await this.executeAlertActions(alert, rule.actions);
      }
    }

    return triggeredAlerts;
  }

  // Check for performance drops compared to baseline
  private async checkScoreDrop(rule: AlertRule, report: EvalReport): Promise<Alert | null> {
    // Get recent performance trends
    const trends = await this.store.getPerformanceTrends(report.eval_name, 7); // Last 7 days

    if (trends.length < 2) return null; // Need historical data

    const recentScores = trends.slice(0, 5).map(t => t.score);
    const olderScores = trends.slice(5, 10).map(t => t.score);

    if (recentScores.length === 0 || olderScores.length === 0) return null;

    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
    
    const percentageChange = Math.abs((recentAvg - olderAvg) / olderAvg);

    // If recent performance is worse and the change is significant
    if (recentAvg < olderAvg && percentageChange >= rule.condition.threshold) {
      return {
        id: `alert_${Date.now()}_${rule.id}`,
        rule_id: rule.id,
        severity: percentageChange >= 0.2 ? 'high' : 'medium',
        title: `Performance Drop Detected: ${report.eval_name}`,
        description: `Score dropped ${(percentageChange * 100).toFixed(1)}% for ${report.eval_name} on ${report.model}. Recent: ${(recentAvg * 100).toFixed(1)}%, Previous: ${(olderAvg * 100).toFixed(1)}%`,
        triggered_at: new Date().toISOString(),
        data: {
          recent_average: recentAvg,
          previous_average: olderAvg,
          percentage_change: percentageChange,
          evaluation: report.eval_name,
          model: report.model
        }
      };
    }

    return null;
  }

  // Execute alert actions (send notifications)
  private async executeAlertActions(alert: Alert, actions: AlertAction[]): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'log':
            this.logAlert(alert, action.config);
            break;
          
          case 'slack':
            await this.sendSlackAlert(alert, action.config);
            break;
          
          case 'email':
            await this.sendEmailAlert(alert, action.config);
            break;
        }
      } catch (error) {
        console.error(`Failed to execute alert action ${action.type}:`, error);
      }
    }
  }
}
```

**Example alert rules:**
```typescript
const monitor = new EvaluationMonitor(evaluationStore);

// Alert if safety performance drops by 5%
monitor.addRule({
  id: 'safety_drop',
  name: 'Safety Performance Drop',
  condition: {
    type: 'score_drop',
    threshold: 0.05, // 5% drop
    evaluations: ['safety_comprehensive']
  },
  actions: [
    { type: 'log', config: { level: 'warning' } },
    { type: 'slack', config: { channel: '#safety-alerts' } }
  ],
  enabled: true,
  cooldown_minutes: 30
});

// Alert if failure rate exceeds 20%
monitor.addRule({
  id: 'high_failure_rate',
  name: 'High Failure Rate',
  condition: {
    type: 'failure_rate',
    threshold: 0.2, // 20% failure rate
    comparison: 'greater_than'
  },
  actions: [
    { type: 'email', config: { to: 'team@company.com' } }
  ],
  enabled: true
});
```

**When to use:** Essential for production deployments to catch performance regressions before they impact users.

---

### 🔄 Automated Pipelines (`src/automation/evaluation-pipeline.ts`)

**What it is:** CI/CD integration that runs evaluations automatically and enforces quality gates.

**What it does:**
- Runs evaluations on schedule (nightly, weekly)
- Blocks deployments if models don't meet quality thresholds
- Integrates with GitHub, Slack, and other development tools
- Provides quality assurance for AI model updates

**How it works:**
```typescript
export class EvaluationPipeline {
  async runPipeline(config: PipelineConfig): Promise<PipelineResult> {
    const pipelineId = `pipeline_${Date.now()}_${config.name.replace(/\s+/g, '_')}`;
    console.log(`🚀 Starting pipeline: "${config.name}" (${pipelineId})`);

    const result: PipelineResult = {
      pipeline_id: pipelineId,
      name: config.name,
      status: 'success',
      started_at: new Date().toISOString(),
      evaluation_results: [],
      quality_gate_results: [],
      deployment_recommendation: 'approve'
    };

    try {
      // Step 1: Run all evaluations
      if (config.parallel_execution) {
        result.evaluation_results = await this.runEvaluationsParallel(config);
      } else {
        result.evaluation_results = await this.runEvaluationsSequential(config);
      }

      // Step 2: Check quality gates
      result.quality_gate_results = this.evaluateQualityGates(config.quality_gates, result.evaluation_results);

      // Step 3: Determine deployment recommendation
      const failedGates = result.quality_gate_results.filter(g => g.status === 'failed');
      const warningGates = result.quality_gate_results.filter(g => g.status === 'warning');

      if (failedGates.length > 0) {
        result.status = 'failure';
        result.deployment_recommendation = 'reject';
      } else if (warningGates.length > 0) {
        result.status = 'warning';
        result.deployment_recommendation = 'review_required';
      }

      // Step 4: Send notifications
      await this.sendNotifications(config.notifications, result);

    } catch (error) {
      result.status = 'failure';
      result.deployment_recommendation = 'reject';
      console.error(`❌ Pipeline "${config.name}" failed:`, error);
    }

    return result;
  }

  // Evaluate a single quality gate
  private evaluateQualityGate(gate: QualityGate, results: EvalReport[]): QualityGateResult {
    // Filter results if specific evaluations/models are specified
    let filteredResults = results;
    if (gate.condition.evaluations) {
      filteredResults = filteredResults.filter(r => gate.condition.evaluations!.includes(r.eval_name));
    }

    let actualValue: number;
    let passed: boolean;
    let message: string;

    switch (gate.condition.type) {
      case 'min_score':
        actualValue = this.calculateAverageScore(filteredResults);
        passed = actualValue >= gate.condition.threshold;
        message = `Average score: ${(actualValue * 100).toFixed(1)}% (required: ≥${(gate.condition.threshold * 100).toFixed(1)}%)`;
        break;

      case 'max_cost':
        actualValue = this.calculateTotalCost(filteredResults);
        passed = actualValue <= gate.condition.threshold;
        message = `Total cost: $${actualValue.toFixed(4)} (max allowed: $${gate.condition.threshold.toFixed(4)})`;
        break;

      default:
        actualValue = 0;
        passed = true;
        message = 'Unknown condition type';
    }

    return {
      gate_name: gate.name,
      status: passed ? 'passed' : (gate.required ? 'failed' : 'warning'),
      actual_value: actualValue,
      threshold: gate.condition.threshold,
      message
    };
  }
}
```

**Example pipeline configuration:**
```typescript
const pipeline = new EvaluationPipeline('./registry', costManager, monitor);

const config = {
  name: "Production Deployment Gate",
  evaluations: ['safety', 'helpfulness', 'factual_accuracy'],
  models: ['gpt-4'],
  quality_gates: [
    {
      name: "Safety Minimum",
      condition: { type: 'min_score', threshold: 0.95 }, // 95% required
      action: 'fail',
      required: true
    },
    {
      name: "Cost Control", 
      condition: { type: 'max_cost', threshold: 10.00 }, // Max $10
      action: 'warn',
      required: false
    }
  ],
  notifications: [
    { type: 'github_status', trigger_on: ['success', 'failure'] },
    { type: 'slack', config: { channel: '#deployments' }, trigger_on: ['failure'] }
  ]
};

const result = await pipeline.runPipeline(config);
console.log(`Pipeline result: ${result.deployment_recommendation}`);
// "approve", "reject", or "review_required"
```

**When to use:** Essential for production AI systems to ensure only high-quality models are deployed.

---

## 🔄 Data Flow: From Start to Finish

Let's trace what happens when you run: `npx ts-node src/cli.ts gpt-3.5-turbo math-basic --max-samples 5`

**Now with comprehensive token tracking and cost analysis:**

### Step 1: CLI Parsing
```
cli.ts receives: ["gpt-3.5-turbo", "math-basic", "--max-samples", "5"]
↓
Parsed as: { model: "gpt-3.5-turbo", eval: "math-basic", max_samples: 5 }
↓
Calls runEval(options)
```

### Step 2: Registry Loading
```
EvalRunner.runEval() starts
↓
registry.loadRegistry() reads registry/evals/*.yaml files
↓
Finds math-basic configuration:
{
  id: "math-basic.dev.v0",
  class: "BasicEval",
  args: { samples_jsonl: "math/basic.jsonl", match_type: "exact" }
}
```

### Step 3: Dataset Loading
```
loadDataset("registry/data/math/basic.jsonl")
↓
Reads file content:
{"input": [{"role": "user", "content": "What is 15 + 27?"}], "ideal": "42"}
{"input": [{"role": "user", "content": "Calculate 8 × 9"}], "ideal": "72"}
... (more samples)
↓
Validates each line and creates EvalSample objects
↓
Returns EvalDataset with array of samples
```

### Step 4: Client & Template Creation
```
createLLMClient("gpt-3.5-turbo") → OpenAIClient instance
↓
registry.createTemplate("math-basic", null) → BasicEval instance
```

### Step 5: Evaluation Loop with Caching, Token Tracking & Custom Metrics
```
For each sample (limited to 5 by --max-samples):
  Sample 1: "What is 15 + 27?"
  ↓
  🔍 EvaluationCache.getCachedResult() → Check cache first // NEW: Intelligent Caching
  ↓
  If cache HIT:
    💾 Return cached completion instantly (0 API calls, $0 cost, <1ms)
    Console: "💾 Cache hit for sample 1"
  
  If cache MISS:
    🌐 llmClient.complete() → sends to OpenAI API
    ↓
    OpenAI responds: 
    {
      content: "The answer is 42",
      usage: {                    // Automatic token tracking
        prompt_tokens: 12,
        completion_tokens: 4,
        total_tokens: 16
      }
    }
    ↓
    💾 EvaluationCache.setCachedResult() → Store for future use // NEW
    ↓
    💰 CostManager calculates cost: $0.0003 (16 tokens × $0.002/1K)
  
  ↓
  📊 template.evaluate() → Different templates handle this differently:
    • BasicEval: Exact match "The answer is 42" vs "42" → FAIL
    • SemanticSimilarityEval: Embedding similarity 0.95 → PASS
    • ModelGradedEval: Another AI judges the response → PASS
  ↓
  🎯 Result: { 
    score: 0.95, 
    passed: true, 
    reasoning: "Semantic similarity: 0.95",
    completion: { content: "The answer is 42", usage: {...} }
  }
  ↓
  📝 Logger records result + token usage + cost data + cache stats // ENHANCED
```

### Step 6: Enhanced Final Report with Token Analytics & Custom Metrics
```
After all samples, comprehensive analysis:

📊 Basic Metrics:
- Total samples: 5
- Correct: 4  
- Incorrect: 1
- Score: 0.8 (80%)

💰 Token Analytics: // ENHANCED
  • Total tokens: 127 (prompt: 78, completion: 49)
  • Average per sample: 25 tokens
  • Range: 18-34 tokens
  • Estimated cost: $0.0025
  • Cost per sample: $0.0005

💾 Cache Performance: // NEW
  • Requests: 5 (2 cache hits, 3 cache misses)
  • Hit rate: 40%
  • Tokens saved: 32 (from 2 cache hits)
  • Cost savings: $0.0006

📈 Custom Metrics Calculation: // NEW
  MetricsRegistry.calculateAllMetrics() →
  • CostEfficiencyMetric: accuracy/cost = 0.8/$0.0025 = 320.0
  • TokenEfficiencyMetric: avg tokens per correct answer = 127/4 = 31.75
  • ResponseConsistencyMetric: response similarity analysis = 0.87
  • BusinessImpactMetric: weighted scoring = 0.76

↓
Creates comprehensive EvalReport with:
- TokenUsage data
- CustomMetricResult[] array  // NEW
- Cache performance stats    // NEW
↓
Saves detailed logs with all analytics to file
```
↓
Enhanced CLI display with all new features: // UPDATED
==================================================
🎯 Final Results:
   Total samples: 5
   Correct: 4
   Incorrect: 1
   Accuracy: 80.00%
   Duration: 12.34s

📊 Token Usage:
   • Prompt tokens: 78
   • Completion tokens: 49  
   • Total tokens: 127
   • Avg tokens/sample: 25
   • Range: 18 - 34 tokens

💰 Estimated Cost:
   • Total: $0.0025
   • Prompt cost: $0.0016
   • Completion cost: $0.0009
   • Cost per sample: $0.0005

📈 Custom Metrics:                 // NEW SECTION
   ⚡ EFFICIENCY:
      ↗️ Cost Efficiency: 320.00
      ↙️ Token Efficiency: 31.8

   ✨ QUALITY:
      ↗️ Response Consistency: 0.870

   📊 BUSINESS:
      ↗️ Business Impact: 0.760

💾 Cache Performance:              // NEW SECTION
   • Requests: 5
   • Hits: 2
   • Hit rate: 40.0%
   • Est. tokens saved: 32
==================================================
```

---

## 🚀 How to Use the Framework

### 1. Running Existing Evaluations (Now with Token Tracking)

```bash
# List available evaluations
npx ts-node src/cli.ts list

# Run evaluations with automatic token tracking and cost analysis
npx ts-node src/cli.ts gpt-3.5-turbo math-basic --max-samples 10
npx ts-node src/cli.ts gpt-4 semantic-creative --max-samples 5
npx ts-node src/cli.ts ollama/llama2 semantic-local --max-samples 10  # Free tokens!

# Test configurations without API costs
npx ts-node src/cli.ts any-model math-basic --dry-run --verbose
npx ts-node src/cli.ts any-model semantic-qa --dry-run --verbose
```

### 2. Token Analytics & Cost Management (NEW)

```bash
# ========== TOKEN ANALYTICS ==========
# Generate comprehensive token usage report
npx ts-node src/cli.ts tokens report 30                    # Last 30 days

# Show token usage trends for specific evaluation  
npx ts-node src/cli.ts tokens trends math-basic 7          # Last 7 days

# Compare model efficiency (cost per correct answer)
npx ts-node src/cli.ts tokens efficiency gpt-3.5-turbo gpt-4 ollama/llama2
npx ts-node src/cli.ts tokens efficiency --eval math-basic --days 30

# ========== COST MANAGEMENT ========== 
# Cost breakdown by evaluation type
npx ts-node src/cli.ts costs breakdown 30                  # Last 30 days

# Predict costs for future evaluations (with confidence intervals)
npx ts-node src/cli.ts costs predict gpt-4 math-basic 100 --days 7

# Quick cost estimation without historical data
npx ts-node src/cli.ts costs estimate gpt-3.5-turbo 50 --input-length 500 --output-length 200

# Budget management with alerts
npx ts-node src/cli.ts costs budget math-basic 25.00       # Set $25 budget
npx ts-node src/cli.ts costs budget math-basic             # Check budget status

# ========== INTELLIGENT CACHING ========== (NEW)
# View cache performance and statistics
npx ts-node src/cli.ts cache stats                         # Hit rates, memory usage, savings

# Clear all cached evaluation results
npx ts-node src/cli.ts cache clear                         # Fresh start, no cache hits

# Invalidate cache for specific model (after model updates)
npx ts-node src/cli.ts cache invalidate gpt-3.5-turbo     # Clear cache for one model

# ========== CUSTOM METRICS FRAMEWORK ========== (NEW)
# List all available custom metrics with descriptions
npx ts-node src/cli.ts metrics list                        # See all built-in metrics

# Test custom metrics framework with sample data
npx ts-node src/cli.ts metrics test demo                   # Try metrics without API calls

# ========== INTERACTIVE DASHBOARD ==========
# Start comprehensive web analytics dashboard
npx ts-node src/cli.ts dashboard 3000                      # Visit http://localhost:3000
```

### 3. Example Output (Enhanced with Caching, Token Tracking & Custom Metrics)

```bash
🚀 Starting evaluation: math-basic with model: gpt-3.5-turbo
📊 Loading dataset from: registry/data/math/basic.jsonl
📝 Evaluating 10 samples
⏳ Progress: 10/10 (100%)

==================================================
🎯 Final Results:
   Total samples: 10
   Correct: 8
   Incorrect: 2  
   Accuracy: 80.00%
   Duration: 15.23s

📊 Token Usage:                    # NEW: Automatic token tracking
   • Prompt tokens: 1,250
   • Completion tokens: 890
   • Total tokens: 2,140
   • Avg tokens/sample: 214
   • Range: 189 - 245 tokens

💰 Estimated Cost:                 # NEW: Real-time cost calculation
   • Total: $0.0043
   • Prompt cost: $0.0025
   • Completion cost: $0.0018
   • Cost per sample: $0.0004
==================================================

📁 Detailed logs saved to: logs/20231201123456_gpt-3.5-turbo_math-basic.jsonl
🎯 Final Score: 80.0%
```

### 1.5. Using Production Features

#### **Basic Cost Tracking and Monitoring:**
```typescript
import { CostManager } from './src/cost-tracking/cost-manager';
import { EvaluationStore } from './src/database/evaluation-store';
import { EvaluationMonitor } from './src/monitoring/evaluation-monitor';

// Set up cost management
const costManager = new CostManager();
costManager.setBudget('safety_tests', 50.00); // $50 budget

// Set up database storage
const store = new EvaluationStore(); // Saves results to database

// Set up monitoring
const monitor = new EvaluationMonitor(store);

// Example: Check costs after evaluation
const report = await runner.runEval(options);
const costAlert = costManager.checkBudgetStatus('safety_tests');
if (costAlert) {
  console.log(`💰 ${costAlert.message}`);
}

// Check for performance alerts
const alerts = await monitor.checkAlerts(report);
if (alerts.length > 0) {
  alerts.forEach(alert => console.log(`🚨 ${alert.title}: ${alert.description}`));
}
```

#### **A/B Testing Models:**
```typescript
import { ModelComparison } from './src/ab-testing/model-comparisons';

const comparison = new ModelComparison('./registry');

const result = await comparison.runComparison({
  name: "GPT-4 vs Claude Safety Comparison",
  models: ['gpt-4', 'claude-3-sonnet'],
  evaluations: ['safety_comprehensive'],
  sample_size: 50,
  confidence_level: 0.95
});

console.log("\n📊 Statistical Analysis Results:");
result.recommendations.forEach(rec => console.log(rec));

// Example output:
// 🏆 Best performing model: gpt-4 (94.2% accuracy)
// ✅ gpt-4 is statistically significantly better than claude-3-sonnet
// 📊 Found 2 statistically significant performance differences
```

#### **Enhanced Web Dashboard with Token Analytics:**
```bash
# Start the comprehensive analytics dashboard
npx ts-node src/cli.ts dashboard 3000

# Visit http://localhost:3000 to see:
# 📈 Real-time token usage and cost analytics
# 🏆 Model efficiency rankings with cost per correct answer
# 💰 Budget monitoring with color-coded health indicators (🟢🟡🟠🔴)
# 💡 AI-powered optimization recommendations
# 📊 Interactive charts with period toggles (7d/30d/90d)
# 🔌 API explorer with live endpoint testing
# ⚡ Auto-refresh every 30 seconds
# 📱 Responsive design for mobile/desktop
```

**Dashboard API Examples:**
```bash
# Token analytics endpoints
curl http://localhost:3000/api/analytics/tokens?days=30
curl http://localhost:3000/api/analytics/tokens/trends?eval_name=math-basic&days=7
curl http://localhost:3000/api/analytics/tokens/efficiency?models=gpt-4,gpt-3.5-turbo

# Cost management endpoints  
curl http://localhost:3000/api/analytics/costs/breakdown?days=30
curl http://localhost:3000/api/analytics/costs/predict?model=gpt-4&eval_name=math-basic&sample_count=100

# Budget management
curl -X POST http://localhost:3000/api/budget/math-basic -H "Content-Type: application/json" -d '{"budget": 25.00}'
curl http://localhost:3000/api/budget/math-basic/status

# Main dashboard data
curl http://localhost:3000/api/dashboard?days=7
curl http://localhost:3000/api/health
```

#### **Automated Quality Gates:**
```typescript
import { EvaluationPipeline } from './src/automation/evaluation-pipeline';

const pipeline = new EvaluationPipeline('./registry', costManager, monitor);

const config = {
  name: "Safety Check Pipeline",
  evaluations: ['safety_comprehensive'],
  models: ['gpt-4'],
  quality_gates: [
    {
      name: "Minimum Safety Score",
      condition: { type: 'min_score', threshold: 0.95 }, // Must score ≥95%
      action: 'fail',
      required: true
    }
  ],
  notifications: []
};

const result = await pipeline.runPipeline(config);

console.log(`\n🏁 Pipeline Result: ${result.status.toUpperCase()}`);
console.log(`📋 Recommendation: ${result.deployment_recommendation}`);
console.log(`📝 Summary: ${result.summary}`);

// Example output:
// 🏁 Pipeline Result: SUCCESS
// 📋 Recommendation: approve
// 📝 Summary: Completed 1 evaluations with 96.5% average score. Quality gates: 1/1 passed. 0 alerts triggered.
```

### 4. Creating New Evaluations with Budget Planning

#### Step 1: Plan your budget and estimate costs
```bash
# Estimate costs before creating the full evaluation
npx ts-node src/cli.ts costs estimate gpt-3.5-turbo 100 --input-length 300 --output-length 150
# Output: Estimated cost: $0.0890 for 100 samples

# Set a budget for your new evaluation
npx ts-node src/cli.ts costs budget my-evaluation 10.00  # $10 budget
```

#### Step 2: Create the dataset
```bash
# Create: registry/data/my-topic/questions.jsonl
{"input": [{"role": "user", "content": "Your question here"}], "ideal": "Expected answer"}
{"input": [{"role": "user", "content": "Another question"}], "ideal": "Another answer"}
```

#### Step 3: Create the configuration
```yaml
# Create: registry/evals/my-eval.yaml
my-evaluation:
  id: my-evaluation.v1
  description: Description of what this tests (with cost considerations)
  metrics: [accuracy, cost_efficiency]  # NEW: Add cost tracking
  class: BasicEval  # BasicEval, ModelGradedEval, ChoiceBasedEval, or SemanticSimilarityEval
  args:
    samples_jsonl: my-topic/questions.jsonl
    match_type: exact
```

#### Step 4: Run with monitoring
```bash
# Run with budget monitoring
npx ts-node src/cli.ts gpt-3.5-turbo my-evaluation --max-samples 5

# Check budget status
npx ts-node src/cli.ts costs budget my-evaluation

# Monitor token trends
npx ts-node src/cli.ts tokens trends my-evaluation 7
```

### 5. Understanding Enhanced Results with Token Analytics

#### Enhanced Console Output
```
🚀 Starting evaluation: math-basic with model: gpt-3.5-turbo
📊 Loading dataset from: registry/data/math/basic.jsonl
📝 Evaluating 10 samples
⏳ Progress: 10/10 (100%)

==================================================
🎯 Final Results:
   Total samples: 10
   Correct: 8
   Incorrect: 2
   Accuracy: 80.00%
   Duration: 15.23s

📊 Token Usage:                    # NEW: Comprehensive token tracking
   • Prompt tokens: 1,250
   • Completion tokens: 890
   • Total tokens: 2,140
   • Avg tokens/sample: 214
   • Range: 189 - 245 tokens

💰 Estimated Cost:                 # NEW: Real-time cost calculation
   • Total: $0.0043
   • Prompt cost: $0.0025
   • Completion cost: $0.0018
   • Cost per sample: $0.0004
==================================================

📁 Detailed logs saved to: logs/20231201123456ABC_gpt-3.5-turbo_math-basic.jsonl
🎯 Final Score: 80.0%
```

#### Enhanced Log File Analysis with Token Data
```json
// Each line now includes comprehensive token and cost information
{"run_id": "123", "type": "sampling", "data": {"input": [...], "completion": {"content": "...", "usage": {"prompt_tokens": 24, "completion_tokens": 8, "total_tokens": 32}}, "estimated_cost": 0.000064}}
{"run_id": "123", "type": "metrics", "data": {"score": 1.0, "passed": true, "token_efficiency": 0.00008}}
{"run_id": "123", "type": "final_report", "data": {"accuracy": 0.8, "token_usage": {"total_tokens": 2140, "estimated_cost": 0.0043}}}
```

#### Advanced Analytics Commands
```bash
# Analyze your evaluation's performance
npx ts-node src/cli.ts tokens report 30    # Generate comprehensive report
# Output: Shows model rankings, cost trends, recommendations

npx ts-node src/cli.ts tokens trends math-basic 7    # Track trends over time
# Output: Daily token usage, cost changes, performance correlation

npx ts-node src/cli.ts tokens efficiency gpt-4 gpt-3.5-turbo ollama/llama2    # Compare models
# Output: Efficiency ranking, ROI analysis, recommendations
```

---

## 🔧 How to Add New Features

### Adding Support for a New AI Model

#### Step 1: Create the client class
```typescript
// In src/llm-client.ts
export class MyNewAIClient implements LLMClient {
  private model: string;
  private apiClient: SomeAPIClient; // Your AI provider's client
  
  constructor(model: string, apiKey?: string) {
    this.model = model;
    this.apiClient = new SomeAPIClient({ apiKey });
  }
  
  async complete(messages: ChatMessage[]): Promise<CompletionResult> {
    // Convert our format to the API's format
    const apiMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Call the API
    const response = await this.apiClient.createCompletion({
      model: this.model,
      messages: apiMessages
    });
    
    // Convert response back to our format
    return {
      content: response.choices[0].message.content,
      model: this.model
    };
  }
  
  getModel(): string {
    return this.model;
  }
}
```

#### Step 2: Update the factory function
```typescript
// In src/llm-client.ts
export function createLLMClient(model: string): LLMClient {
  if (model.startsWith('gpt-') || model.startsWith('o1-')) {
    return new OpenAIClient(model);
  }
  if (model.startsWith('my-ai-')) {  // Add this
    return new MyNewAIClient(model);
  }
  // ... existing code
}
```

#### Step 3: Use it
```bash
npx ts-node src/cli.ts my-ai-model-v1 math-basic --max-samples 10
```

### Adding a New Evaluation Template

#### Step 1: Create the template class
```typescript
// In src/templates/my-new-template.ts
export class MyNewTemplate implements EvalTemplate {
  name = 'my-new';
  
  constructor(private args: MyNewTemplateArgs) {}
  
  async evaluate(sample: EvalSample, completion: CompletionResult): Promise<EvalResult> {
    // Your custom grading logic here
    const score = this.calculateScore(sample, completion);
    
    return {
      sample_id: this.generateId(sample),
      input: sample.input,
      ideal: sample.ideal,
      completion,
      score: score,
      passed: score >= 0.5,
      reasoning: `My custom grading gave score ${score}`
    };
  }
  
  private calculateScore(sample: EvalSample, completion: CompletionResult): number {
    // Your scoring logic here
    return 0.5; // Placeholder
  }
}
```

#### Step 2: Register it in the registry
```typescript
// In src/registry.ts, add to createTemplate method:
case 'MyNewTemplate':
  return new MyNewTemplate(config.args as MyNewTemplateArgs);
```

#### Step 3: Use it in configuration
```yaml
# In registry/evals/my-eval.yaml
my-evaluation:
  class: MyNewTemplate
  args:
    # Your template's specific arguments
```

### Extending Production Features

#### Adding Custom Alert Rules

```typescript
// Create custom monitoring logic
import { EvaluationMonitor, AlertRule } from './src/monitoring/evaluation-monitor';

const monitor = new EvaluationMonitor(store);

// Custom alert for specific model performance
monitor.addRule({
  id: 'custom_model_check',
  name: 'Custom Model Performance Alert',
  condition: {
    type: 'score_drop',
    threshold: 0.03, // 3% drop
    models: ['my-custom-model'], // Only monitor specific models
    evaluations: ['my-custom-eval']
  },
  actions: [
    { 
      type: 'webhook', 
      config: { 
        url: 'https://my-company.com/api/alerts',
        headers: { 'Authorization': 'Bearer my-token' }
      } 
    }
  ],
  enabled: true,
  cooldown_minutes: 15
});
```

#### Adding New Cost Providers

```typescript
// Extend cost tracking for new AI providers
import { CostManager, CostConfig } from './src/cost-tracking/cost-manager';

const costManager = new CostManager();

// Add pricing for new provider
costManager.addCostConfig({
  provider: 'my-ai-provider',
  model: 'my-ai-model-v1',
  input_cost_per_1k_tokens: 0.002,
  output_cost_per_1k_tokens: 0.004
});

// Now cost tracking works for your custom models
const cost = costManager.calculateCompletionCost('my-ai-model-v1', completion);
```

#### Custom Pipeline Quality Gates

```typescript
// Create custom quality gates
import { EvaluationPipeline, QualityGate } from './src/automation/evaluation-pipeline';

const customQualityGates: QualityGate[] = [
  {
    name: "Custom Business Logic Check",
    condition: {
      type: 'custom', // You can extend this
      threshold: 0.9,
      // Custom logic would be implemented in pipeline
    },
    action: 'fail',
    required: true
  },
  {
    name: "Model Consistency Check",
    condition: {
      type: 'max_regression', // Compare against previous version
      threshold: 0.05, // Max 5% regression allowed
      evaluations: ['safety', 'accuracy']
    },
    action: 'warn',
    required: false
  }
];
```

#### Dashboard Custom Widgets

```typescript
// Extend dashboard with custom analytics
import { DashboardServer } from './src/dashboard/dashboard-server';

class CustomDashboard extends DashboardServer {
  protected setupRoutes() {
    super.setupRoutes(); // Keep existing routes
    
    // Add custom endpoint
    this.app.get('/api/custom-metrics', async (req: any, res: any) => {
      const customMetrics = await this.calculateCustomMetrics();
      res.json(customMetrics);
    });
    
    // Custom business logic analysis
    this.app.get('/api/business-impact/:eval', async (req: any, res: any) => {
      const businessImpact = await this.analyzeBusinessImpact(req.params.eval);
      res.json(businessImpact);
    });
  }
  
  private async calculateCustomMetrics() {
    // Your custom analytics logic
    return {
      roi_metrics: {},
      user_satisfaction_correlation: {},
      cost_efficiency_trends: {}
    };
  }
}
```

---

## 📚 Common TypeScript Patterns Explained

### Interfaces vs Classes

```typescript
// Interface: Defines the shape/contract
interface LLMClient {
  complete(messages: ChatMessage[]): Promise<CompletionResult>;
  getModel(): string;
}

// Class: Actual implementation  
class OpenAIClient implements LLMClient {
  complete(messages: ChatMessage[]): Promise<CompletionResult> {
    // Actual code that does the work
  }
  getModel(): string {
    return this.model;
  }
}
```

**Why use interfaces?** They let us swap implementations. We can have `OpenAIClient`, `ClaudeClient`, etc., all implementing the same `LLMClient` interface.

### Async/Await

```typescript
// Old way (callbacks):
function oldWay() {
  apiCall(data, function(result) {
    processResult(result, function(processed) {
      saveResult(processed, function(saved) {
        console.log('Done!');
      });
    });
  });
}

// New way (async/await):
async function newWay() {
  const result = await apiCall(data);
  const processed = await processResult(result);
  const saved = await saveResult(processed);
  console.log('Done!');
}
```

**Why async/await?** Makes code that deals with API calls and file operations much easier to read and debug.

### Generic Types

```typescript
// Generic means "works with any type"
interface ApiResponse<T> {
  data: T;
  status: number;
}

// Usage:
const userResponse: ApiResponse<User> = await getUser(123);
const postsResponse: ApiResponse<Post[]> = await getPosts();
```

**Why generics?** Lets us reuse code for different data types while keeping type safety.

### Optional Properties

```typescript
interface Config {
  required: string;    // Must be provided
  optional?: string;   // May or may not be provided
}

// Both valid:
const config1: Config = { required: "value" };
const config2: Config = { required: "value", optional: "also value" };
```

**The `?` means optional** - the property might not be there.

### Union Types

```typescript
// Can be one of several types
type Status = 'pending' | 'completed' | 'failed';
type StringOrNumber = string | number;

function handleStatus(status: Status) {
  // TypeScript knows status can only be one of those 3 values
}
```

**Why union types?** Restricts values to only valid options, preventing bugs.

---

## 🎯 Summary

This framework is a **comprehensive AI quality assurance platform** that scales from basic evaluation to enterprise-grade production monitoring. Here's how all the pieces work together:

### **Core Framework:**
1. **You define tests** in YAML files (what to test)
2. **You create questions** in JSONL files (the actual test questions)  
3. **The framework runs the tests** by:
   - Loading your test configuration
   - Asking the AI your questions
   - **Automatically tracking tokens and costs** in real-time
   - Grading the AI's answers
   - **Providing comprehensive analytics** with performance, cost, and efficiency metrics

### **Production Features:**
4. **Advanced Token Analytics** - Comprehensive usage analysis, efficiency comparison, and predictive modeling
5. **Enhanced Database Storage** - All results saved with token usage history for trend analysis
6. **Smart Cost Management** - Real-time budget tracking, cost prediction, optimization recommendations
7. **Statistical A/B Testing** - Model comparisons with cost-efficiency analysis and confidence intervals
8. **Intelligent Monitoring & Alerts** - Performance regression detection with cost overrun protection
9. **Interactive Web Dashboard** - Real-time analytics with token visualization and budget monitoring
10. **Automated Pipelines** - CI/CD integration with quality gates and budget controls

### **Extensibility:**
11. **You can extend it** by adding:
    - New AI models with automatic token tracking (implement `LLMClient`)
    - New grading methods with cost analysis (implement `EvalTemplate`)
    - Custom token analytics and efficiency metrics (extend `TokenAnalyticsService`)
    - New cost providers and pricing models (extend cost tracking)
    - Custom alert rules with budget thresholds (extend monitoring)
    - Advanced dashboard widgets and visualizations (extend analytics)
    - Custom quality gates with cost constraints (extend pipelines)

### **Framework Evolution:**

**Basic Usage (Now with Token Tracking):**
```bash
# Simple evaluation with automatic cost analysis
npx ts-node src/cli.ts gpt-4 safety --max-samples 10
# Result: 85% accuracy ✅
#         Used 2,340 tokens ($0.0234) 💰
#         Efficiency: $0.00275/correct answer 📊
```

**Advanced Analytics Usage:**
```bash
# Comprehensive cost and efficiency analysis
npx ts-node src/cli.ts tokens efficiency gpt-4 gpt-3.5-turbo ollama/llama2 --eval safety
# Result: 🥇 ollama/llama2 (free), 🥈 gpt-3.5-turbo ($0.002/sample), 🥉 gpt-4 ($0.012/sample)
#         Recommendation: Use ollama/llama2 for development, gpt-4 for production

npx ts-node src/cli.ts costs predict gpt-4 safety 1000 --days 7  
# Result: Estimated cost: $23.45 ± $4.21 (95% confidence)
#         Budget recommendation: Set $30 monthly limit
```

**Production Usage (Enhanced):**
```typescript
// Comprehensive production pipeline with cost controls
const result = await pipeline.runPipeline(config);
// Automatically: Tests multiple models, analyzes token efficiency,
// checks quality gates, monitors budgets, detects cost anomalies,
// provides optimization recommendations, posts alerts to Slack,
// updates GitHub status, saves analytics to database 🚀💰
```

### **Key Benefits:**

- **🔰 Beginner-Friendly**: Start with simple evaluations, automatic token tracking and caching included
- **💾 Cost-Optimized**: Intelligent caching reduces API costs by up to 80% automatically
- **📊 Data-Driven**: Statistical analysis with confidence intervals, cost-efficiency metrics, and custom business metrics
- **💰 Cost-Intelligent**: Real-time budget tracking, cost prediction, and optimization recommendations  
- **🚨 Proactive**: Alerts for performance regressions AND budget overruns
- **🔄 Automated**: CI/CD integration with quality gates and budget controls
- **📈 Comprehensive Analytics**: Built-in custom metrics for efficiency, quality, and business impact
- **🏆 Efficiency-Focused**: Model comparisons based on cost per correct answer and custom KPIs
- **💡 AI-Powered**: Automated recommendations for cost optimization and model selection
- **⚡ Performance-Enhanced**: Caching system provides 10x speed improvements for repeated evaluations

The system is designed to be **modular and extensible** - each piece does one job well, and they all work together through well-defined interfaces. This makes it easy to understand, debug, and extend.

### **Getting Started Journey:**

1. **🎯 Start Simple**: Run existing evaluations with automatic token tracking
   ```bash
   npx ts-node src/cli.ts gpt-3.5-turbo math-basic --max-samples 5
   ```

2. **💰 Set Budgets**: Establish cost controls and monitoring
   ```bash
   npx ts-node src/cli.ts costs budget math-basic 10.00
   ```

3. **📊 Analyze Efficiency**: Compare models by cost and performance
   ```bash
   npx ts-node src/cli.ts tokens efficiency gpt-4 gpt-3.5-turbo ollama/llama2
   ```

4. **🌐 Launch Dashboard**: Start interactive analytics dashboard
   ```bash
   npx ts-node src/cli.ts dashboard 3000
   ```

5. **⚔️ A/B Testing**: Use statistical comparisons with cost analysis for evidence-based decisions

6. **🚀 Production**: Deploy automated pipelines with quality gates and budget controls

7. **📈 Advanced Analytics**: Custom cost models, predictive analysis, and ROI optimization

**Remember:** You don't need to understand every detail to use it effectively. The framework grows with your needs - start basic and add production features as your AI systems become more critical to your business!
