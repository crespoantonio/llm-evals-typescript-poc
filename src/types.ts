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
  dry_run?: boolean;
  verbose?: boolean;
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
