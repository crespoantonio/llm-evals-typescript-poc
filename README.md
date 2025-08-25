# 🧠 LLM Evaluation Framework (TypeScript)

A **production-ready AI quality assurance platform** for evaluating Large Language Models (LLMs). Built with TypeScript and inspired by OpenAI's Evals framework, this comprehensive system scales from simple CLI evaluations to enterprise-grade AI monitoring and quality gates.

## 🌟 Features

### **Core Evaluation Engine**
- 🎯 **Multiple Evaluation Types**: Basic deterministic matching, model-graded evaluations, structured choice-based grading, and semantic similarity evaluation
- 🔧 **Multi-Provider LLM Support**: Built-in support for OpenAI, Ollama (local models), HuggingFace (100,000+ community models), extensible for Anthropic and custom providers
- ⚙️ **YAML Configuration**: Declarative evaluation definitions with flexible templating
- 🚀 **CLI Interface**: Powerful command-line tool with dry-run, verbose logging, and batch processing

### **Production & Enterprise Features** 
- 📊 **Analytics Dashboard**: Web-based dashboard with performance trends, model comparisons, and interactive charts
- 🗄️ **Historical Database**: SQLite storage for long-term performance tracking and regression analysis  
- ⚔️ **A/B Testing**: Statistical model comparison with confidence intervals, t-tests, and effect sizes
- 💰 **Cost Management**: Real-time budget tracking, cost forecasting, and provider-specific pricing
- 🚨 **Monitoring & Alerts**: Automated performance regression detection with Slack/email notifications
- 🔄 **CI/CD Integration**: Quality gates, automated pipelines, and GitHub status checks

## 🚀 Installation

### Basic Setup
```bash
# Clone the repository
git clone https://github.com/crespoantonio/llm-evals-typescript-poc
cd llm-evals-typescript-poc

# Install dependencies
npm install

# Build the project
npm run build
```

### API Keys Setup
```bash
# Copy environment template
cp env.example .env

# Edit .env with your API keys:
# OPENAI_API_KEY=sk-your-openai-key-here                    # For OpenAI models
# HUGGINGFACE_API_KEY=hf_your-huggingface-token-here        # For HF models (optional)
# ANTHROPIC_API_KEY=your-anthropic-key-here                 # For Claude models (optional)
```

### Local Models Setup (Optional)
```bash
# For Ollama local models:
# 1. Install Ollama from https://ollama.ai
# 2. Pull a model: ollama pull llama2
# 3. Start server: ollama serve
# 4. Use: npx ts-node src/cli.ts ollama/llama2 math-basic
```

### Production Features (Optional)
```bash
# For database storage and historical tracking
npm install sqlite3 @types/sqlite3

# For web dashboard and analytics
npm install express @types/express

# For enhanced statistical analysis
npm install simple-statistics
```

**Note:** All production features work without additional dependencies using graceful fallbacks (in-memory storage, mock implementations).

## ⚡ Quick Start

### Basic Evaluation
```bash
# 1. Initialize registry with sample configurations
npx ts-node src/cli.ts init

# 2. Set your OpenAI API key
export OPENAI_API_KEY="your-api-key-here"

# 3. List available evaluations
npx ts-node src/cli.ts list

# 4. Run your first evaluation
npx ts-node src/cli.ts gpt-3.5-turbo math-basic --max-samples 5

# Output:
# 🧠 LLM Evaluation Framework
# 📊 Loading dataset from: registry/data/math/basic.jsonl
# ⏳ Progress: 5/5 (100%)
# 🎯 Final Score: 80.0%

# 5. Try different model providers
npx ts-node src/cli.ts ollama/llama2 math-basic --max-samples 3          # Local models (free)
npx ts-node src/cli.ts hf/google/flan-t5-large math-basic --max-samples 3 # HuggingFace models
npx ts-node src/cli.ts gpt-4 math-basic --max-samples 3                  # OpenAI models
```

### Production Features Quick Start

#### **Cost Tracking & Monitoring**
```typescript
import { CostManager, EvaluationMonitor, EvaluationStore } from './src';

const costManager = new CostManager();
const store = new EvaluationStore();
const monitor = new EvaluationMonitor(store);

// Set budget limit
costManager.setBudget('safety_tests', 50.00);

// Run evaluation with cost tracking
const report = await runner.runEval(options);
const alerts = await monitor.checkAlerts(report);

console.log(`Cost: $${costManager.trackEvaluationCost('safety', 'gpt-4', []).total_cost}`);
```

#### **A/B Testing Models**
```typescript
import { ModelComparison } from './src/ab-testing/model-comparisons';

const comparison = new ModelComparison('./registry');
const result = await comparison.runComparison({
  name: "GPT-4 vs Claude Safety Test",
  models: ['gpt-4', 'claude-3-sonnet'],
  evaluations: ['safety'],
  sample_size: 50,
  confidence_level: 0.95
});

console.log(result.recommendations);
// ["🏆 Best performing model: gpt-4 (94.2% accuracy)"]
```

#### **Web Dashboard**
```typescript
import { DashboardServer } from './src/dashboard/dashboard-server';

const dashboard = new DashboardServer();
dashboard.start(3000);
// 🌐 Dashboard available at http://localhost:3000
```

#### **Automated Quality Gates**
```typescript
import { EvaluationPipeline } from './src/automation/evaluation-pipeline';

const pipeline = new EvaluationPipeline('./registry', costManager, monitor);
const result = await pipeline.runPipeline({
  name: "Production Safety Gate",
  evaluations: ['safety'],
  models: ['gpt-4'],
  quality_gates: [{
    name: "Safety Minimum",
    condition: { type: 'min_score', threshold: 0.95 },
    action: 'fail',
    required: true
  }]
});

console.log(`Deployment: ${result.deployment_recommendation}`); // "approve" or "reject"
```

## 🏗️ Framework Components

### **Core Evaluation Engine**

#### **Evaluation Types**
```yaml
# Basic Evaluations - Deterministic matching
math-basic:
  class: BasicEval
  args:
    samples_jsonl: math/basic.jsonl
    match_type: exact        # exact, includes, fuzzy, regex

# Model-Graded Evaluations - AI-powered scoring  
sql-graded:
  class: ModelGradedEval
  args:
    samples_jsonl: sql/complex.jsonl
    grading_model: gpt-4
    eval_type: cot_classify  # classify or cot_classify

# Choice-Based Evaluations - Structured grading with predefined options
sql-choice:
  class: ChoiceBasedEval
  args:
    samples_jsonl: sql/basic.jsonl
    choice_strings: ["Correct", "Incorrect"]
    choice_scores: {"Correct": 1.0, "Incorrect": 0.0}
    grading_model: gpt-4

# Semantic Similarity Evaluations - Meaning-based evaluation using embeddings
semantic-qa:
  class: SemanticSimilarityEval
  args:
    samples_jsonl: semantic/qa.jsonl
    threshold: 0.8                    # Similarity threshold (0.0-1.0)
    embeddings_provider: openai       # openai or local
    match_mode: best                  # best, threshold, or all
```

### **Production & Enterprise Features**

#### **Analytics & Monitoring**
- **📊 Dashboard Server**: Real-time web interface with performance trends
- **🗄️ Database Storage**: Historical tracking with SQLite (auto-fallback to memory)
- **🚨 Alert System**: Configurable performance regression detection
- **📈 Trend Analysis**: Long-term performance tracking and baseline comparisons

#### **Cost Management**
- **💰 Budget Tracking**: Per-evaluation budget limits with automatic alerts
- **📊 Cost Forecasting**: Estimate evaluation costs before running
- **🏷️ Provider Pricing**: Built-in pricing for OpenAI, Anthropic, and extensible for custom providers
- **💳 Real-time Monitoring**: Track spending as evaluations run

#### **Statistical Analysis**
- **⚔️ A/B Testing**: Compare multiple models with statistical significance testing
- **📊 Confidence Intervals**: Quantify uncertainty in performance differences
- **📈 Effect Sizes**: Measure practical significance of performance differences
- **🧮 Statistical Methods**: t-tests, Cohen's d, and customizable analysis

#### **DevOps Integration**
- **🔄 Automated Pipelines**: CI/CD integration with quality gates
- **✅ Quality Gates**: Configurable pass/fail criteria for deployments
- **🔗 GitHub Integration**: Status checks and PR comments
- **📱 Notifications**: Slack, email, webhook alerts

### 2. Dataset Format

Datasets are stored as JSONL files with the following structure:

```json
{
  "input": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What is 2 + 2?"}
  ],
  "ideal": "4",
  "metadata": {"difficulty": "easy"}
}
```

Multiple ideal answers are supported:
```json
{
  "input": [...],
  "ideal": ["4", "four", "Four"]
}
```

### 3. Registry Structure

```
registry/
├── evals/
│   ├── math.yaml       # Math evaluations
│   ├── sql.yaml        # SQL evaluations
│   └── custom.yaml     # Your custom evaluations
└── data/
    ├── math/
    │   ├── basic.jsonl
    │   └── word_problems.jsonl
    └── sql/
        ├── basic.jsonl
        └── complex.jsonl
```

## 💻 CLI Usage

### **Basic Commands**

```bash
# Run evaluation  
npx ts-node src/cli.ts <model> <eval> [options]

# List available evaluations
npx ts-node src/cli.ts list

# Initialize new registry with examples
npx ts-node src/cli.ts init [path]
```

### **Supported Model Providers**

The framework automatically detects the provider based on the model name:

```bash
# OpenAI Models (requires OPENAI_API_KEY)
npx ts-node src/cli.ts gpt-3.5-turbo math-basic
npx ts-node src/cli.ts gpt-4 sql-graded
npx ts-node src/cli.ts o1-preview math-basic

# Ollama Local Models (requires Ollama server: ollama serve)  
npx ts-node src/cli.ts ollama/llama2 math-basic
npx ts-node src/cli.ts ollama/codellama sql-basic
npx ts-node src/cli.ts ollama/mistral toxicity

# HuggingFace Models (optional HUGGINGFACE_API_KEY for better performance)
npx ts-node src/cli.ts hf/google/flan-t5-large math-basic
npx ts-node src/cli.ts hf/microsoft/DialoGPT-large toxicity
npx ts-node src/cli.ts hf/codellama/CodeLlama-7b-Instruct-hf sql-basic
npx ts-node src/cli.ts hf/distilgpt2 math-basic  # Lightweight for testing
```

### **CLI Options**

- `--max-samples, -m`: Limit number of samples to evaluate
- `--verbose, -v`: Show detailed progress and results
- `--dry-run`: Test configuration without API calls (free)
- `--log-to-file, -l`: Save detailed logs to specified file  
- `--temperature, -t`: Model temperature (default: 0.0)
- `--max-tokens`: Maximum tokens in completion
- `--seed`: Random seed for reproducibility

### **Examples**

```bash
# Basic evaluation with different providers
npx ts-node src/cli.ts gpt-3.5-turbo math-basic --max-samples 10          # OpenAI
npx ts-node src/cli.ts ollama/llama2 math-basic --max-samples 10           # Local Ollama
npx ts-node src/cli.ts hf/google/flan-t5-large math-basic --max-samples 10 # HuggingFace

# Advanced evaluation with full logging
npx ts-node src/cli.ts gpt-4 safety-comprehensive \
  --max-samples 50 \
  --verbose \
  --log-to-file safety-results.jsonl

# Test configuration without API costs (works with any provider)
npx ts-node src/cli.ts ollama/llama2 sql-choice-based --dry-run --verbose
npx ts-node src/cli.ts hf/distilgpt2 math-basic --dry-run --verbose

# Compare multiple models across providers (A/B testing)
npx ts-node src/cli.ts gpt-4 safety --max-samples 100 --log-to-file gpt4-safety.jsonl
npx ts-node src/cli.ts ollama/llama2 safety --max-samples 100 --log-to-file llama2-safety.jsonl
npx ts-node src/cli.ts hf/google/flan-t5-large safety --max-samples 100 --log-to-file flan-t5-safety.jsonl

# Run toxicity evaluation with different grading models
npx ts-node src/cli.ts gpt-4 toxicity --max-samples 25 --verbose
npx ts-node src/cli.ts hf/microsoft/DialoGPT-large toxicity --max-samples 25 --verbose

# Run semantic similarity evaluations (meaning-based)
npx ts-node src/cli.ts gpt-3.5-turbo semantic-basic --max-samples 10 --verbose
npx ts-node src/cli.ts gpt-4 semantic-qa --max-samples 15
npx ts-node src/cli.ts ollama/llama2 semantic-local --max-samples 5  # Free, local embeddings
```

## 🔧 Programmatic Usage

### **Basic Evaluation**

```typescript
import { EvalRunner, Registry, createSampleDataset } from './src';

// Create evaluation runner
const runner = new EvalRunner('./registry');

// Run evaluation
const report = await runner.runEval({
  model: 'gpt-3.5-turbo',
  eval: 'math-basic',
  max_samples: 10,
  temperature: 0.0,
});

console.log(`Accuracy: ${(report.score * 100).toFixed(1)}%`);
```

### **Production Features Integration**

```typescript
import { 
  EvalRunner, CostManager, EvaluationStore, EvaluationMonitor,
  ModelComparison, EvaluationPipeline, DashboardServer
} from './src';

// Set up production components
const store = new EvaluationStore('./data/evaluations.db');
const costManager = new CostManager();
const monitor = new EvaluationMonitor(store);
const runner = new EvalRunner('./registry');

// Configure budget limits
costManager.setBudget('safety_evaluations', 100.00);
costManager.setBudget('performance_tests', 50.00);

// Set up monitoring rules
monitor.addRule({
  id: 'safety_regression',
  name: 'Safety Performance Drop',
  condition: {
    type: 'score_drop',
    threshold: 0.05, // 5% drop triggers alert
    evaluations: ['safety_comprehensive']
  },
  actions: [
    { type: 'log', config: { level: 'warning' } },
    { type: 'slack', config: { channel: '#ai-alerts' } }
  ],
  enabled: true,
  cooldown_minutes: 30
});

// Run evaluation with full production features
async function runProductionEvaluation() {
  // Run the evaluation
  const report = await runner.runEval({
    model: 'gpt-4',
    eval: 'safety_comprehensive',
    max_samples: 50
  });

  // Save to database for historical tracking
  await store.saveEvaluation(report, 2.45); // $2.45 cost

  // Check for alerts
  const alerts = await monitor.checkAlerts(report);
  if (alerts.length > 0) {
    console.log(`🚨 ${alerts.length} alerts triggered`);
    alerts.forEach(alert => console.log(alert.description));
  }

  // Check budget status
  const budgetAlert = costManager.checkBudgetStatus('safety_evaluations');
  if (budgetAlert) {
    console.log(`💰 ${budgetAlert.message}`);
  }

  return report;
}
```

### **A/B Testing & Model Comparison**

```typescript
import { ModelComparison } from './src/ab-testing/model-comparisons';

async function compareModels() {
  const comparison = new ModelComparison('./registry');
  
  const result = await comparison.runComparison({
    name: "Safety Model Comparison",
    models: ['gpt-4', 'claude-3-opus', 'gpt-3.5-turbo'],
    evaluations: ['safety_comprehensive', 'bias_detection'],
    sample_size: 100,
    confidence_level: 0.95,
    statistical_test: 'ttest'
  });

  // Print statistical results
  console.log("\n📊 Statistical Analysis:");
  result.recommendations.forEach(rec => console.log(rec));

  // Access detailed statistics
  const stats = result.statistical_analysis;
  console.log(`\n🏆 Overall Rankings:`);
  stats.overall_ranking.forEach((model, index) => {
    console.log(`${index + 1}. ${model.model}: ${(model.avg_score * 100).toFixed(1)}% ` +
                `(CI: ${model.confidence_interval.map(ci => (ci * 100).toFixed(1)).join('-')}%)`);
  });

  return result;
}
```

### **Automated Quality Gates & Pipelines**

```typescript
import { EvaluationPipeline } from './src/automation/evaluation-pipeline';

async function runDeploymentPipeline() {
  const pipeline = new EvaluationPipeline('./registry', costManager, monitor);

  const config = {
    name: "Production Deployment Gate",
    evaluations: ['safety_comprehensive', 'helpfulness', 'factual_accuracy'],
    models: ['gpt-4'],
    parallel_execution: true,
    quality_gates: [
      {
        name: "Safety Minimum",
        condition: { type: 'min_score', threshold: 0.95 },
        action: 'fail',
        required: true
      },
      {
        name: "Cost Control",
        condition: { type: 'max_cost', threshold: 25.00 },
        action: 'warn',
        required: false
      },
      {
        name: "Performance Baseline",
        condition: { type: 'max_regression', threshold: 0.03 },
        action: 'fail',
        required: true
      }
    ],
    notifications: [
      { type: 'github_status', trigger_on: ['success', 'failure'] },
      { type: 'slack', config: { channel: '#deployments' }, trigger_on: ['failure'] }
    ]
  };

  const result = await pipeline.runPipeline(config);
  
  console.log(`\n🏁 Pipeline Result: ${result.status.toUpperCase()}`);
  console.log(`📋 Deployment Recommendation: ${result.deployment_recommendation}`);
  console.log(`📊 Quality Gates: ${result.quality_gate_results.filter(g => g.status === 'passed').length}/${result.quality_gate_results.length} passed`);
  
  return result;
}
```

### **Dashboard & Analytics Server**

```typescript
import { DashboardServer } from './src/dashboard/dashboard-server';

// Start analytics dashboard
const dashboard = new DashboardServer(store);
dashboard.start(3000);

console.log('🌐 Analytics Dashboard: http://localhost:3000');
console.log('📊 Available endpoints:');
console.log('  GET /api/trends/safety - Performance trends');
console.log('  GET /api/compare?models=gpt-4,claude-3 - Model comparison');
console.log('  GET /api/failures/run_123 - Failure analysis');
```

### **Built-in Model Support**

The framework includes native support for multiple LLM providers:

```typescript
// Built-in providers work automatically
import { createLLMClient } from './src/llm-client';

// OpenAI models (cloud-based, paid)
const openaiClient = createLLMClient('gpt-4');
const gpt35Client = createLLMClient('gpt-3.5-turbo');

// Ollama models (local, free)
const llamaClient = createLLMClient('ollama/llama2');
const codelamaClient = createLLMClient('ollama/codellama');

// HuggingFace models (community, free tier available)
const flanClient = createLLMClient('hf/google/flan-t5-large');
const dialogClient = createLLMClient('hf/microsoft/DialoGPT-large');
```

### **Custom LLM Clients**

You can easily add support for additional providers:

```typescript
import { LLMClient, ChatMessage, CompletionResult } from './src';

class AnthropicClient implements LLMClient {
  constructor(private model: string, private apiKey: string) {}

  async complete(messages: ChatMessage[]): Promise<CompletionResult> {
    // Anthropic API integration
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    return {
      content: data.content[0].text,
      model: this.model,
      usage: {
        prompt_tokens: data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
        total_tokens: data.usage.input_tokens + data.usage.output_tokens
      }
    };
  }

  getModel(): string {
    return this.model;
  }
}

// Register custom client in createLLMClient function
export function createLLMClient(model: string): LLMClient {
  if (model.startsWith('claude-')) {
    return new AnthropicClient(model, process.env.ANTHROPIC_API_KEY!);
  }
  // ... existing providers (OpenAI, Ollama, HuggingFace)
}
```

## Log Analysis

Evaluation logs are saved in JSONL format with detailed information:

```json
{
  "run_id": "20231201123456ABC123",
  "event_id": 1,
  "sample_id": "sample_0",
  "type": "sampling",
  "data": {
    "input": [...],
    "completion": "Model response",
    "usage": {"total_tokens": 25}
  },
  "created_at": "2023-12-01T12:34:56.789Z"
}
```

## 📋 Example Evaluations

The framework includes comprehensive example evaluations across different domains:

### **Mathematics**
- **math-basic**: Simple arithmetic with exact matching (`BasicEval`)
- **math-word-problems**: Complex word problems with model grading (`ModelGradedEval`)

### **SQL & Code Generation**
- **sql-basic**: Basic SQL queries with fuzzy matching (`BasicEval`)
- **sql-graded**: Complex SQL with semantic evaluation (`ModelGradedEval`)
- **sql-choice-based**: Structured SQL grading with predefined choices (`ChoiceBasedEval`)

### **AI Safety & Ethics**
- **toxicity**: Toxicity detection using model-as-a-judge (`ModelGradedEval`)
- **toxicity-advanced**: Advanced toxicity detection with nuanced scoring
- **bias_detection**: Bias evaluation across multiple categories
- **safety_comprehensive**: Comprehensive safety evaluation suite

### **Performance Benchmarks**
- **helpfulness**: Evaluate response helpfulness and relevance
- **factual_accuracy**: Fact-checking and accuracy assessment
- **creative_writing**: Creative tasks like poetry and storytelling

### **Custom Templates**
All evaluations demonstrate different evaluation patterns:
- **Deterministic matching**: Exact answers, multiple choice
- **Fuzzy matching**: Flexible text comparison
- **Model grading**: AI-judges-AI for complex tasks
- **Structured choices**: Consistent scoring with predefined options
- **Semantic similarity**: Meaning-based evaluation using embeddings and cosine similarity

## Contributing

1. Fork the repository
2. Create your feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 🔧 Extending the Framework

### **Adding New Evaluation Templates**

```typescript
import { EvalTemplate, EvalSample, CompletionResult, EvalResult } from './src/types';

export class CustomEval implements EvalTemplate {
  name = 'custom';

  constructor(private args: CustomEvalArgs) {}

  async evaluate(sample: EvalSample, completion: CompletionResult): Promise<EvalResult> {
    // Your custom evaluation logic
    const score = this.customScoring(sample, completion);
    
    return {
      sample_id: this.generateSampleId(sample),
      input: sample.input,
      ideal: sample.ideal,
      completion,
      score: score,
      passed: score >= 0.6,
      reasoning: `Custom evaluation: ${score.toFixed(3)}`,
      metadata: {
        evaluation_type: 'custom',
        custom_metrics: this.calculateMetrics(completion)
      }
    };
  }

  private customScoring(sample: EvalSample, completion: CompletionResult): number {
    // Implement your domain-specific scoring logic
    return 0.85; // Example score
  }
}

// Register in src/registry.ts
case 'CustomEval':
  return new CustomEval(config.args as CustomEvalArgs);
```

### **Adding New LLM Providers**

```typescript
import { LLMClient, ChatMessage, CompletionResult } from './src/types';

export class CustomProviderClient implements LLMClient {
  constructor(private model: string, private config: any) {}

  async complete(messages: ChatMessage[]): Promise<CompletionResult> {
    // Your provider integration
    const response = await this.callCustomAPI(messages);
    
    return {
      content: response.text,
      model: this.model,
      usage: {
        prompt_tokens: response.input_tokens,
        completion_tokens: response.output_tokens,
        total_tokens: response.input_tokens + response.output_tokens
      },
      finish_reason: response.stop_reason
    };
  }

  getModel(): string {
    return this.model;
  }

  private async callCustomAPI(messages: ChatMessage[]) {
    // Your API integration logic
  }
}

// Add to createLLMClient function in src/llm-client.ts
export function createLLMClient(model: string): LLMClient {
  if (model.startsWith('custom-')) {
    return new CustomProviderClient(model, { apiKey: process.env.CUSTOM_API_KEY });
  }
  // ... existing providers
}
```

### **Production Features Extension**

```typescript
// Custom Cost Provider
costManager.addCostConfig({
  provider: 'custom-ai',
  model: 'custom-model-v1',
  input_cost_per_1k_tokens: 0.001,
  output_cost_per_1k_tokens: 0.002
});

// Custom Alert Rules
monitor.addRule({
  id: 'custom_performance_check',
  name: 'Custom Performance Monitor',
  condition: {
    type: 'custom',
    threshold: 0.85,
    models: ['custom-model-v1']
  },
  actions: [
    { type: 'webhook', config: { url: 'https://your-webhook.com/alerts' } }
  ]
});

// Custom Quality Gates
const customQualityGate: QualityGate = {
  name: "Business Logic Validation",
  condition: {
    type: 'custom',
    threshold: 0.9,
    // Your custom validation logic
  },
  action: 'fail',
  required: true
};
```

## 📚 Documentation & Resources

### **Comprehensive Guides**
- **[FRAMEWORK_EXPLAINED.md](FRAMEWORK_EXPLAINED.md)**: Complete beginner's guide with step-by-step explanations
- **[CUSTOM_EVALS_GUIDE.md](CUSTOM_EVALS_GUIDE.md)**: Advanced guide for building custom evaluations
- **[PRODUCTION_SETUP.md](PRODUCTION_SETUP.md)**: Production deployment and optional dependencies setup
- **[PRODUCTION_FEATURES.md](PRODUCTION_FEATURES.md)**: Overview of enterprise-grade features

### **Model Provider Setup Guides**
- **[docs/OLLAMA_SETUP.md](docs/OLLAMA_SETUP.md)**: Complete guide for local model evaluation with Ollama
- **[docs/HUGGINGFACE_SETUP.md](docs/HUGGINGFACE_SETUP.md)**: Guide for using HuggingFace community models
- **[docs/EXTENDING_MODELS.md](docs/EXTENDING_MODELS.md)**: How to add support for new LLM providers

### **Advanced Evaluation Guides**
- **[docs/SEMANTIC_SIMILARITY_GUIDE.md](docs/SEMANTIC_SIMILARITY_GUIDE.md)**: Complete guide to meaning-based evaluation using embeddings

### **Example Configurations**
- **`examples/production-config.yaml`**: Production pipeline configuration
- **`examples/toxicity-testing-guide.md`**: Safety evaluation setup
- **`examples/model-vs-model-examples.md`**: A/B testing examples
- **`registry/evals/`**: Sample evaluation configurations

### **Getting Started Path**
1. **🎯 Start Here**: Follow the [Quick Start](#-quick-start) section above
2. **🤖 Choose Models**: Set up [OpenAI](https://platform.openai.com/api-keys), [Ollama](docs/OLLAMA_SETUP.md), or [HuggingFace](docs/HUGGINGFACE_SETUP.md) models
3. **📖 Deep Dive**: Read [FRAMEWORK_EXPLAINED.md](FRAMEWORK_EXPLAINED.md) for complete understanding
4. **🏗️ Build Custom**: Use [CUSTOM_EVALS_GUIDE.md](CUSTOM_EVALS_GUIDE.md) for advanced features
5. **🚀 Production**: Deploy with [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md)

## 🎯 Use Cases & Industries

### **AI Model Development**
- Model performance regression testing
- Safety and bias evaluation before deployment
- A/B testing for model selection
- Cost-performance optimization

### **Enterprise AI Governance**
- Compliance and audit trails
- Automated quality gates in CI/CD
- Performance monitoring and alerting  
- Executive reporting and analytics

### **Research & Academia**
- Standardized model evaluation protocols
- Statistical comparison methodologies
- Reproducible research experiments
- Collaborative evaluation datasets

### **Industry Applications**
- **Healthcare**: Medical AI safety and accuracy validation
- **Finance**: Risk model evaluation and compliance testing
- **Education**: Educational AI content quality assessment
- **Legal**: Legal AI fairness and bias testing

## 🔄 Roadmap

### **Upcoming Features**
- **Multi-modal Support**: Image, audio, and video evaluation capabilities
- **Advanced Analytics**: Machine learning-powered performance insights
- **Enterprise Integrations**: SAML/SSO, advanced RBAC, audit logging
- **Distributed Evaluation**: Kubernetes-based scalable evaluation clusters
- **Model Marketplace**: Integration with model hosting platforms

### **Community Contributions Welcome**
- New evaluation templates for domain-specific use cases
- LLM provider integrations (Gemini, Cohere, additional local model frameworks)
- Enhanced statistical analysis methods
- Dashboard visualizations and widgets
- Integration plugins for development tools
- Model-specific optimization and prompt engineering

## License

MIT License - see LICENSE file for details.

## 🤝 Support & Community

### **Getting Help**
1. **📖 Documentation**: Check the comprehensive guides listed above
2. **💡 Examples**: Review the `examples/` directory for common patterns  
3. **🐛 Issues**: Search [existing issues](link-to-issues) or create new ones
4. **💬 Discussions**: Join our community discussions for questions and ideas

### **Contributing**
1. Fork the repository and create your feature branch
2. Add comprehensive tests for new functionality
3. Update documentation for any new features
4. Ensure all tests pass and code follows style guidelines
5. Submit a pull request with clear description and examples

### **Issue Reporting**
When reporting issues, please include:
- Framework version and environment details
- Complete error messages and stack traces
- Minimal reproducible example or configuration
- Expected vs actual behavior description

**Built with ❤️ by the AI evaluation community**
