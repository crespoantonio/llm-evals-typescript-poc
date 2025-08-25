# 🧠 Semantic Similarity Evaluation Guide

A comprehensive guide to using semantic similarity evaluation in the LLM Evaluation Framework. This feature allows you to evaluate model responses based on **meaning** rather than exact text matches, making it perfect for creative tasks, translations, question answering, and any scenario where multiple correct answers exist.

## 📋 Table of Contents
- [🎯 What is Semantic Similarity?](#-what-is-semantic-similarity)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Configuration Options](#️-configuration-options)
- [📊 Match Modes Explained](#-match-modes-explained)
- [🔧 Embeddings Providers](#-embeddings-providers)
- [📝 Dataset Examples](#-dataset-examples)
- [💡 Use Cases](#-use-cases)
- [📈 Performance Tips](#-performance-tips)
- [🔧 Troubleshooting](#-troubleshooting)

---

## 🎯 What is Semantic Similarity?

Traditional evaluation methods like exact matching often fail when:
- Multiple correct answers exist ("Paris" vs "The capital of France is Paris")
- Responses use different wording but same meaning ("Happy" vs "Joyful")
- Creative tasks have subjective correct answers
- Translations can be phrased differently but mean the same thing

**Semantic similarity** solves this by:
1. Converting text to **embeddings** (numerical representations of meaning)
2. Calculating **cosine similarity** between model output and ideal answers
3. Scoring based on how similar the meanings are (0.0 = completely different, 1.0 = identical meaning)

---

## 🚀 Quick Start

### **1. Basic Setup**

```bash
# Test semantic similarity evaluation (requires OpenAI API key)
npx ts-node src/cli.ts gpt-3.5-turbo semantic-basic --max-samples 3 --verbose

# Test with dry run (no API calls)
npx ts-node src/cli.ts any-model semantic-basic --dry-run --verbose

# Use local embeddings (no API costs, mock implementation)
npx ts-node src/cli.ts gpt-4 semantic-local --max-samples 3
```

### **2. Example Output**

```bash
🚀 Starting evaluation: semantic-basic with model: gpt-3.5-turbo
📊 Loading dataset from: registry/data/semantic/basic.jsonl
📝 Evaluating 3 samples

Sample 1/3: ✅ PASS 
  Expected: "Paris"
  Got: "The capital of France is Paris."
  Similarity: 0.8542 (threshold: 0.8)

Sample 2/3: ✅ PASS
  Expected: "Blue" 
  Got: "The sky is typically blue in color."
  Similarity: 0.8723 (threshold: 0.8)

Sample 3/3: ❌ FAIL
  Expected: "Seven days"
  Got: "There are 7 days in a week, which are Monday through Sunday."
  Similarity: 0.7834 (threshold: 0.8)

🎯 Final Results: 66.7% accuracy (2/3 passed)
```

---

## ⚙️ Configuration Options

### **Basic Configuration**

```yaml
# registry/evals/my-semantic-eval.yaml
my-semantic-eval:
  id: my-semantic-eval.v1
  description: Custom semantic similarity evaluation
  metrics: [accuracy, semantic_similarity]
  class: SemanticSimilarityEval
  args:
    samples_jsonl: semantic/my-dataset.jsonl
    threshold: 0.8                    # Similarity threshold (0.0-1.0)
    embeddings_provider: openai       # openai or local
    embeddings_model: text-embedding-3-small
    match_mode: best                  # best, threshold, or all
    cache_embeddings: true
```

### **Configuration Parameters Explained**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `threshold` | number | 0.8 | Minimum similarity score to pass (0.0-1.0) |
| `embeddings_provider` | string | 'openai' | 'openai' or 'local' |
| `embeddings_model` | string | 'text-embedding-3-small' | Specific embedding model |
| `match_mode` | string | 'best' | 'best', 'threshold', or 'all' |
| `cache_embeddings` | boolean | true | Cache embeddings for performance |

---

## 📊 Match Modes Explained

### **🥇 Best Mode (`match_mode: best`)**
- **What it does**: Finds the highest similarity among all ideal answers
- **Scoring**: Uses the best similarity score
- **When to use**: When any of multiple correct answers is acceptable

```yaml
# Example: Best mode for multiple choice
best-mode-example:
  class: SemanticSimilarityEval
  args:
    match_mode: best
    threshold: 0.8
    # If ideal: ["Hello", "Hi", "Hey"] and model says "Greetings"
    # Calculates: ["Hello": 0.75, "Hi": 0.73, "Hey": 0.71, "Greetings": highest]
    # Score: 0.75 (best match with "Hello")
    # Result: FAIL (0.75 < 0.8 threshold)
```

### **🎯 Threshold Mode (`match_mode: threshold`)**
- **What it does**: Passes if ANY ideal answer meets the threshold
- **Scoring**: Uses the maximum similarity found
- **When to use**: When you want to be more lenient with multiple answers

```yaml
# Example: Threshold mode for creative tasks
threshold-mode-example:
  class: SemanticSimilarityEval
  args:
    match_mode: threshold
    threshold: 0.7
    # If ideal: ["Joyful", "Happy", "Elated"] and model says "Cheerful"
    # Calculates: ["Joyful": 0.85, "Happy": 0.82, "Elated": 0.65]
    # Result: PASS (0.85 > 0.7 threshold, at least one answer qualifies)
```

### **📏 All Mode (`match_mode: all`)**
- **What it does**: Requires ALL ideal answers to meet the threshold
- **Scoring**: Uses average similarity across all ideal answers
- **When to use**: When response must be similar to all acceptable answers (strict)

```yaml
# Example: All mode for comprehensive answers
all-mode-example:
  class: SemanticSimilarityEval
  args:
    match_mode: all
    threshold: 0.8
    # If ideal: ["Complete", "Finished", "Done"] and model says "Concluded"
    # Calculates: ["Complete": 0.85, "Finished": 0.78, "Done": 0.82]
    # Average: 0.817, but "Finished" < 0.8
    # Result: FAIL (not ALL answers above threshold)
```

---

## 🔧 Embeddings Providers

### **🌐 OpenAI Embeddings (Recommended)**

```yaml
args:
  embeddings_provider: openai
  embeddings_model: text-embedding-3-small  # Faster, cheaper
  # OR
  embeddings_model: text-embedding-3-large  # More accurate, expensive
```

**Pros:**
- ✅ High accuracy and quality
- ✅ Supports multiple languages
- ✅ Consistent results
- ✅ Regular model updates

**Cons:**
- ❌ Requires API key and internet
- ❌ Costs money per token
- ❌ Rate limits apply

**Pricing (approximate):**
- `text-embedding-3-small`: ~$0.00002 per 1K tokens
- `text-embedding-3-large`: ~$0.00013 per 1K tokens

### **💻 Local Embeddings (Free)**

```yaml
args:
  embeddings_provider: local
  embeddings_model: all-MiniLM-L6-v2  # Mock model name
```

**Pros:**
- ✅ No API costs
- ✅ No internet required
- ✅ Complete privacy
- ✅ No rate limits

**Cons:**
- ❌ Mock implementation (not production-ready)
- ❌ Lower accuracy than OpenAI
- ❌ Limited language support

**Note**: The local provider currently uses a mock implementation. For production, integrate with libraries like `sentence-transformers` or `@tensorflow/tfjs`.

---

## 📝 Dataset Examples

### **Basic Facts Dataset**
```json
{"input": [...], "ideal": "Paris"}
{"input": [...], "ideal": "Blue"}
{"input": [...], "ideal": "Seven days"}
```
**Use case**: Simple factual questions where answers might be phrased differently.

### **Multiple Answers Dataset**
```json
{"input": [...], "ideal": ["Hello", "Hi", "Hey", "Greetings"]}
{"input": [...], "ideal": ["Python", "JavaScript", "Java", "TypeScript"]}
```
**Use case**: Questions with multiple correct answers.

### **Creative Writing Dataset**
```json
{"input": [...], "ideal": "Gentle drops from cloudy skies, washing earth with nature's cries"}
{"input": [...], "ideal": "Ancient trees with silver bark stretch toward starlit sky"}
```
**Use case**: Creative tasks where exact matching would be too strict.

### **Question Answering Dataset**
```json
{"input": [...], "ideal": "Photosynthesis is the process by which plants convert sunlight into glucose"}
{"input": [...], "ideal": "Tides are caused by gravitational pull of the moon and sun"}
```
**Use case**: Explanatory answers that could be phrased many ways.

### **Translation Dataset**
```json
{"input": [...], "ideal": "Hola, ¿cómo estás?"}
{"input": [...], "ideal": "Merci beaucoup"}
```
**Use case**: Translation evaluation where multiple correct translations exist.

---

## 💡 Use Cases

### **🎨 Creative Tasks**
```bash
# Poetry, storytelling, creative writing
npx ts-node src/cli.ts gpt-4 semantic-creative --max-samples 10

# Lower threshold for creative freedom
threshold: 0.65  # More lenient for creative tasks
```

### **❓ Question Answering**
```bash
# Complex explanatory answers
npx ts-node src/cli.ts gpt-3.5-turbo semantic-qa --max-samples 20

# Higher threshold for accuracy
threshold: 0.85  # Stricter for factual accuracy
```

### **🌍 Translation Evaluation**
```bash
# Multi-language translation quality
npx ts-node src/cli.ts gpt-4 semantic-translation --max-samples 15

# Use large embedding model for better multilingual support
embeddings_model: text-embedding-3-large
```

### **🎓 Educational Content**
```bash
# Student answer evaluation
npx ts-node src/cli.ts claude-3-sonnet semantic-education --max-samples 25

# Moderate threshold for partial credit
threshold: 0.7
match_mode: threshold  # Give credit for any acceptable answer
```

### **💬 Conversational AI**
```bash
# Chat response quality
npx ts-node src/cli.ts gpt-3.5-turbo semantic-conversation --max-samples 30

# Multiple acceptable conversation responses
match_mode: best
```

---

## 📈 Performance Tips

### **🚄 Speed Optimization**

```yaml
# Enable caching for repeated evaluations
cache_embeddings: true

# Use smaller, faster embedding model
embeddings_model: text-embedding-3-small

# Batch process similar evaluations together
```

### **💰 Cost Optimization**

```yaml
# Use local embeddings for development
embeddings_provider: local

# Use smaller embedding model
embeddings_model: text-embedding-3-small  # vs text-embedding-3-large

# Cache embeddings to avoid re-computation
cache_embeddings: true
```

### **📊 Accuracy Optimization**

```yaml
# Use larger embedding model for better accuracy
embeddings_model: text-embedding-3-large

# Adjust threshold based on your use case
threshold: 0.9   # Strict for factual accuracy
threshold: 0.6   # Lenient for creative tasks

# Choose appropriate match mode
match_mode: best      # For multiple correct answers
match_mode: all       # For comprehensive requirements
```

---

## 🔧 Troubleshooting

### **Common Issues**

#### **❌ "OpenAI API key not found"**
```bash
# Solution: Set your OpenAI API key
export OPENAI_API_KEY="sk-your-key-here"
# Or use local embeddings
embeddings_provider: local
```

#### **❌ "Similarity scores too low"**
```bash
# Solutions:
# 1. Lower the threshold
threshold: 0.7  # Instead of 0.8 or 0.9

# 2. Check your ideal answers are representative
ideal: "Paris"  # Good
ideal: "The capital city of France is Paris, which is located..."  # Too specific

# 3. Use better embedding model
embeddings_model: text-embedding-3-large
```

#### **❌ "Evaluation too slow"**
```bash
# Solutions:
# 1. Enable caching
cache_embeddings: true

# 2. Use faster embedding model
embeddings_model: text-embedding-3-small

# 3. Reduce sample size for testing
--max-samples 10
```

#### **❌ "Rate limit exceeded"**
```bash
# Solutions:
# 1. Add delays between requests (automatic in framework)
# 2. Use local embeddings for development
# 3. Upgrade your OpenAI plan
```

### **Debugging Tips**

#### **Check Similarity Scores**
```bash
# Use verbose mode to see individual similarity scores
npx ts-node src/cli.ts gpt-4 semantic-basic --verbose --max-samples 3

# Output shows:
# Sample 1: Similarity: 0.8542 (threshold: 0.8) ✅ PASS
```

#### **Validate Embeddings**
```typescript
// Programmatic debugging
import { SemanticSimilarityService } from './src/embeddings/embeddings-service';

const service = new SemanticSimilarityService();
const result = await service.calculateSimilarity("Hello", "Hi");
console.log(`Similarity: ${result.similarity}`);  // Should be > 0.8
```

#### **Cache Statistics**
```typescript
// Check cache performance
const template = new SemanticSimilarityEval(args);
const stats = template.getCacheStats();
console.log(`Cache size: ${stats.size} entries`);
```

---

## 🎯 Best Practices

### **Threshold Selection**
- **0.9-1.0**: Strict exact meaning (factual Q&A)
- **0.8-0.9**: Good semantic match (standard use)  
- **0.7-0.8**: Moderate similarity (creative tasks)
- **0.6-0.7**: Lenient matching (very creative tasks)

### **Dataset Design**
- Keep ideal answers concise but complete
- Include multiple ideal answers for ambiguous questions
- Test your thresholds with sample data first
- Use representative examples of expected model outputs

### **Cost Management**
- Start with local embeddings for development
- Use caching for repeated evaluations
- Choose appropriate embedding model size
- Monitor token usage with OpenAI embeddings

### **Match Mode Selection**
- `best`: Most common, good for multiple correct answers
- `threshold`: Good for lenient evaluation
- `all`: Good for strict requirements

---

## 🚀 Advanced Usage

### **Custom Similarity Thresholds per Sample**
```typescript
// Advanced: Different thresholds for different types of questions
// (Future enhancement - currently uses global threshold)
```

### **Combining with Other Evaluation Methods**
```yaml
# Use semantic similarity with model grading
combined-eval:
  class: ModelGradedEval
  args:
    grading_prompt: |
      Evaluate semantic similarity AND factual accuracy:
      Question: {input}
      Answer: {completion}
      Expected: {ideal}
      
      Consider both meaning similarity and factual correctness.
```

### **Batch Embedding Precomputation**
```typescript
// Precompute embeddings for large datasets
const template = new SemanticSimilarityEval(args);
await template.precomputeEmbeddings(samples);
// Now evaluations will be faster using cached embeddings
```

---

This semantic similarity feature makes your LLM evaluations much more robust and realistic, allowing you to evaluate meaning rather than just exact text matches! 🎉
