/**
 * Basic evaluation template with deterministic matching
 */

import { EvalTemplate, EvalSample, CompletionResult, EvalResult, BasicEvalArgs } from '../types';

export class BasicEval implements EvalTemplate {
  name = 'basic';
  private args: BasicEvalArgs;

  constructor(args: BasicEvalArgs) {
    this.args = {
      match_type: 'exact',
      case_sensitive: true,
      ...args,
    };
  }

  async evaluate(sample: EvalSample, completion: CompletionResult): Promise<EvalResult> {
    const sampleId = this.generateSampleId(sample);
    const cleanedCompletion = this.cleanText(completion.content);
    
    let passed = false;
    let score = 0;
    let reasoning = '';

    // Handle both string and array ideal answers
    const idealAnswers = Array.isArray(sample.ideal) ? sample.ideal : [sample.ideal];
    
    for (const ideal of idealAnswers) {
      const cleanedIdeal = this.cleanText(ideal);
      
      if (this.matchTexts(cleanedCompletion, cleanedIdeal)) {
        passed = true;
        score = 1;
        reasoning = `Matched ideal answer: "${ideal}"`;
        break;
      }
    }

    if (!passed) {
      reasoning = `No match found. Expected one of: ${JSON.stringify(idealAnswers)}. Got: "${completion.content}"`;
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
        match_type: this.args.match_type,
        case_sensitive: this.args.case_sensitive,
      },
    };
  }

  private matchTexts(actual: string, expected: string): boolean {
    switch (this.args.match_type) {
      case 'exact':
        return this.args.case_sensitive 
          ? actual === expected 
          : actual.toLowerCase() === expected.toLowerCase();
      
      case 'includes':
        return this.args.case_sensitive 
          ? actual.includes(expected) 
          : actual.toLowerCase().includes(expected.toLowerCase());
      
      case 'fuzzy':
        return this.fuzzyMatch(actual, expected);
      
      case 'regex':
        try {
          const regex = new RegExp(expected, this.args.case_sensitive ? '' : 'i');
          return regex.test(actual);
        } catch (error) {
          console.warn(`Invalid regex pattern: ${expected}`);
          return false;
        }
      
      default:
        throw new Error(`Unknown match type: ${this.args.match_type}`);
    }
  }

  private fuzzyMatch(actual: string, expected: string, threshold = 0.8): boolean {
    // Simple fuzzy matching using Jaccard similarity
    const actualWords = this.tokenize(actual);
    const expectedWords = this.tokenize(expected);
    
    const intersection = new Set([...actualWords].filter(word => expectedWords.has(word)));
    const union = new Set([...actualWords, ...expectedWords]);
    
    const similarity = intersection.size / union.size;
    return similarity >= threshold;
  }

  private tokenize(text: string): Set<string> {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 0)
    );
  }

  private cleanText(text: string): string {
    // Remove leading/trailing whitespace and normalize internal whitespace
    return text.trim().replace(/\s+/g, ' ');
  }

  private generateSampleId(sample: EvalSample): string {
    // Generate a simple hash-like ID from the sample content
    const content = JSON.stringify(sample.input) + JSON.stringify(sample.ideal);
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}
