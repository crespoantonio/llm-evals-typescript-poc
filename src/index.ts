/**
 * Main entry point for the LLM evaluation framework
 */

// Core types
export * from './types';

// Main components
export { EvalRunner } from './eval-runner';
export { Registry } from './registry';
export { Logger } from './logger';

// LLM clients
export { createLLMClient, OpenAIClient } from './llm-client';

// Dataset utilities
export { loadDataset, saveDataset, createSampleDataset } from './dataset-loader';

// Evaluation templates
export { BasicEval } from './templates/basic-eval';
export { ModelGradedEval } from './templates/model-graded-eval';
export { ChoiceBasedEval } from './templates/choice-based-eval';
export { SemanticSimilarityEval } from './templates/semantic-similarity-eval';

// Embeddings and semantic similarity
export { 
  SemanticSimilarityService, 
  OpenAIEmbeddingsProvider, 
  LocalEmbeddingsProvider,
  createEmbeddingsProvider,
  cosineSimilarity 
} from './embeddings/embeddings-service';
