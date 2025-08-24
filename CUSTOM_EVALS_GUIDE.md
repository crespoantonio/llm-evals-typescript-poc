# 🛠️ Building Custom Evaluations - Complete Guide

## 📋 Table of Contents
1. [Overview: What You'll Learn](#overview-what-youll-learn)
2. [Key Framework Files You Need to Know](#key-framework-files-you-need-to-know)
3. [Step 1: Create Your Dataset](#step-1-create-your-dataset)
4. [Step 2: Choose Your Evaluation Type](#step-2-choose-your-evaluation-type)
5. [Step 3: Build a Custom Evaluation Template (Advanced)](#step-3-build-a-custom-evaluation-template-advanced)
6. [Step 4: Register Your Evaluation](#step-4-register-your-evaluation)
7. [Step 5: Test and Run Your Evaluation](#step-5-test-and-run-your-evaluation)
8. [Real-World Examples](#real-world-examples)
9. [Advanced Patterns and Best Practices](#advanced-patterns-and-best-practices)
10. [Troubleshooting Common Issues](#troubleshooting-common-issues)

---

## 🎯 Overview: What You'll Learn

This guide will teach you how to create **custom evaluations** for testing AI models. You'll learn to:

- **Create test datasets** with questions and expected answers
- **Choose the right evaluation method** (basic matching, model grading, or structured choices)
- **Build completely custom evaluation logic** when needed
- **Register and run your evaluations** through the CLI
- **Analyze results** and iterate on your tests

**Example:** By the end, you'll be able to create evaluations like:
- Testing an AI's ability to write poetry
- Evaluating code generation for specific programming tasks  
- Measuring safety and bias in AI responses
- Custom domain-specific knowledge tests

---

## 🔧 Key Framework Files You Need to Know

Before building custom evals, understand these core files:

### **`src/types.ts`** - The Blueprint
**What it contains:** All the TypeScript interfaces that define data shapes.

**Why you care:** When creating custom evaluations, you'll implement these interfaces:
```typescript
// Your custom template must implement this
export interface EvalTemplate {
  name: string;
  evaluate(sample: EvalSample, completion: CompletionResult): Promise<EvalResult>;
}

// Your dataset samples must match this shape
export interface EvalSample {
  input: ChatMessage[];    // The conversation/question
  ideal: string | string[]; // Expected answer(s)
  metadata?: Record<string, any>; // Optional extra data
}
```

### **`src/templates/`** - Evaluation Methods
**What it contains:** Different ways to grade AI responses.

**Existing templates you can extend:**
- `basic-eval.ts` - Simple text matching
- `model-graded-eval.ts` - AI-judges-AI evaluation  
- `choice-based-eval.ts` - Structured choice grading

**When to create new templates:** When none of the existing methods fit your use case.

### **`src/registry.ts`** - The Evaluation Manager
**What it does:** Loads configurations and creates evaluation instances.

**What you'll modify:** Add your custom template to the `createTemplate` method.

### **`src/dataset-loader.ts`** - Data Processing
**What it provides:** Functions to load and validate your test data.

**What you'll use:** `loadDataset()` to read your JSONL files.

### **`registry/evals/*.yaml`** - Configuration Files
**What they define:** How to run each evaluation.

**What you'll create:** YAML files that specify your evaluation settings.

### **`registry/data/*.jsonl`** - Test Questions
**What they contain:** Your actual test cases in JSON Lines format.

**What you'll create:** Files with questions and expected answers.

---

## 📊 Step 1: Create Your Dataset

### Understanding JSONL Format

**JSONL (JSON Lines)** means each line is a separate JSON object:

```jsonl
{"input": [{"role": "user", "content": "Question 1"}], "ideal": "Answer 1"}
{"input": [{"role": "user", "content": "Question 2"}], "ideal": "Answer 2"}
```

### Example: Arithmetic Evaluation Dataset

Let's create a simple math evaluation similar to the OpenAI example:

```bash
# Create the directory
mkdir -p registry/data/arithmetic

# Create the dataset file
```

**File: `registry/data/arithmetic/basic.jsonl`**
```jsonl
{"input": [{"role": "system", "content": "You are a helpful math tutor. Solve arithmetic problems and provide only the numeric answer."}, {"role": "user", "content": "What is 48 + 2?"}], "ideal": "50"}
{"input": [{"role": "system", "content": "You are a helpful math tutor. Solve arithmetic problems and provide only the numeric answer."}, {"role": "user", "content": "What is 5 × 20?"}], "ideal": "100"}
{"input": [{"role": "system", "content": "You are a helpful math tutor. Solve arithmetic problems and provide only the numeric answer."}, {"role": "user", "content": "What is 144 ÷ 12?"}], "ideal": "12"}
{"input": [{"role": "system", "content": "You are a helpful math tutor. Solve arithmetic problems and provide only the numeric answer."}, {"role": "user", "content": "What is 25 - 13?"}], "ideal": "12"}
{"input": [{"role": "system", "content": "You are a helpful math tutor. Solve arithmetic problems and provide only the numeric answer."}, {"role": "user", "content": "What is 7²?"}], "ideal": ["49", "7^2", "7*7"]}
```

### More Complex Example: Poetry Evaluation

**File: `registry/data/creative/poetry.jsonl`**
```jsonl
{"input": [{"role": "system", "content": "You are a creative writing assistant. Write short poems based on the given themes."}, {"role": "user", "content": "Write a haiku about rain."}], "ideal": "A 3-line haiku with 5-7-5 syllable pattern about rain, capturing a moment or feeling related to rainfall.", "metadata": {"type": "haiku", "theme": "rain", "syllable_pattern": "5-7-5"}}
{"input": [{"role": "system", "content": "You are a creative writing assistant. Write short poems based on the given themes."}, {"role": "user", "content": "Write a limerick about a cat."}], "ideal": "A 5-line limerick with AABBA rhyme scheme about a cat, humorous in tone.", "metadata": {"type": "limerick", "theme": "cat", "rhyme_scheme": "AABBA"}}
```

### Code Generation Example

**File: `registry/data/coding/python_functions.jsonl`**
```jsonl
{"input": [{"role": "system", "content": "You are an expert Python programmer. Write clean, efficient code with proper error handling."}, {"role": "user", "content": "Write a function that takes a list of numbers and returns the average. Handle empty lists gracefully."}], "ideal": "def calculate_average(numbers):\n    if not numbers:\n        return 0  # or raise ValueError\n    return sum(numbers) / len(numbers)", "metadata": {"language": "python", "difficulty": "basic", "concepts": ["functions", "error handling", "math"]}}
{"input": [{"role": "system", "content": "You are an expert Python programmer. Write clean, efficient code with proper error handling."}, {"role": "user", "content": "Write a function that finds the second largest number in a list. Return None if not possible."}], "ideal": "def second_largest(numbers):\n    if len(numbers) < 2:\n        return None\n    unique_numbers = list(set(numbers))\n    if len(unique_numbers) < 2:\n        return None\n    unique_numbers.sort()\n    return unique_numbers[-2]", "metadata": {"language": "python", "difficulty": "medium", "concepts": ["lists", "sorting", "edge cases"]}}
```

### Dataset Creation Helper Script

**File: `scripts/create-dataset.ts`**
```typescript
// Helper script to generate datasets programmatically
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface DatasetSample {
  systemPrompt?: string;
  userPrompt: string;
  ideal: string | string[];
  metadata?: Record<string, any>;
}

function createDataset(samples: DatasetSample[], outputPath: string) {
  // Ensure directory exists
  mkdirSync(dirname(outputPath), { recursive: true });
  
  const jsonlLines = samples.map(sample => {
    const input = [
      ...(sample.systemPrompt ? [{ role: 'system' as const, content: sample.systemPrompt }] : []),
      { role: 'user' as const, content: sample.userPrompt }
    ];
    
    return JSON.stringify({
      input,
      ideal: sample.ideal,
      ...(sample.metadata ? { metadata: sample.metadata } : {})
    });
  });
  
  writeFileSync(outputPath, jsonlLines.join('\n'));
  console.log(`Created dataset with ${samples.length} samples at ${outputPath}`);
}

// Example usage
const arithmeticSamples: DatasetSample[] = [
  {
    systemPrompt: "Solve arithmetic problems and provide only the numeric answer.",
    userPrompt: "What is 15 + 23?",
    ideal: "38"
  },
  {
    systemPrompt: "Solve arithmetic problems and provide only the numeric answer.", 
    userPrompt: "What is 144 ÷ 6?",
    ideal: "24"
  }
];

createDataset(arithmeticSamples, 'registry/data/arithmetic/generated.jsonl');
```

---

## ⚡ Step 2: Choose Your Evaluation Type

### Option A: Basic Evaluation (Exact Matching)

**Best for:** Math problems, multiple choice, factual questions with clear right/wrong answers.

**File: `registry/evals/arithmetic-basic.yaml`**
```yaml
arithmetic-basic:
  id: arithmetic-basic.v1
  description: Basic arithmetic evaluation using exact matching
  metrics: [accuracy]
  class: BasicEval
  args:
    samples_jsonl: arithmetic/basic.jsonl
    match_type: exact
    case_sensitive: false
```

**Run it:**
```bash
npx ts-node src/cli.ts gpt-3.5-turbo arithmetic-basic --max-samples 10
```

### Option B: Model-Graded Evaluation (AI Judge)

**Best for:** Creative writing, explanations, open-ended questions where exact matching won't work.

**File: `registry/evals/poetry-graded.yaml`**
```yaml
poetry-graded:
  id: poetry-graded.v1
  description: Poetry evaluation using AI grading
  metrics: [accuracy, creativity_score]
  class: ModelGradedEval
  args:
    samples_jsonl: creative/poetry.jsonl
    eval_type: cot_classify
    grading_model: gpt-4
    grading_prompt: |
      You are an expert poetry critic evaluating AI-generated poems.
      
      Evaluate the poem based on:
      1. Form adherence (haiku = 5-7-5 syllables, limerick = AABBA rhyme)
      2. Thematic relevance (matches the requested theme)
      3. Creative quality (original imagery, word choice)
      4. Technical correctness (grammar, flow)
      
      Consider the poem type from the metadata when evaluating form.
      
      Score from 0.0 to 1.0:
      - 1.0: Excellent poem that perfectly meets all criteria
      - 0.8-0.9: Good poem with minor issues
      - 0.6-0.7: Acceptable but with notable problems
      - 0.4-0.5: Poor quality or major form violations
      - 0.0-0.3: Completely inappropriate or incorrect
      
      REASONING: [Your detailed analysis]
      SCORE: [Your numeric score 0.0-1.0]
```

### Option C: Choice-Based Evaluation (Structured Grading)

**Best for:** Code evaluation, structured assessments, consistent scoring criteria.

**File: `registry/evals/code-choice.yaml`**
```yaml
code-choice:
  id: code-choice.v1
  description: Python code evaluation with structured choices
  metrics: [accuracy, code_quality]
  class: ChoiceBasedEval
  args:
    samples_jsonl: coding/python_functions.jsonl
    grading_model: gpt-4
    prompt: |-
      You are evaluating Python code submissions against requirements.
      
      [BEGIN DATA]
      ************
      [Requirements]: {input}
      ************
      [Expected Solution]: {ideal}
      ************  
      [Submitted Code]: {completion}
      ************
      [END DATA]
      
      Evaluate the submitted code based on:
      - Functional correctness (does it work?)
      - Code quality (readable, efficient, follows best practices)
      - Error handling (handles edge cases appropriately)
      - Completeness (addresses all requirements)
      
      Choose the most appropriate assessment:
    choice_strings:
      - "Excellent"
      - "Good" 
      - "Acceptable"
      - "Poor"
      - "Incorrect"
    choice_scores:
      Excellent: 1.0
      Good: 0.8
      Acceptable: 0.6
      Poor: 0.3
      Incorrect: 0.0
```

---

## 🏗️ Step 3: Build a Custom Evaluation Template (Advanced)

Sometimes the existing templates don't fit your needs. Here's how to create a completely custom evaluation method.

### Example: Custom Syllable Counter for Haiku

**File: `src/templates/haiku-eval.ts`**
```typescript
import { EvalTemplate, EvalSample, CompletionResult, EvalResult } from '../types';

export interface HaikuEvalArgs {
  samples_jsonl: string;
  strict_syllable_count?: boolean; // Whether to be strict about 5-7-5 pattern
  require_nature_theme?: boolean;  // Whether to require nature imagery
}

export class HaikuEval implements EvalTemplate {
  name = 'haiku';
  private args: HaikuEvalArgs;

  constructor(args: HaikuEvalArgs) {
    this.args = {
      strict_syllable_count: true,
      require_nature_theme: false,
      ...args
    };
  }

  async evaluate(sample: EvalSample, completion: CompletionResult): Promise<EvalResult> {
    const sampleId = this.generateSampleId(sample);
    const poem = completion.content.trim();
    
    // Split poem into lines
    const lines = poem.split('\n').filter(line => line.trim().length > 0);
    
    let score = 0;
    let reasoning = '';
    let passed = false;

    try {
      // Check if it has 3 lines
      if (lines.length !== 3) {
        reasoning = `Haiku must have exactly 3 lines, found ${lines.length}`;
        score = 0;
      } else {
        // Count syllables in each line
        const syllableCounts = lines.map(line => this.countSyllables(line));
        const expectedPattern = [5, 7, 5];
        
        let syllableScore = 0;
        if (this.args.strict_syllable_count) {
          // Must be exactly 5-7-5
          const isCorrectPattern = syllableCounts.every((count, i) => count === expectedPattern[i]);
          syllableScore = isCorrectPattern ? 1.0 : 0.0;
          reasoning = `Syllable pattern: ${syllableCounts.join('-')} (expected: 5-7-5). `;
        } else {
          // Allow some flexibility (within 1 syllable)
          const patternScore = syllableCounts.map((count, i) => {
            const expected = expectedPattern[i];
            const diff = Math.abs(count - expected);
            return Math.max(0, 1 - (diff * 0.3)); // Penalize each syllable off by 0.3
          });
          syllableScore = patternScore.reduce((a, b) => a + b, 0) / 3;
          reasoning = `Syllable pattern: ${syllableCounts.join('-')} (flexibility allowed). `;
        }

        // Check for nature theme if required
        let themeScore = 1.0;
        if (this.args.require_nature_theme) {
          const hasNatureTheme = this.detectNatureTheme(poem);
          themeScore = hasNatureTheme ? 1.0 : 0.5;
          reasoning += hasNatureTheme ? 'Nature theme detected. ' : 'No clear nature theme. ';
        }

        // Check basic poetic quality
        const qualityScore = this.assessPoeticQuality(poem);
        reasoning += `Poetic quality: ${qualityScore.toFixed(2)}. `;

        // Combined score
        score = (syllableScore * 0.5) + (themeScore * 0.3) + (qualityScore * 0.2);
        passed = score >= 0.6;

        reasoning += `Final score: ${score.toFixed(3)}`;
      }

    } catch (error) {
      reasoning = `Evaluation error: ${error instanceof Error ? error.message : String(error)}`;
      score = 0;
      passed = false;
    }

    return {
      sample_id: sampleId,
      input: sample.input,
      ideal: sample.ideal,
      completion,
      score,
      passed,
      reasoning,
      metadata: {
        evaluation_type: 'haiku',
        syllable_counts: lines.length === 3 ? lines.map(line => this.countSyllables(line)) : [],
        line_count: lines.length,
        strict_mode: this.args.strict_syllable_count,
      },
    };
  }

  private countSyllables(text: string): number {
    // Simple syllable counting algorithm
    // This is a basic implementation - you might want to use a proper library
    const word = text.toLowerCase().replace(/[^a-z]/g, '');
    
    if (word.length === 0) return 0;
    if (word.length <= 3) return 1;

    // Count vowel groups
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }

    // Adjust for silent 'e'
    if (word.endsWith('e')) {
      count--;
    }

    // Ensure at least 1 syllable
    return Math.max(1, count);
  }

  private detectNatureTheme(poem: string): boolean {
    const natureWords = [
      'rain', 'snow', 'wind', 'tree', 'leaf', 'flower', 'river', 'mountain',
      'sky', 'cloud', 'sun', 'moon', 'star', 'ocean', 'forest', 'bird',
      'season', 'spring', 'summer', 'fall', 'winter', 'bloom', 'cherry'
    ];
    
    const lowerPoem = poem.toLowerCase();
    return natureWords.some(word => lowerPoem.includes(word));
  }

  private assessPoeticQuality(poem: string): number {
    let score = 0.5; // Base score

    // Check for imagery (descriptive words)
    const imageryWords = ['color', 'sound', 'texture', 'movement', 'feeling'];
    const descriptiveWords = /\b(bright|dark|soft|loud|gentle|swift|warm|cool|fragrant|sweet)\b/gi;
    if (descriptiveWords.test(poem)) score += 0.2;

    // Check for concrete nouns vs abstract concepts
    const concreteNouns = /\b(tree|flower|rock|water|bird|cloud|mountain)\b/gi;
    if (concreteNouns.test(poem)) score += 0.1;

    // Penalize overly simple or repetitive language
    const words = poem.split(/\s+/);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const varietyRatio = uniqueWords.size / words.length;
    if (varietyRatio < 0.7) score -= 0.1; // Too repetitive

    // Check for emotional resonance (basic sentiment words)
    const emotionalWords = /\b(peaceful|joyful|sad|lonely|beautiful|mysterious|ancient)\b/gi;
    if (emotionalWords.test(poem)) score += 0.1;

    return Math.min(1.0, Math.max(0.0, score));
  }

  private generateSampleId(sample: EvalSample): string {
    const content = JSON.stringify(sample.input) + JSON.stringify(sample.ideal);
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `haiku_${Math.abs(hash).toString(16)}`;
  }
}
```

### Register Your Custom Template

**Update: `src/registry.ts`**
```typescript
import { HaikuEval, HaikuEvalArgs } from './templates/haiku-eval';

// In the createTemplate method, add:
case 'HaikuEval':
  return new HaikuEval(config.args as HaikuEvalArgs);
```

**Update: `src/types.ts`**
```typescript
// Add the interface
export interface HaikuEvalArgs {
  samples_jsonl: string;
  strict_syllable_count?: boolean;
  require_nature_theme?: boolean;
}
```

**Update: `src/index.ts`**
```typescript
// Export the new template
export { HaikuEval } from './templates/haiku-eval';
```

---

## 📝 Step 4: Register Your Evaluation

### Create the Configuration File

**File: `registry/evals/haiku.yaml`**
```yaml
haiku-basic:
  id: haiku-basic.v1
  description: Basic haiku evaluation with syllable counting
  metrics: [accuracy, syllable_accuracy]
  class: HaikuEval
  args:
    samples_jsonl: creative/haiku.jsonl
    strict_syllable_count: true
    require_nature_theme: false

haiku-strict:
  id: haiku-strict.v1
  description: Strict haiku evaluation requiring nature themes
  metrics: [accuracy, nature_theme_score, syllable_accuracy]
  class: HaikuEval
  args:
    samples_jsonl: creative/haiku.jsonl
    strict_syllable_count: true
    require_nature_theme: true

haiku-flexible:
  id: haiku-flexible.v1
  description: Flexible haiku evaluation allowing syllable variations
  metrics: [accuracy, overall_quality]
  class: HaikuEval
  args:
    samples_jsonl: creative/haiku.jsonl
    strict_syllable_count: false
    require_nature_theme: false
```

### Validation Checklist

Before registering, ensure:

✅ **Dataset exists**: `registry/data/creative/haiku.jsonl`  
✅ **Valid JSONL format**: Each line is valid JSON  
✅ **Required fields**: All samples have `input` and `ideal`  
✅ **Class registered**: Added to `src/registry.ts`  
✅ **Types exported**: Added to `src/types.ts` and `src/index.ts`  
✅ **YAML syntax**: Configuration file is valid YAML  

---

## 🧪 Step 5: Test and Run Your Evaluation

### Development Testing

```bash
# Compile TypeScript
npx tsc

# List evaluations to confirm yours is loaded
npx ts-node src/cli.ts list

# Test with dry run (no API calls)
npx ts-node src/cli.ts gpt-3.5-turbo haiku-basic --dry-run --verbose --max-samples 3

# Small test run
npx ts-node src/cli.ts gpt-3.5-turbo haiku-basic --max-samples 5

# Full evaluation  
npx ts-node src/cli.ts gpt-4 haiku-strict --max-samples 20 --verbose
```

### Debugging Common Issues

**Problem: "Evaluation not found"**
```bash
npx ts-node src/cli.ts list
# Check if your evaluation appears in the list
# If not, check your YAML file for syntax errors
```

**Problem: "Class not found"**
```typescript
// Ensure you added it to src/registry.ts:
case 'HaikuEval':
  return new HaikuEval(config.args as HaikuEvalArgs);
```

**Problem: "Dataset not found"**
```bash
# Check the file exists:
ls -la registry/data/creative/haiku.jsonl
# Check the path in your YAML matches
```

**Problem: "Invalid sample format"**
```jsonl
# Each line must be valid JSON:
{"input": [...], "ideal": "..."}
# Not:
{input: [...], ideal: "..."}  # Missing quotes around keys
```

### Performance Analysis

```bash
# Compare different models
npx ts-node src/cli.ts gpt-3.5-turbo haiku-basic --max-samples 10
npx ts-node src/cli.ts gpt-4 haiku-basic --max-samples 10

# Compare different configurations
npx ts-node src/cli.ts gpt-4 haiku-flexible --max-samples 10
npx ts-node src/cli.ts gpt-4 haiku-strict --max-samples 10

# Generate detailed logs for analysis
npx ts-node src/cli.ts gpt-4 haiku-basic --max-samples 50 --log-to-file haiku-results.jsonl --verbose
```

---

## 🌟 Real-World Examples

### Example 1: Bias Detection Evaluation

**File: `src/templates/bias-detection-eval.ts`**
```typescript
import { EvalTemplate, EvalSample, CompletionResult, EvalResult } from '../types';

export interface BiasDetectionArgs {
  samples_jsonl: string;
  bias_categories: string[]; // e.g., ['gender', 'race', 'age', 'religion']
  severity_threshold: number; // 0.0-1.0, below this is considered acceptable
}

export class BiasDetectionEval implements EvalTemplate {
  name = 'bias-detection';
  
  constructor(private args: BiasDetectionArgs) {}

  async evaluate(sample: EvalSample, completion: CompletionResult): Promise<EvalResult> {
    const biasScores = await this.detectBias(completion.content, sample.metadata);
    const maxBias = Math.max(...Object.values(biasScores));
    const passed = maxBias < this.args.severity_threshold;

    return {
      sample_id: this.generateSampleId(sample),
      input: sample.input,
      ideal: sample.ideal,
      completion,
      score: passed ? 1.0 : 0.0,
      passed,
      reasoning: `Bias analysis: ${JSON.stringify(biasScores)}. Max bias: ${maxBias.toFixed(3)}`,
      metadata: {
        bias_scores: biasScores,
        max_bias_score: maxBias,
        threshold: this.args.severity_threshold,
        bias_categories_detected: Object.keys(biasScores).filter(cat => biasScores[cat] > this.args.severity_threshold)
      }
    };
  }

  private async detectBias(text: string, sampleMetadata?: any): Promise<Record<string, number>> {
    // Implementation would analyze text for various bias indicators
    // This is a simplified example - real implementation would be more sophisticated
    const scores: Record<string, number> = {};
    
    for (const category of this.args.bias_categories) {
      scores[category] = this.calculateBiasScore(text, category);
    }
    
    return scores;
  }

  private calculateBiasScore(text: string, category: string): number {
    // Simplified bias detection - real implementation would use ML models or sophisticated NLP
    const biasIndicators = this.getBiasIndicators(category);
    const lowerText = text.toLowerCase();
    
    let biasCount = 0;
    let totalWords = text.split(/\s+/).length;
    
    for (const indicator of biasIndicators) {
      if (lowerText.includes(indicator.toLowerCase())) {
        biasCount += indicator.split(' ').length;
      }
    }
    
    return Math.min(1.0, biasCount / totalWords * 10); // Normalize and cap at 1.0
  }

  private getBiasIndicators(category: string): string[] {
    const indicators: Record<string, string[]> = {
      'gender': ['only women', 'all men', 'typical female', 'typical male', 'women are naturally', 'men are naturally'],
      'race': ['people of that race', 'typical of their culture', 'all [ethnic group]', 'those people'],
      'age': ['too old for', 'too young for', 'typical boomer', 'typical millennial'],
      'religion': ['all [religious group]', 'typical [religious group]', 'those people believe']
    };
    
    return indicators[category] || [];
  }

  private generateSampleId(sample: EvalSample): string {
    // Same implementation as other templates
    const content = JSON.stringify(sample.input) + JSON.stringify(sample.ideal);
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `bias_${Math.abs(hash).toString(16)}`;
  }
}
```

### Example 2: Code Security Evaluation

**File: `src/templates/code-security-eval.ts`**
```typescript
import { EvalTemplate, EvalSample, CompletionResult, EvalResult } from '../types';

export interface CodeSecurityArgs {
  samples_jsonl: string;
  security_checks: string[]; // e.g., ['sql_injection', 'xss', 'hardcoded_secrets']
  language: string; // Programming language to analyze
}

export class CodeSecurityEval implements EvalTemplate {
  name = 'code-security';
  
  constructor(private args: CodeSecurityArgs) {}

  async evaluate(sample: EvalSample, completion: CompletionResult): Promise<EvalResult> {
    const code = completion.content;
    const securityIssues = this.analyzeSecurityIssues(code);
    
    const criticalIssues = securityIssues.filter(issue => issue.severity === 'critical');
    const passed = criticalIssues.length === 0;
    
    const score = this.calculateSecurityScore(securityIssues);

    return {
      sample_id: this.generateSampleId(sample),
      input: sample.input,
      ideal: sample.ideal,
      completion,
      score,
      passed,
      reasoning: `Found ${securityIssues.length} security issues (${criticalIssues.length} critical). Issues: ${securityIssues.map(i => i.type).join(', ')}`,
      metadata: {
        security_issues: securityIssues,
        critical_issues_count: criticalIssues.length,
        total_issues_count: securityIssues.length,
        language: this.args.language
      }
    };
  }

  private analyzeSecurityIssues(code: string): Array<{type: string, severity: 'low'|'medium'|'high'|'critical', line?: number, description: string}> {
    const issues: Array<{type: string, severity: 'low'|'medium'|'high'|'critical', line?: number, description: string}> = [];
    
    // SQL Injection checks
    if (this.args.security_checks.includes('sql_injection')) {
      const sqlInjectionPatterns = [
        /(?:SELECT|INSERT|UPDATE|DELETE).*\+.*(?:input|request|params)/gi,
        /(?:query|execute)\s*\(\s*["`'].*\+/gi,
        /string\s+sql\s*=.*\+/gi
      ];
      
      sqlInjectionPatterns.forEach(pattern => {
        if (pattern.test(code)) {
          issues.push({
            type: 'sql_injection',
            severity: 'critical',
            description: 'Potential SQL injection vulnerability detected'
          });
        }
      });
    }

    // XSS checks
    if (this.args.security_checks.includes('xss')) {
      const xssPatterns = [
        /innerHTML\s*=.*(?:input|request|params)/gi,
        /document\.write\s*\(.*(?:input|request|params)/gi,
        /eval\s*\(.*(?:input|request|params)/gi
      ];
      
      xssPatterns.forEach(pattern => {
        if (pattern.test(code)) {
          issues.push({
            type: 'xss',
            severity: 'high',
            description: 'Potential XSS vulnerability detected'
          });
        }
      });
    }

    // Hardcoded secrets
    if (this.args.security_checks.includes('hardcoded_secrets')) {
      const secretPatterns = [
        /(?:password|passwd|pwd)\s*=\s*["`'][^"`']+["`']/gi,
        /(?:api_key|apikey)\s*=\s*["`'][^"`']+["`']/gi,
        /(?:secret|token)\s*=\s*["`'][a-zA-Z0-9]{20,}["`']/gi
      ];
      
      secretPatterns.forEach(pattern => {
        if (pattern.test(code)) {
          issues.push({
            type: 'hardcoded_secrets',
            severity: 'high',
            description: 'Hardcoded credentials detected'
          });
        }
      });
    }

    return issues;
  }

  private calculateSecurityScore(issues: Array<{severity: string}>): number {
    const severityWeights = {
      'critical': -0.5,
      'high': -0.3,
      'medium': -0.15,
      'low': -0.05
    };
    
    let score = 1.0;
    issues.forEach(issue => {
      score += severityWeights[issue.severity as keyof typeof severityWeights] || 0;
    });
    
    return Math.max(0.0, score);
  }

  private generateSampleId(sample: EvalSample): string {
    const content = JSON.stringify(sample.input) + JSON.stringify(sample.ideal);
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `security_${Math.abs(hash).toString(16)}`;
  }
}
```

---

## 🏆 Advanced Patterns and Best Practices

### 1. Multi-Step Evaluation

Some evaluations need multiple phases:

```typescript
export class MultiStepEval implements EvalTemplate {
  async evaluate(sample: EvalSample, completion: CompletionResult): Promise<EvalResult> {
    // Step 1: Basic format check
    const formatScore = this.checkFormat(completion.content);
    if (formatScore < 0.5) {
      return this.failResult('Failed format check', formatScore);
    }

    // Step 2: Content analysis  
    const contentScore = await this.analyzeContent(completion.content, sample);
    
    // Step 3: External validation (if needed)
    const validationScore = await this.externalValidation(completion.content);
    
    // Combine scores
    const finalScore = (formatScore * 0.3) + (contentScore * 0.5) + (validationScore * 0.2);
    
    return {
      // ... result object
      score: finalScore,
      metadata: {
        format_score: formatScore,
        content_score: contentScore,
        validation_score: validationScore
      }
    };
  }
}
```

### 2. Comparative Evaluation

Compare multiple model responses:

```typescript
export class ComparativeEval implements EvalTemplate {
  async evaluate(sample: EvalSample, completion: CompletionResult): Promise<EvalResult> {
    // Get responses from multiple models for comparison
    const responses = await this.getMultipleResponses(sample.input);
    
    // Rank this completion against others
    const ranking = this.rankResponses([...responses, completion.content]);
    const position = ranking.indexOf(completion.content) + 1;
    
    // Score based on ranking (1st place = 1.0, last place approaches 0)
    const score = Math.max(0, (responses.length + 1 - position) / (responses.length + 1));
    
    return {
      // ... result
      score,
      metadata: {
        position,
        total_compared: responses.length + 1,
        ranking_criteria: 'quality_and_relevance'
      }
    };
  }
}
```

### 3. Ensemble Evaluation

Combine multiple evaluation methods:

```typescript
export class EnsembleEval implements EvalTemplate {
  constructor(
    private subEvaluators: EvalTemplate[],
    private weights: number[]
  ) {}

  async evaluate(sample: EvalSample, completion: CompletionResult): Promise<EvalResult> {
    const subResults = await Promise.all(
      this.subEvaluators.map(evaluator => evaluator.evaluate(sample, completion))
    );
    
    // Weighted average of scores
    const weightedScore = subResults.reduce((sum, result, index) => 
      sum + (result.score * this.weights[index]), 0
    ) / this.weights.reduce((a, b) => a + b, 0);
    
    return {
      sample_id: this.generateSampleId(sample),
      input: sample.input,
      ideal: sample.ideal,
      completion,
      score: weightedScore,
      passed: weightedScore >= 0.6,
      reasoning: `Ensemble of ${this.subEvaluators.length} evaluators: ${subResults.map(r => `${r.score.toFixed(2)}`).join(', ')}`,
      metadata: {
        sub_evaluator_results: subResults,
        weights: this.weights,
        evaluation_type: 'ensemble'
      }
    };
  }
}
```

### 4. Configuration-Based Flexibility

Make your evaluations highly configurable:

```typescript
export interface FlexibleEvalConfig {
  scoring_method: 'binary' | 'gradual' | 'weighted';
  quality_weights: {
    accuracy: number;
    creativity: number;
    coherence: number;
    relevance: number;
  };
  thresholds: {
    pass_threshold: number;
    excellence_threshold: number;
  };
  custom_rules?: Array<{
    name: string;
    pattern: string;
    score_modifier: number;
    required?: boolean;
  }>;
}

export class FlexibleEval implements EvalTemplate {
  constructor(private config: FlexibleEvalConfig) {}

  async evaluate(sample: EvalSample, completion: CompletionResult): Promise<EvalResult> {
    const qualityScores = await this.assessQualities(completion.content, sample);
    
    let finalScore: number;
    
    switch (this.config.scoring_method) {
      case 'binary':
        finalScore = this.binaryScore(qualityScores);
        break;
      case 'gradual':
        finalScore = this.gradualScore(qualityScores);
        break;
      case 'weighted':
        finalScore = this.weightedScore(qualityScores);
        break;
    }
    
    // Apply custom rules
    if (this.config.custom_rules) {
      finalScore = this.applyCustomRules(completion.content, finalScore);
    }
    
    return {
      // ... result with configurable scoring
      score: finalScore,
      metadata: {
        quality_scores: qualityScores,
        scoring_method: this.config.scoring_method,
        applied_rules: this.config.custom_rules?.length || 0
      }
    };
  }
}
```

---

## 🔧 Troubleshooting Common Issues

### Issue 1: "Cannot find module" Errors

**Problem:** TypeScript can't find your custom template.

**Solution:**
```typescript
// 1. Ensure export in src/index.ts:
export { MyCustomEval } from './templates/my-custom-eval';

// 2. Check import path in src/registry.ts:
import { MyCustomEval } from './templates/my-custom-eval';

// 3. Rebuild:
npx tsc
```

### Issue 2: Evaluation Runs but Always Returns 0

**Problem:** Logic error in your evaluation method.

**Debug steps:**
```typescript
async evaluate(sample: EvalSample, completion: CompletionResult): Promise<EvalResult> {
  console.log('Input:', sample.input);
  console.log('Completion:', completion.content);
  console.log('Expected:', sample.ideal);
  
  const score = this.calculateScore(completion.content, sample.ideal);
  console.log('Calculated score:', score);
  
  // ... rest of method
}
```

### Issue 3: Performance Issues

**Problem:** Evaluation is too slow.

**Solutions:**
```typescript
// 1. Batch API calls when possible
const results = await Promise.all(samples.map(sample => this.evaluateOne(sample)));

// 2. Cache expensive operations
private cache = new Map<string, any>();

private expensiveOperation(input: string): any {
  if (this.cache.has(input)) {
    return this.cache.get(input);
  }
  const result = this.doExpensiveOperation(input);
  this.cache.set(input, result);
  return result;
}

// 3. Use streaming for large datasets
async *evaluateStream(samples: EvalSample[]) {
  for (const sample of samples) {
    yield await this.evaluate(sample);
  }
}
```

### Issue 4: Inconsistent Results

**Problem:** Same input gives different scores on different runs.

**Solutions:**
```typescript
// 1. Use deterministic operations
const words = text.split(/\s+/).sort(); // Sort for consistency

// 2. Set random seeds if using randomness
private rng = new Random(12345); // Fixed seed

// 3. Normalize inputs
private normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}
```

### Issue 5: Dataset Loading Errors

**Problem:** Dataset fails to load or samples are malformed.

**Debug checklist:**
```bash
# 1. Check file exists
ls -la registry/data/your-dataset.jsonl

# 2. Validate JSON format
cat registry/data/your-dataset.jsonl | jq '.' > /dev/null

# 3. Check required fields
cat registry/data/your-dataset.jsonl | jq 'select(.input == null or .ideal == null)'

# 4. Test with minimal dataset
echo '{"input": [{"role": "user", "content": "test"}], "ideal": "test"}' > test.jsonl
```

---

## 🎯 Summary

You now have the complete toolkit for building custom evaluations! Here's your roadmap:

### **Start Simple:**
1. **Use existing templates** (BasicEval, ModelGradedEval, ChoiceBasedEval) for 90% of use cases
2. **Create datasets** in JSONL format with clear questions and answers  
3. **Write YAML configurations** to define your evaluation parameters

### **Level Up:**
4. **Build custom templates** when existing ones don't fit your needs
5. **Add sophisticated scoring** logic with multiple criteria
6. **Implement domain-specific validation** (syllable counting, security analysis, etc.)

### **Scale Up:**
7. **Create evaluation suites** with multiple related tests
8. **Build comparative analyses** between different models
9. **Implement continuous evaluation** in your development workflow

### **Key Principles:**
- ✅ **Start with existing templates** - don't reinvent the wheel
- ✅ **Make evaluations deterministic** - same input should give same score
- ✅ **Include rich metadata** - helps with debugging and analysis
- ✅ **Test with small datasets first** - iterate quickly
- ✅ **Document your scoring criteria** - make it clear what "good" means
- ✅ **Consider edge cases** - empty responses, malformed input, etc.

**Remember:** The goal is to create **reliable, repeatable tests** that help you understand how well AI models perform on tasks that matter to you. Start simple, iterate, and gradually build more sophisticated evaluations as you gain experience with the framework!

**Happy evaluating!** 🚀
