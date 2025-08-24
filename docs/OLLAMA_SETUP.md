# Using Ollama with the LLM Evaluation Framework

## Quick Start

### 1. Install and Start Ollama

```bash
# Download and install Ollama from https://ollama.ai
# Or use package manager:
# macOS: brew install ollama
# Linux: curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama server
ollama serve

# In another terminal, pull a model
ollama pull llama2
ollama pull codellama
ollama pull mistral
```

### 2. Run Evaluations

```bash
# Basic evaluation with Llama2
npx ts-node src/cli.ts ollama/llama2 math-basic

# Code evaluation with CodeLlama  
npx ts-node src/cli.ts ollama/codellama sql-basic

# Advanced evaluation with Mistral
npx ts-node src/cli.ts ollama/mistral toxicity --max-samples 5

# Test without model calls (dry run)
npx ts-node src/cli.ts ollama/llama2 math-basic --dry-run --verbose
```

## Supported Models

Any model available in Ollama can be used:

```bash
# Popular models
npx ts-node src/cli.ts ollama/llama2 math-basic
npx ts-node src/cli.ts ollama/llama2:13b math-basic
npx ts-node src/cli.ts ollama/codellama math-basic
npx ts-node src/cli.ts ollama/mistral math-basic
npx ts-node src/cli.ts ollama/neural-chat math-basic
npx ts-node src/cli.ts ollama/starcode math-basic

# Custom models (if you've imported them)
npx ts-node src/cli.ts ollama/my-custom-model math-basic
```

## Configuration Options

The OllamaClient supports all standard completion options:

```bash
# Temperature control
npx ts-node src/cli.ts ollama/llama2 math-basic --temperature 0.7

# Token limits
npx ts-node src/cli.ts ollama/mistral sql-basic --max-tokens 500

# Verbose output
npx ts-node src/cli.ts ollama/codellama sql-basic --verbose
```

## Programmatic Usage

```typescript
import { createLLMClient } from './src/llm-client';

// Create Ollama client
const client = createLLMClient('ollama/llama2');

// Or specify custom Ollama server
const customClient = new OllamaClient('llama2', 'http://192.168.1.100:11434');

// Use with evaluation
const result = await client.complete([
  { role: 'user', content: 'What is 2+2?' }
], { temperature: 0.1 });

console.log(result.content);
```

## Troubleshooting

### Common Issues

**1. Connection Refused**
```
Error: Failed to connect to Ollama at http://localhost:11434
```
**Solution:** Make sure Ollama is running with `ollama serve`

**2. Model Not Found**
```
Error: Ollama API error: 404 model 'llama2' not found
```
**Solution:** Pull the model first: `ollama pull llama2`

**3. Custom Ollama Port**
```typescript
// If Ollama runs on different port
const client = new OllamaClient('llama2', 'http://localhost:11435');
```

### Performance Tips

1. **Model Size vs Speed**: Smaller models (7B) are faster but less capable
2. **Token Limits**: Set `--max-tokens` to control response length
3. **Temperature**: Use 0.0 for deterministic results, 0.7+ for creative tasks
4. **Parallel Runs**: Ollama can handle multiple concurrent requests

## Example Evaluation Results

```bash
$ npx ts-node src/cli.ts ollama/llama2 math-basic --verbose

🚀 Starting evaluation: math-basic
📊 Model: llama2 (via Ollama)
📝 Template: BasicEval
🎯 Samples: 10

Sample 1/10: ✅ PASS (Expected: 4, Got: 4)
Sample 2/10: ✅ PASS (Expected: 7, Got: 7)
...

📈 Results:
├─ Accuracy: 80.0% (8/10)
├─ Average Score: 0.8
├─ Token Usage: 245 total (120 prompt, 125 completion)
└─ Duration: 15.2s
```

## Model Comparison Example

```bash
# Compare different models on same eval
npx ts-node src/cli.ts ollama/llama2 math-basic > llama2-results.jsonl
npx ts-node src/cli.ts ollama/mistral math-basic > mistral-results.jsonl
npx ts-node src/cli.ts ollama/codellama math-basic > codellama-results.jsonl

# Analyze results
cat *-results.jsonl | jq '.final_report.accuracy'
```

## Benefits of Local Testing

✅ **No API Costs** - Run unlimited evaluations  
✅ **Privacy** - Data stays on your machine  
✅ **Speed** - No network latency  
✅ **Offline** - Works without internet  
✅ **Custom Models** - Test your own fine-tuned models  
✅ **Reproducible** - Same environment, consistent results  

## Next Steps

1. **Try different models**: `ollama list` to see available models
2. **Create custom evaluations**: Use your domain-specific datasets
3. **Compare performance**: Test same eval across multiple models
4. **Model grading**: Use one local model to grade another
5. **Production usage**: Set up automated evaluation pipelines
