/**
 * Core types and interfaces for the LLM evaluation framework
 */

/**
 * A message in the chat format
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * A single evaluation sample
 */
export interface EvalSample {
  input: ChatMessage[];
  ideal: string | string[];
  metadata?: Record<string, any>;
}

/**
 * Evaluation dataset
 */
export interface EvalDataset {
  samples: EvalSample[];
  metadata?: Record<string, any>;
}

/**
 * LLM completion result
 */
export interface CompletionResult {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
  finish_reason?: string;
}

/**
 * Evaluation result for a single sample
 */
export interface EvalResult {
  sample_id: string;
  input: ChatMessage[];
  ideal: string | string[];
  completion: CompletionResult;
  score: number; // 0-1 where 1 is correct
  passed: boolean;
  metadata?: Record<string, any>;
  reasoning?: string; // For model-graded evals
}

/**
 * Token usage summary
 */
export interface TokenUsage {
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  average_tokens_per_sample: number;
  max_tokens_per_sample: number;
  min_tokens_per_sample: number;
  estimated_cost: number;
  cost_breakdown?: {
    prompt_cost: number;
    completion_cost: number;
    embedding_cost?: number;
  };
}

/**
 * Final evaluation report
 */
export interface EvalReport {
  eval_name: string;
  model: string;
  total_samples: number;
  correct: number;
  incorrect: number;
  score: number; // Overall accuracy
  results: EvalResult[];
  run_id: string;
  created_at: string;
  duration_ms: number;
  token_usage?: TokenUsage; // Token and cost tracking
  custom_metrics?: CustomMetricResult[]; // Custom metrics results
  metadata?: Record<string, any>; // Optional metadata for reports
}

/**
 * Evaluation configuration
 */
export interface EvalConfig {
  id: string;
  description: string;
  disclaimer?: string;
  metrics: string[];
  class: string;
  args: Record<string, any>;
}

/**
 * Registry of evaluations
 */
export interface EvalRegistry {
  [key: string]: EvalConfig;
}

/**
 * LLM client interface
 */
export interface LLMClient {
  complete(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResult>;
  getModel(): string;
}

/**
 * Completion options
 */
export interface CompletionOptions {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  format?: string; // Added for ollama format support (json, etc.)
}

/**
 * Evaluation template interface
 */
export interface EvalTemplate {
  name: string;
  evaluate(sample: EvalSample, completion: CompletionResult): Promise<EvalResult>;
}

/**
 * Basic evaluation template configuration
 */
export interface BasicEvalArgs {
  samples_jsonl: string;
  match_type?: 'exact' | 'includes' | 'fuzzy' | 'regex';
  case_sensitive?: boolean;
}

/**
 * Model-graded evaluation template configuration
 */
export interface ModelGradedEvalArgs {
  samples_jsonl: string;
  eval_type: 'classify' | 'cot_classify';
  grading_model?: string;
  grading_prompt?: string;
}

/**
 * Choice-based evaluation template configuration
 */
export interface ChoiceBasedEvalArgs {
  samples_jsonl: string;
  prompt: string; // Template with {input}, {ideal}, {completion} variables
  choice_strings: string[]; // Valid choices the grader can make
  choice_scores: Record<string, number>; // Score mapping for each choice
  grading_model?: string;
  input_outputs?: {
    input?: string; // What to use as input (default: 'input')
    ideal?: string; // What to use as ideal (default: 'ideal')
    completion?: string; // What to use as completion (default: 'completion')
  };
}

/**
 * Semantic similarity evaluation template configuration
 */
export interface SemanticSimilarityEvalArgs {
  samples_jsonl: string;
  threshold?: number; // Minimum similarity score to pass (0.0-1.0)
  embeddings_provider?: 'openai' | 'local'; // Which embeddings service to use
  embeddings_model?: string; // Specific model for embeddings
  match_mode?: 'best' | 'threshold' | 'all'; // How to evaluate against multiple ideal answers
  cache_embeddings?: boolean; // Whether to cache embeddings for reuse
}

/**
 * CLI run options
 */
export interface RunOptions {
  model: string;
  eval: string;
  max_samples?: number;
  registry_path?: string;
  log_to_file?: string;
  seed?: number;
  temperature?: number;
  max_tokens?: number;
  timeout?: number; // Request timeout in milliseconds
  dry_run?: boolean;
  verbose?: boolean;
  cache_config?: Partial<CacheConfig>; // Optional cache configuration
  custom_metrics?: string[]; // Names of custom metrics to calculate
  disable_default_metrics?: boolean; // Disable built-in metrics if only custom ones needed
}

/**
 * Event log entry
 */
export interface LogEvent {
  run_id: string;
  event_id: number;
  sample_id?: string;
  type: 'spec' | 'sampling' | 'match' | 'metrics' | 'final_report';
  data: Record<string, any>;
  created_at: string;
}

/**
 * Custom metric result
 */
export interface CustomMetricResult {
  name: string;
  value: number;
  display_name: string;
  description: string;
  higher_is_better: boolean;
  category: 'accuracy' | 'efficiency' | 'cost' | 'quality' | 'safety' | 'business' | 'custom';
  metadata?: Record<string, any>;
}

/**
 * Evaluation cache configuration
 */
export interface CacheConfig {
  enabled: boolean;
  provider: 'redis' | 'memory';
  redis_url?: string;
  ttl_seconds: number;
  max_memory_items: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  total_requests: number;
  cache_hits: number;
  cache_misses: number;
  hit_rate: number;
  memory_usage?: number;
  redis_connected?: boolean;
}

/**
 * Custom metric configuration
 */
export interface MetricConfig {
  enabled: boolean;
  weight?: number;
  threshold?: number;
  parameters?: Record<string, any>;
}
