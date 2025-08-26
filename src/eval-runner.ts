/**
 * Main evaluation runner that orchestrates the evaluation process
 */

import { EvalReport, EvalResult, EvalSample, RunOptions, LogEvent, TokenUsage, CompletionResult, CacheConfig, CustomMetricResult } from './types';
import { Registry } from './registry';
import { loadDataset } from './dataset-loader';
import { createLLMClient } from './llm-client';
import { Logger } from './logger';
import { CostManager } from './cost-tracking/cost-manager';
import { EvaluationCache, DEFAULT_CACHE_CONFIG, createEvaluationCache } from './caching/evaluation-cache';
import { MetricsRegistry, metricsRegistry } from './metrics/custom-metrics';

export class EvalRunner {
  private registry: Registry;
  private logger: Logger;
  private costManager: CostManager;
  private cache: EvaluationCache;
  private metricsRegistry: MetricsRegistry;

  constructor(registryPath?: string, cacheConfig?: Partial<CacheConfig>) {
    this.registry = new Registry(registryPath);
    this.logger = new Logger();
    this.costManager = new CostManager();
    this.cache = createEvaluationCache(cacheConfig);
    this.metricsRegistry = metricsRegistry;
  }

  /**
   * Run a single evaluation
   */
  async runEval(options: RunOptions): Promise<EvalReport> {
    const startTime = Date.now();
    const runId = this.generateRunId();

    console.log(`🚀 Starting evaluation: ${options.eval} with model: ${options.model}`);

    try {
      // Load registry
      await this.registry.loadRegistry();

      // Get evaluation configuration
      const config = this.registry.getConfig(options.eval);
      
      // Log run specification
      await this.logger.logEvent({
        run_id: runId,
        event_id: 0,
        type: 'spec',
        data: {
          eval_name: options.eval,
          model: options.model,
          config,
          options,
          started_at: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      });

      // Load dataset
      const datasetPath = this.registry.getDatasetPath(options.eval);
      console.log(`📊 Loading dataset from: ${datasetPath}`);
      const dataset = await loadDataset(datasetPath);

      // Limit samples if specified
      const samples = options.max_samples 
        ? dataset.samples.slice(0, options.max_samples)
        : dataset.samples;

      console.log(`📝 Evaluating ${samples.length} samples`);

      // Create LLM client and template (skip in dry run mode)
      let llmClient: any = null;
      let template: any = null;

      if (!options.dry_run) {
        llmClient = createLLMClient(options.model);
        
        // Create grading client (use different model if specified)
        const gradingClient = config.args.grading_model 
          ? createLLMClient(config.args.grading_model)
          : llmClient;

        // Create evaluation template
        template = this.registry.createTemplate(options.eval, gradingClient);
      }

      // Run evaluations
      const results: EvalResult[] = [];
      let eventId = 1;

      for (let i = 0; i < samples.length; i++) {
        const sample = samples[i];
        console.log(`\r⏳ Progress: ${i + 1}/${samples.length} (${Math.round((i + 1) / samples.length * 100)}%)`);

        if (options.dry_run) {
          // Skip actual completion for dry run
          console.log(`[DRY RUN] Sample ${i + 1}:`);
          console.log(`  Input: ${JSON.stringify(sample.input)}`);
          console.log(`  Expected: ${JSON.stringify(sample.ideal)}`);
          
          // Create a mock result for dry run
          const dryRunResult: EvalResult = {
            sample_id: `sample_${i}`,
            input: sample.input,
            ideal: sample.ideal,
            completion: {
              content: '[DRY RUN - NO COMPLETION]',
              model: options.model,
            },
            score: 0.5,
            passed: true,
            reasoning: 'Dry run - no actual evaluation performed',
            metadata: { dry_run: true },
          };
          
          results.push(dryRunResult);
          continue;
        }

        try {
          // Get completion from model
          if (!llmClient || !template) {
            throw new Error('LLM client or template not initialized');
          }

          // Build cache key data
          const completionOptions = {
            temperature: options.temperature,
            max_tokens: options.max_tokens,
          };
          const templateConfig = { 
            type: config.class, 
            args: config.args 
          };

          // Try to get from cache first
          let completion = await this.cache.getCachedResult(
            options.model,
            sample,
            { completion_options: completionOptions, template: templateConfig }
          );

          if (completion) {
            if (options.verbose) {
              console.log(`💾 Cache hit for sample ${i + 1}`);
            }
          } else {
            // Not in cache, get fresh completion
            completion = await llmClient.complete(sample.input, completionOptions);
            
            // Store in cache for future use
            await this.cache.setCachedResult(
              options.model,
              sample,
              { completion_options: completionOptions, template: templateConfig },
              completion
            );
          }

          // Log sampling event
          await this.logger.logEvent({
            run_id: runId,
            event_id: eventId++,
            sample_id: `sample_${i}`,
            type: 'sampling',
            data: {
              input: sample.input,
              completion: completion.content,
              usage: completion.usage,
            },
            created_at: new Date().toISOString(),
          });

          // Evaluate result
          const result = await template.evaluate(sample, completion);
          results.push(result);

          // Log evaluation result
          await this.logger.logEvent({
            run_id: runId,
            event_id: eventId++,
            sample_id: result.sample_id,
            type: 'metrics',
            data: {
              score: result.score,
              passed: result.passed,
              reasoning: result.reasoning,
            },
            created_at: new Date().toISOString(),
          });

          if (options.verbose) {
            console.log(`\n✅ Sample ${i + 1} - Score: ${result.score} - ${result.passed ? 'PASS' : 'FAIL'}`);
            if (result.reasoning) {
              console.log(`   Reasoning: ${result.reasoning.substring(0, 100)}...`);
            }
          }

        } catch (error) {
          console.error(`\n❌ Error evaluating sample ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
          
          // Create a failed result
          const failedResult: EvalResult = {
            sample_id: `sample_${i}`,
            input: sample.input,
            ideal: sample.ideal,
            completion: {
              content: '',
              model: options.model,
              finish_reason: 'error',
            },
            score: 0,
            passed: false,
            reasoning: `Evaluation error: ${error instanceof Error ? error.message : String(error)}`,
            metadata: { error: true },
          };
          
          results.push(failedResult);
        }
      }

      // Calculate final metrics
      const totalSamples = results.length;
      const correct = results.filter(r => r.passed).length;
      const incorrect = totalSamples - correct;
      const score = totalSamples > 0 ? correct / totalSamples : 0;

      // Calculate token usage and costs
      const tokenUsage = this.calculateTokenUsage(options.model, results);

      // Preliminary report for custom metrics calculation
      const preliminaryReport: EvalReport = {
        eval_name: options.eval,
        model: options.model,
        total_samples: totalSamples,
        correct,
        incorrect,
        score,
        results,
        run_id: runId,
        created_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        token_usage: tokenUsage,
      };

      // Calculate custom metrics
      let customMetrics: CustomMetricResult[] | undefined = undefined;
      if (!options.disable_default_metrics || options.custom_metrics) {
        try {
          // Filter metrics if specific ones requested
          if (options.custom_metrics && options.custom_metrics.length > 0) {
            // Enable only requested metrics
            const allMetrics = this.metricsRegistry.getAllMetrics();
            for (const metric of allMetrics) {
              const shouldEnable = options.custom_metrics.includes(metric.name);
              metric.updateConfig({ enabled: shouldEnable });
            }
          }

          customMetrics = await this.metricsRegistry.calculateAllMetrics(results, preliminaryReport);
          
          if (options.verbose && customMetrics.length > 0) {
            console.log(`📊 Calculated ${customMetrics.length} custom metrics`);
          }
        } catch (error) {
          console.warn(`⚠️  Error calculating custom metrics: ${(error as Error).message}`);
        }
      }

      const report: EvalReport = {
        ...preliminaryReport,
        custom_metrics: customMetrics,
      };

      // Log final report
      await this.logger.logEvent({
        run_id: runId,
        event_id: eventId++,
        type: 'final_report',
        data: {
          total_samples: totalSamples,
          correct,
          incorrect,
          score,
        },
        created_at: new Date().toISOString(),
      });

      // Save log file
      if (options.log_to_file) {
        await this.logger.saveToFile(options.log_to_file, runId);
      }

      console.log('\n' + '='.repeat(50));
      console.log(`🎯 Final Results:`);
      console.log(`   Total samples: ${totalSamples}`);
      console.log(`   Correct: ${correct}`);
      console.log(`   Incorrect: ${incorrect}`);
      console.log(`   Accuracy: ${(score * 100).toFixed(2)}%`);
      console.log(`   Duration: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
      
      // Display token usage if available
      if (tokenUsage) {
        console.log('');
        console.log(`📊 Token Usage:`);
        console.log(`   • Prompt tokens: ${tokenUsage.total_prompt_tokens.toLocaleString()}`);
        console.log(`   • Completion tokens: ${tokenUsage.total_completion_tokens.toLocaleString()}`);
        console.log(`   • Total tokens: ${tokenUsage.total_tokens.toLocaleString()}`);
        console.log(`   • Avg tokens/sample: ${tokenUsage.average_tokens_per_sample}`);
        console.log(`   • Range: ${tokenUsage.min_tokens_per_sample} - ${tokenUsage.max_tokens_per_sample} tokens`);
        
        if (tokenUsage.estimated_cost > 0) {
          console.log('');
          console.log(`💰 Estimated Cost:`);
          console.log(`   • Total: $${tokenUsage.estimated_cost.toFixed(4)}`);
          if (tokenUsage.cost_breakdown) {
            console.log(`   • Prompt cost: $${tokenUsage.cost_breakdown.prompt_cost.toFixed(4)}`);
            console.log(`   • Completion cost: $${tokenUsage.cost_breakdown.completion_cost.toFixed(4)}`);
          }
          console.log(`   • Cost per sample: $${(tokenUsage.estimated_cost / totalSamples).toFixed(4)}`);
        }
      }

      // Display custom metrics if available
      if (customMetrics && customMetrics.length > 0) {
        console.log('');
        console.log(`📈 Custom Metrics:`);
        
        // Group by category
        const metricsByCategory = customMetrics.reduce((acc, metric) => {
          if (!acc[metric.category]) acc[metric.category] = [];
          acc[metric.category].push(metric);
          return acc;
        }, {} as Record<string, CustomMetricResult[]>);

        for (const [category, metrics] of Object.entries(metricsByCategory)) {
          console.log(`   ${this.getCategoryEmoji(category)} ${category.toUpperCase()}:`);
          for (const metric of metrics) {
            const trend = metric.higher_is_better ? '↗️' : '↙️';
            console.log(`      ${trend} ${metric.display_name}: ${this.formatMetricValue(metric.value)}`);
            if (options.verbose && metric.description) {
              console.log(`         ${metric.description}`);
            }
          }
        }
      }

      // Display cache statistics
      try {
        const cacheStats = await this.cache.getCacheStats();
        if (cacheStats.total_requests > 0) {
          console.log('');
          console.log(`💾 Cache Performance:`);
          console.log(`   • Requests: ${cacheStats.total_requests}`);
          console.log(`   • Hits: ${cacheStats.cache_hits}`);
          console.log(`   • Hit rate: ${(cacheStats.hit_rate * 100).toFixed(1)}%`);
          if (cacheStats.hit_rate > 0) {
            const savedTokens = Math.round(cacheStats.cache_hits * (tokenUsage?.average_tokens_per_sample || 100));
            console.log(`   • Est. tokens saved: ${savedTokens.toLocaleString()}`);
          }
        }
      } catch (error) {
        // Silently ignore cache stats errors
      }
      
      console.log('='.repeat(50));

      return report;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`\n❌ Evaluation failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Calculate comprehensive token usage from evaluation results
   */
  private calculateTokenUsage(model: string, results: EvalResult[]): TokenUsage | undefined {
    const completionsWithUsage = results
      .map(r => r.completion)
      .filter(c => c.usage && c.usage.total_tokens > 0);

    if (completionsWithUsage.length === 0) {
      return undefined;
    }

    // Calculate totals
    const totalPromptTokens = completionsWithUsage.reduce(
      (sum, c) => sum + (c.usage?.prompt_tokens || 0), 0
    );
    const totalCompletionTokens = completionsWithUsage.reduce(
      (sum, c) => sum + (c.usage?.completion_tokens || 0), 0
    );
    const totalTokens = totalPromptTokens + totalCompletionTokens;

    // Calculate statistics
    const tokensPerSample = completionsWithUsage.map(c => c.usage?.total_tokens || 0);
    const avgTokensPerSample = totalTokens / completionsWithUsage.length;
    const maxTokensPerSample = Math.max(...tokensPerSample);
    const minTokensPerSample = Math.min(...tokensPerSample);

    // Calculate costs using CostManager
    const totalCost = completionsWithUsage.reduce((sum, completion) => {
      return sum + this.costManager.calculateCompletionCost(model, completion);
    }, 0);

    // Calculate cost breakdown
    const config = (this.costManager as any).findCostConfig(model);
    const promptCost = config 
      ? (totalPromptTokens / 1000) * config.input_cost_per_1k_tokens 
      : 0;
    const completionCost = config 
      ? (totalCompletionTokens / 1000) * config.output_cost_per_1k_tokens 
      : 0;

    return {
      total_prompt_tokens: totalPromptTokens,
      total_completion_tokens: totalCompletionTokens,
      total_tokens: totalTokens,
      average_tokens_per_sample: Math.round(avgTokensPerSample),
      max_tokens_per_sample: maxTokensPerSample,
      min_tokens_per_sample: minTokensPerSample,
      estimated_cost: totalCost,
      cost_breakdown: {
        prompt_cost: promptCost,
        completion_cost: completionCost,
      }
    };
  }

  private generateRunId(): string {
    const timestamp = new Date().toISOString().replace(/[^\d]/g, '').slice(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${timestamp}${random}`;
  }

  /**
   * Get emoji for metric category
   */
  private getCategoryEmoji(category: string): string {
    const emojis: Record<string, string> = {
      accuracy: '🎯',
      efficiency: '⚡',
      cost: '💰',
      quality: '✨',
      safety: '🛡️',
      business: '📊',
      custom: '🔧'
    };
    return emojis[category] || '📈';
  }

  /**
   * Format metric value for display
   */
  private formatMetricValue(value: number): string {
    if (value < 0.01 && value > 0) {
      return value.toExponential(2);
    } else if (value < 1) {
      return value.toFixed(3);
    } else if (value < 100) {
      return value.toFixed(2);
    } else {
      return Math.round(value).toLocaleString();
    }
  }

  /**
   * Clean up cache connections when done
   */
  async cleanup(): Promise<void> {
    await this.cache.close();
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    return await this.cache.getCacheStats();
  }

  /**
   * Clear evaluation cache
   */
  async clearCache(): Promise<void> {
    await this.cache.clearCache();
  }

  /**
   * Invalidate cache for specific model
   */
  async invalidateModelCache(model: string): Promise<number> {
    return await this.cache.invalidateModelCache(model);
  }
}
