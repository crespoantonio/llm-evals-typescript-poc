# Model Support Examples

## Currently Supported (✅ Ready to use)
```bash
# OpenAI Models
npx ts-node src/cli.ts gpt-3.5-turbo math-basic
npx ts-node src/cli.ts gpt-4 sql-graded --max-samples 10
npx ts-node src/cli.ts gpt-4-turbo math-basic --verbose
npx ts-node src/cli.ts o1-preview sql-basic
```

## Easy to Add (🔧 5-10 minutes setup)

### Anthropic Claude
```bash
# After adding AnthropicClient:
npx ts-node src/cli.ts claude-3-sonnet-20240229 math-basic
npx ts-node src/cli.ts claude-3-opus-20240229 sql-graded
npx ts-node src/cli.ts claude-3-haiku-20240307 math-basic
```

## Google Gen AI (✅ Ready to use)
```bash
# Google Gemini Models (requires GEMINI_API_KEY)
npx ts-node src/cli.ts gemini-2.0-flash-001 math-basic
npx ts-node src/cli.ts gemini-1.5-pro math-basic
npx ts-node src/cli.ts google/gemini-2.0-flash-001 sql-graded
npx ts-node src/cli.ts genai/gemini-1.5-pro sql-basic
```

### Azure OpenAI
```bash
# After adding AzureOpenAIClient:
npx ts-node src/cli.ts azure-gpt-4 math-basic
npx ts-node src/cli.ts azure-gpt-35-turbo sql-basic
```

### Local Models (Ollama)
```bash
# After adding OllamaClient:
npx ts-node src/cli.ts ollama/llama2 math-basic
npx ts-node src/cli.ts ollama/codellama sql-basic
npx ts-node src/cli.ts ollama/mistral math-basic
```

### Hugging Face (✅ Ready to use)
```bash
# Popular instruction-following models:
npx ts-node src/cli.ts hf/google/flan-t5-large math-basic
npx ts-node src/cli.ts hf/microsoft/DialoGPT-large math-basic
npx ts-node src/cli.ts hf/bigscience/bloom-1b1 sql-basic

# Code generation models:
npx ts-node src/cli.ts hf/codellama/CodeLlama-7b-Instruct-hf sql-basic
npx ts-node src/cli.ts hf/Salesforce/codegen-350M-mono math-basic

# Quick testing models:
npx ts-node src/cli.ts hf/distilgpt2 math-basic --max-samples 5
npx ts-node src/cli.ts hf/gpt2 toxicity --max-samples 3
```

### Custom/Enterprise APIs
```bash
# After adding CustomClient:
npx ts-node src/cli.ts custom-model-v1 math-basic
npx ts-node src/cli.ts enterprise/my-llm sql-graded
```

## Testing Without API Keys (Dry Run)
```bash
# Test any model configuration without API calls:
npx ts-node src/cli.ts any-model-name math-basic --dry-run --verbose
```

## Key Benefits

1. **Same Evaluation Logic**: All models use the same evaluation templates
2. **Consistent Results**: Compare performance across different models
3. **Easy Benchmarking**: Run the same eval on multiple models
4. **Cost Effective**: Use dry-run mode to test configurations
5. **Extensible**: Add new providers by implementing the LLMClient interface

## Architecture

The framework separates:
- **Model Communication** (LLMClient implementations)  
- **Evaluation Logic** (BasicEval, ModelGradedEval templates)
- **Dataset Management** (Registry and JSONL loaders)
- **Result Analysis** (Logging and reporting)

This means you can add **any model** without changing the evaluation logic!
