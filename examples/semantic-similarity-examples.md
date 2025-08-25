# 🧠 Semantic Similarity Evaluation Examples

This guide provides practical examples of using semantic similarity evaluation in the LLM Evaluation Framework. Semantic similarity allows you to evaluate based on **meaning** rather than exact text matches.

## 🚀 Quick Examples

### **Basic Usage**

```bash
# Basic semantic similarity evaluation
npx ts-node src/cli.ts gpt-3.5-turbo semantic-basic --max-samples 5

# With verbose output to see similarity scores
npx ts-node src/cli.ts gpt-4 semantic-qa --verbose --max-samples 3

# Free evaluation using local embeddings (mock)
npx ts-node src/cli.ts ollama/llama2 semantic-local --max-samples 5

# Test configuration without API calls
npx ts-node src/cli.ts any-model semantic-creative --dry-run --verbose
```

## 📊 Real-World Use Cases

### **1. Question Answering Evaluation**

**Problem**: Traditional exact matching fails when responses are correct but phrased differently.

```bash
# Traditional evaluation fails:
# Expected: "Paris"
# Got: "The capital of France is Paris" ❌ FAIL (exact match)

# Semantic evaluation succeeds:
npx ts-node src/cli.ts gpt-3.5-turbo semantic-qa --verbose
# Expected: "Paris"  
# Got: "The capital of France is Paris" ✅ PASS (similarity: 0.87)
```

### **2. Creative Writing Assessment**

**Problem**: Creative tasks have many correct answers that can't be predetermined.

```yaml
# Configuration for creative tasks
creative-writing:
  class: SemanticSimilarityEval
  args:
    samples_jsonl: creative/poetry.jsonl
    threshold: 0.65  # Lower threshold for creative freedom
    match_mode: best
```

```bash
# Example evaluation
npx ts-node src/cli.ts gpt-4 semantic-creative --max-samples 5

# Sample result:
# Expected: "Gentle drops from cloudy skies, washing earth with nature's cries"
# Got: "Rain falls softly from above, bringing life with gentle love"
# Similarity: 0.78 ✅ PASS (both are poetic descriptions of rain)
```

### **3. Translation Quality Assessment**

**Problem**: Multiple correct translations exist for the same source text.

```bash
# Translation evaluation with high threshold for accuracy
npx ts-node src/cli.ts gpt-4 semantic-translation --max-samples 10

# Sample results:
# Expected: "Hola, ¿cómo estás?"
# Got: "Hello, how are you?" in Spanish: "Hola, ¿qué tal?"  
# Similarity: 0.89 ✅ PASS (different phrasing, same meaning)
```

### **4. Multi-Answer Questions**

**Problem**: Questions with multiple acceptable answers need flexible evaluation.

```json
// Dataset with multiple acceptable answers
{
  "input": [...], 
  "ideal": ["Python", "JavaScript", "Java", "TypeScript", "Go"]
}
```

```bash
# Best mode: finds the closest match among all acceptable answers
npx ts-node src/cli.ts gpt-3.5-turbo semantic-multi --verbose

# Sample result:
# Expected: ["Python", "JavaScript", "Java", "TypeScript", "Go"]
# Got: "I would recommend using Python for this task"
# Best match: "Python" (similarity: 0.82) ✅ PASS
```

## ⚙️ Configuration Examples

### **Strict Factual Accuracy**

```yaml
factual-strict:
  class: SemanticSimilarityEval
  args:
    samples_jsonl: facts/science.jsonl
    threshold: 0.9                    # Very high threshold
    embeddings_provider: openai
    embeddings_model: text-embedding-3-large  # Most accurate model
    match_mode: best
```

### **Lenient Creative Evaluation**

```yaml
creative-lenient:
  class: SemanticSimilarityEval
  args:
    samples_jsonl: creative/stories.jsonl
    threshold: 0.6                    # Lower threshold for creativity
    embeddings_provider: openai
    embeddings_model: text-embedding-3-small
    match_mode: threshold             # Pass if ANY answer meets threshold
```

### **Cost-Conscious Development**

```yaml
local-development:
  class: SemanticSimilarityEval
  args:
    samples_jsonl: dev/basic.jsonl
    threshold: 0.75
    embeddings_provider: local        # No API costs
    match_mode: best
    cache_embeddings: true
```

## 🎯 Match Mode Comparison

### **Best Mode vs Threshold Mode vs All Mode**

```bash
# Test all three modes on the same dataset
npx ts-node src/cli.ts gpt-4 semantic-multi --max-samples 5    # best mode
npx ts-node src/cli.ts gpt-4 semantic-threshold --max-samples 5 # threshold mode  
npx ts-node src/cli.ts gpt-4 semantic-all --max-samples 5       # all mode
```

**Example with multiple ideal answers**: `["Hello", "Hi", "Hey", "Greetings"]`

**Model response**: "Good morning"

| Mode | Similarities | Result | Reasoning |
|------|-------------|--------|-----------|
| **best** | Hello: 0.73, Hi: 0.71, Hey: 0.68, Greetings: 0.81 | Score: 0.81 | Uses best match (Greetings) |
| **threshold** | Same as above | Pass if 0.81 ≥ threshold | Passes if ANY answer meets threshold |
| **all** | Average: 0.73 | Score: 0.73 | Uses average, requires ALL above threshold |

## 📈 Performance Optimization

### **Embedding Caching**

```typescript
// Programmatic usage with caching
import { SemanticSimilarityEval } from './src';

const eval = new SemanticSimilarityEval({
  samples_jsonl: 'large-dataset.jsonl',
  cache_embeddings: true  // Cache for performance
});

// Precompute embeddings for faster evaluation
await eval.precomputeEmbeddings(samples);

// Now evaluations will be faster
const results = await eval.evaluate(sample, completion);

// Check cache statistics
console.log(eval.getCacheStats()); 
// { size: 150, keys: [...] }
```

### **Batch Processing**

```bash
# Process large datasets efficiently
npx ts-node src/cli.ts gpt-3.5-turbo semantic-qa --max-samples 100

# Use faster embedding model for large batches
embeddings_model: text-embedding-3-small
```

## 🎨 Creative Use Cases

### **Poetry Evaluation**

```yaml
poetry-eval:
  class: SemanticSimilarityEval
  args:
    samples_jsonl: creative/haikus.jsonl
    threshold: 0.7
    match_mode: best
```

```bash
npx ts-node src/cli.ts gpt-4 poetry-eval --max-samples 10

# Example:
# Expected: "Cherry blossoms fall, spring's beauty in gentle drift, nature's soft goodbye"
# Got: "Pink petals descend, springtime's graceful farewell dance, season's tender end"
# Similarity: 0.84 ✅ PASS (both capture spring/cherry blossom themes poetically)
```

### **Code Comment Evaluation**

```yaml
code-comments:
  class: SemanticSimilarityEval
  args:
    samples_jsonl: code/comments.jsonl
    threshold: 0.8
    match_mode: best
```

```bash
# Evaluate code comment quality
npx ts-node src/cli.ts gpt-3.5-turbo code-comments --max-samples 15

# Example:
# Expected: "Function calculates user age from birthdate"
# Got: "Returns the user's age in years based on their date of birth"
# Similarity: 0.91 ✅ PASS (same meaning, different wording)
```

## 🔬 Comparison with Other Evaluation Methods

### **Semantic Similarity vs Exact Match**

```bash
# Run the same dataset with different evaluation methods
npx ts-node src/cli.ts gpt-4 math-basic --max-samples 10        # Exact match
npx ts-node src/cli.ts gpt-4 semantic-basic --max-samples 10    # Semantic similarity

# Typical results:
# Exact Match: 60% accuracy (strict)
# Semantic Similarity: 85% accuracy (captures meaning)
```

### **Semantic Similarity vs Model Grading**

| Method | Speed | Cost | Accuracy | Use Case |
|--------|-------|------|----------|----------|
| **Semantic Similarity** | Fast | Low | High for meaning | Factual answers, translations |
| **Model Grading** | Slow | High | Very High | Complex reasoning, creativity |
| **Exact Match** | Fastest | None | Perfect for exact | Multiple choice, coding |

## 📊 Advanced Analytics

### **Similarity Distribution Analysis**

```typescript
// Analyze similarity score patterns
import { SemanticSimilarityService } from './src';

const service = new SemanticSimilarityService();

// Test multiple model responses
const responses = [
  "Paris is the capital",
  "The capital city is Paris", 
  "Paris",
  "It's Paris"
];

const target = "Paris";

for (const response of responses) {
  const result = await service.calculateSimilarity(response, target);
  console.log(`"${response}" -> similarity: ${result.similarity.toFixed(3)}`);
}

// Output:
// "Paris is the capital" -> similarity: 0.876
// "The capital city is Paris" -> similarity: 0.923  
// "Paris" -> similarity: 1.000
// "It's Paris" -> similarity: 0.943
```

## 🚀 Integration Examples

### **CI/CD Quality Gates**

```yaml
# .github/workflows/eval.yml
name: Model Quality Check
on: [push, pull_request]

jobs:
  semantic-evaluation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Semantic Similarity Tests
        run: |
          npx ts-node src/cli.ts gpt-3.5-turbo semantic-qa --max-samples 50
          # Fail if accuracy < 80%
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### **A/B Testing Models**

```bash
# Compare semantic similarity performance across models
npx ts-node src/cli.ts gpt-3.5-turbo semantic-qa --max-samples 100 --log-to-file gpt35-semantic.jsonl
npx ts-node src/cli.ts gpt-4 semantic-qa --max-samples 100 --log-to-file gpt4-semantic.jsonl
npx ts-node src/cli.ts ollama/llama2 semantic-local --max-samples 100 --log-to-file llama2-semantic.jsonl

# Analyze results
cat *-semantic.jsonl | jq '.final_report.score'
```

---

## 💡 Tips for Success

1. **Start with appropriate thresholds**: 0.8 is a good default, adjust based on your needs
2. **Use local embeddings for development**: Free and fast for testing configurations
3. **Enable caching for large datasets**: Significantly speeds up repeated evaluations
4. **Choose the right match mode**: `best` for most use cases, `threshold` for leniency
5. **Monitor similarity scores**: Use `--verbose` to understand how similarity is calculated
6. **Test edge cases**: Include difficult examples in your datasets to validate thresholds

Semantic similarity evaluation opens up new possibilities for meaningful LLM assessment! 🎉
