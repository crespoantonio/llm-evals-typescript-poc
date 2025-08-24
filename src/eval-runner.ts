/**
 * Main evaluation runner that orchestrates the evaluation process
 */

import { EvalReport, EvalResult, EvalSample, RunOptions, LogEvent } from './types';
import { Registry } from './registry';
import { loadDataset } from './dataset-loader';
import { createLLMClient } from './llm-client';
import { Logger } from './logger';

export class EvalRunner {
  private registry: Registry;
  private logger: Logger;

  constructor(registryPath?: string) {
    this.registry = new Registry(registryPath);
    this.logger = new Logger();
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

          const completion = await llmClient.complete(sample.input, {
            temperature: options.temperature,
            max_tokens: options.max_tokens,
          });

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

      const report: EvalReport = {
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
      console.log('='.repeat(50));

      return report;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`\n❌ Evaluation failed: ${errorMessage}`);
      throw error;
    }
  }

  private generateRunId(): string {
    const timestamp = new Date().toISOString().replace(/[^\d]/g, '').slice(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${timestamp}${random}`;
  }
}
