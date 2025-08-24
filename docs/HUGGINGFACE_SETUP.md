# Using Hugging Face Models with the LLM Evaluation Framework

## Quick Start

### 1. Get Your API Key (Optional but Recommended)

```bash
# Sign up at https://huggingface.co/settings/tokens
# Create a token and set it as environment variable:
export HUGGINGFACE_API_KEY="hf_your_token_here"

# Or add to your .env file:
echo "HUGGINGFACE_API_KEY=hf_your_token_here" >> .env
```

> **Note**: API key is optional for public models but recommended to avoid rate limits and get faster inference.

### 2. Run Evaluations

```bash
# Popular instruction-following models
npx ts-node src/cli.ts hf/microsoft/DialoGPT-large math-basic
npx ts-node src/cli.ts hf/google/flan-t5-large sql-basic
npx ts-node src/cli.ts hf/bigscience/bloom-1b1 math-basic

# Code generation models
npx ts-node src/cli.ts hf/codellama/CodeLlama-7b-Instruct-hf sql-basic
npx ts-node src/cli.ts hf/Salesforce/codegen-350M-mono math-basic

# Test without API calls (dry run)
npx ts-node src/cli.ts hf/any-model math-basic --dry-run --verbose
```

## Popular Models to Try

### **Instruction-Following Models**
```bash
# Google's T5 family (great for structured tasks)
npx ts-node src/cli.ts hf/google/flan-t5-base math-basic
npx ts-node src/cli.ts hf/google/flan-t5-large sql-basic

# Microsoft's models
npx ts-node src/cli.ts hf/microsoft/DialoGPT-medium math-basic

# BigScience BLOOM family
npx ts-node src/cli.ts hf/bigscience/bloom-560m math-basic
```

### **Code Generation Models**
```bash
# CodeLlama variants
npx ts-node src/cli.ts hf/codellama/CodeLlama-7b-Instruct-hf sql-basic
npx ts-node src/cli.ts hf/codellama/CodeLlama-13b-Python-hf sql-basic

# Salesforce Codegen
npx ts-node src/cli.ts hf/Salesforce/codegen-350M-mono sql-basic
npx ts-node src/cli.ts hf/Salesforce/codegen-2B-mono sql-basic
```

### **Conversational Models**
```bash
# Conversational AI models
npx ts-node src/cli.ts hf/microsoft/DialoGPT-large toxicity --max-samples 3
npx ts-node src/cli.ts hf/facebook/blenderbot-400M-distill math-basic
```

### **Lightweight Models (Fast)**
```bash
# Small models for quick testing
npx ts-node src/cli.ts hf/distilgpt2 math-basic --max-samples 5
npx ts-node src/cli.ts hf/gpt2 math-basic --max-samples 5
```

## Configuration Options

### **Temperature & Creativity**
```bash
# Conservative (good for math/code)
npx ts-node src/cli.ts hf/google/flan-t5-large math-basic --temperature 0.1

# Balanced
npx ts-node src/cli.ts hf/microsoft/DialoGPT-large math-basic --temperature 0.7

# Creative (good for open-ended tasks)
npx ts-node src/cli.ts hf/bigscience/bloom-560m toxicity --temperature 0.9
```

### **Token Limits**
```bash
# Short responses
npx ts-node src/cli.ts hf/google/flan-t5-base math-basic --max-tokens 100

# Longer responses
npx ts-node src/cli.ts hf/codellama/CodeLlama-7b-Instruct-hf sql-basic --max-tokens 500
```

## Programmatic Usage

```typescript
import { createLLMClient } from './src/llm-client';

// Create HuggingFace client
const client = createLLMClient('hf/google/flan-t5-large');

// Or with explicit constructor
const customClient = new HuggingFaceClient(
  'google/flan-t5-large',
  'hf_your_token',
  'https://api-inference.huggingface.co/models'
);

// Use with evaluation
const result = await client.complete([
  { role: 'user', content: 'What is 15 + 27?' }
], { 
  temperature: 0.1,
  max_tokens: 50 
});

console.log(result.content);
```

## Model Performance Tips

### **Model Selection by Task**

| **Task Type** | **Recommended Models** | **Why** |
|---------------|------------------------|---------|
| **Math Problems** | `flan-t5-large`, `bloom-1b1` | Strong reasoning capabilities |
| **Code Generation** | `CodeLlama-7b-Instruct-hf`, `codegen-2B-mono` | Specialized for programming |
| **SQL Queries** | `CodeLlama-7b-Instruct-hf`, `flan-t5-large` | Good structured output |
| **Toxicity Detection** | `DialoGPT-large`, `bloom-560m` | Better conversational understanding |
| **Quick Testing** | `distilgpt2`, `flan-t5-base` | Fast inference, low cost |

### **Parameter Tuning**

```bash
# For factual/mathematical tasks
--temperature 0.0 --max-tokens 100

# For creative tasks
--temperature 0.8 --max-tokens 300

# For code generation
--temperature 0.2 --max-tokens 500
```

## Troubleshooting

### **Common Issues**

**1. Model Loading (503 Error)**
```
Error: Model google/flan-t5-large is loading. Try again in a few moments.
```
**Solution**: Wait 10-30 seconds and retry. Popular models load faster.

**2. Rate Limits (429 Error)**
```
Error: Too many requests
```
**Solution**: Get a HuggingFace API key or wait before retrying.

**3. Model Not Found (404 Error)**
```
Error: Model not found
```
**Solution**: Check model name at https://huggingface.co/models

**4. Token Limit Exceeded**
```
Error: Input is too long
```
**Solution**: Use `--max-tokens` to limit response length.

### **Performance Optimization**

```bash
# Use smaller models for development
npx ts-node src/cli.ts hf/distilgpt2 math-basic

# Use larger models for final evaluation
npx ts-node src/cli.ts hf/google/flan-t5-large math-basic

# Batch similar requests
npx ts-node src/cli.ts hf/flan-t5-base math-basic --max-samples 20
```

## Example Evaluation Results

```bash
$ npx ts-node src/cli.ts hf/google/flan-t5-large math-basic --verbose

🚀 Starting evaluation: math-basic
📊 Model: google/flan-t5-large (via HuggingFace)
📝 Template: BasicEval
🎯 Samples: 10

Sample 1/10: ✅ PASS (Expected: 4, Got: 4)
Sample 2/10: ✅ PASS (Expected: 7, Got: 7)
Sample 3/10: ❌ FAIL (Expected: 12, Got: 11)
...

📈 Results:
├─ Accuracy: 90.0% (9/10)
├─ Average Score: 0.9
├─ Token Usage: ~380 total (estimated)
└─ Duration: 45.2s
```

## Model Comparison

```bash
# Test different HF models on same task
npx ts-node src/cli.ts hf/google/flan-t5-base math-basic > flan-t5-base-results.jsonl
npx ts-node src/cli.ts hf/google/flan-t5-large math-basic > flan-t5-large-results.jsonl
npx ts-node src/cli.ts hf/bigscience/bloom-560m math-basic > bloom-560m-results.jsonl

# Compare with other providers
npx ts-node src/cli.ts ollama/llama2 math-basic > ollama-llama2-results.jsonl
npx ts-node src/cli.ts gpt-3.5-turbo math-basic > openai-gpt35-results.jsonl
```

## Benefits of HuggingFace Integration

✅ **Huge Model Selection** - 100,000+ models available  
✅ **Free Tier** - Many models free without API key  
✅ **Specialized Models** - Domain-specific fine-tuned models  
✅ **Open Source** - Transparent model weights and training  
✅ **Community** - Active community with model discussions  
✅ **Cutting Edge** - Latest research models often appear first  

## Best Practices

1. **Start Small**: Use `distilgpt2` or `flan-t5-base` for initial testing
2. **Use API Keys**: Get better performance with authentication
3. **Model Selection**: Match model capabilities to your task
4. **Batch Testing**: Run multiple samples to get reliable metrics
5. **Compare Models**: Test same evaluation across different models
6. **Monitor Usage**: HuggingFace has rate limits for free usage

## Integration with Production Features

```bash
# Cost tracking with HF models
npx ts-node src/cli.ts hf/google/flan-t5-large math-basic --enable-cost-tracking

# A/B testing HF vs other providers
npx ts-node src/cli.ts hf/flan-t5-large,gpt-3.5-turbo math-basic --enable-comparison

# Dashboard with HF model results
npx ts-node src/cli.ts hf/codellama/CodeLlama-7b-Instruct-hf sql-basic --enable-dashboard
```

## Next Steps

1. **Explore Models**: Browse https://huggingface.co/models for your domain
2. **Custom Evaluations**: Create evaluations for your specific use case  
3. **Fine-tuned Models**: Try domain-specific fine-tuned models
4. **Model Grading**: Use one HF model to grade another
5. **Automated Pipelines**: Set up CI/CD with HF model evaluations
