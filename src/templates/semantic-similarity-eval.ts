/**
 * Semantic similarity evaluation template
 */

import { EvalTemplate, EvalSample, CompletionResult, EvalResult, SemanticSimilarityEvalArgs } from '../types';
import { 
  SemanticSimilarityService, 
  createEmbeddingsProvider, 
  EmbeddingsProvider 
} from '../embeddings/embeddings-service';

export class SemanticSimilarityEval implements EvalTemplate {
  name = 'semantic-similarity';
  private args: SemanticSimilarityEvalArgs;
  private semanticService: SemanticSimilarityService;

  constructor(args: SemanticSimilarityEvalArgs) {
    this.args = {
      threshold: 0.8, // Default threshold
      embeddings_provider: 'openai',
      match_mode: 'best',
      cache_embeddings: true,
      ...args
    };

    // Create embeddings provider
    const provider = createEmbeddingsProvider(
      this.args.embeddings_provider!,
      this.args.embeddings_model
    );
    
    this.semanticService = new SemanticSimilarityService(provider);
  }

  async evaluate(sample: EvalSample, completion: CompletionResult): Promise<EvalResult> {
    const sampleId = this.generateSampleId(sample);
    const actualText = completion.content.trim();
    
    // Handle multiple ideal answers
    const idealAnswers = Array.isArray(sample.ideal) ? sample.ideal : [sample.ideal];
    
    let score: number;
    let passed: boolean;
    let reasoning: string;
    let metadata: Record<string, any> = {
      embeddings_provider: this.args.embeddings_provider,
      embeddings_model: this.semanticService['provider'].getModel(),
      match_mode: this.args.match_mode,
      threshold: this.args.threshold,
    };

    try {
      switch (this.args.match_mode) {
        case 'best':
          const bestMatch = await this.semanticService.calculateBestMatch(actualText, idealAnswers);
          score = bestMatch.bestSimilarity;
          passed = score >= this.args.threshold!;
          reasoning = `Best semantic match: ${bestMatch.bestMatch} (similarity: ${score.toFixed(4)})`;
          metadata.best_match = bestMatch.bestMatch;
          metadata.all_similarities = bestMatch.allSimilarities;
          break;

        case 'threshold':
          // Pass if ANY ideal answer meets threshold
          const thresholdResults = await Promise.all(
            idealAnswers.map(async (ideal) => {
              const result = await this.semanticService.calculateSimilarity(actualText, ideal);
              return {
                ideal,
                similarity: result.similarity,
              };
            })
          );
          
          const maxSimilarity = Math.max(...thresholdResults.map(r => r.similarity));
          const passingAnswers = thresholdResults.filter(r => r.similarity >= this.args.threshold!);
          
          score = maxSimilarity;
          passed = passingAnswers.length > 0;
          reasoning = `Threshold mode: ${passingAnswers.length}/${idealAnswers.length} answers above threshold ${this.args.threshold}. Max similarity: ${maxSimilarity.toFixed(4)}`;
          metadata.all_similarities = thresholdResults;
          metadata.passing_answers = passingAnswers.length;
          break;

        case 'all':
          // Must meet threshold for ALL ideal answers
          const allResults = await Promise.all(
            idealAnswers.map(async (ideal) => {
              const result = await this.semanticService.calculateSimilarity(actualText, ideal);
              return {
                ideal,
                similarity: result.similarity,
              };
            })
          );
          
          const avgSimilarity = allResults.reduce((sum, r) => sum + r.similarity, 0) / allResults.length;
          const allPassingAnswers = allResults.filter(r => r.similarity >= this.args.threshold!);
          
          score = avgSimilarity;
          passed = allPassingAnswers.length === idealAnswers.length;
          reasoning = `All mode: ${allPassingAnswers.length}/${idealAnswers.length} answers above threshold ${this.args.threshold}. Average similarity: ${avgSimilarity.toFixed(4)}`;
          metadata.all_similarities = allResults;
          metadata.all_passing = allPassingAnswers.length === idealAnswers.length;
          break;

        default:
          throw new Error(`Unknown match_mode: ${this.args.match_mode}`);
      }

    } catch (error) {
      score = 0;
      passed = false;
      reasoning = `Semantic similarity evaluation failed: ${error instanceof Error ? error.message : String(error)}`;
      metadata.error = error instanceof Error ? error.message : String(error);
    }

    return {
      sample_id: sampleId,
      input: sample.input,
      ideal: sample.ideal,
      completion,
      score,
      passed,
      reasoning,
      metadata,
    };
  }

  private generateSampleId(sample: EvalSample): string {
    // Simple hash of the input for consistent IDs
    const inputStr = JSON.stringify(sample.input);
    const hash = this.simpleHash(inputStr);
    return `sample_${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Utility method to get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return this.semanticService.getCacheStats();
  }

  // Utility method to clear embedding cache
  clearCache(): void {
    this.semanticService.clearCache();
  }

  // Utility method to precompute embeddings for dataset
  async precomputeEmbeddings(samples: EvalSample[]): Promise<void> {
    const allTexts = new Set<string>();
    
    // Collect all unique texts from samples
    for (const sample of samples) {
      const idealAnswers = Array.isArray(sample.ideal) ? sample.ideal : [sample.ideal];
      idealAnswers.forEach(ideal => allTexts.add(ideal));
    }
    
    // Generate embeddings in batches to warm up cache
    const textsArray = Array.from(allTexts);
    const batchSize = 10;
    
    for (let i = 0; i < textsArray.length; i += batchSize) {
      const batch = textsArray.slice(i, i + batchSize);
      await Promise.all(
        batch.map(text => 
          this.semanticService['provider'].generateEmbedding(text)
            .then(embedding => {
              const cacheKey = `${this.semanticService['provider'].getModel()}:${text}`;
              this.semanticService['cache'].set(cacheKey, embedding);
            })
        )
      );
    }
  }
}
