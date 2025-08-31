#!/usr/bin/env node

/**
 * Command-line interface for the LLM evaluation framework
 */

// Load environment variables from .env file
import 'dotenv/config';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import { EvalRunner } from './eval-runner';
import { Registry } from './registry';
import { Logger } from './logger';
import { TokenAnalyticsService } from './analytics/token-analytics';
import { CostManager } from './cost-tracking/cost-manager';
import { EvaluationStore } from './database/evaluation-store';
import { RunOptions } from './types';
import { validateEnvironment, printEnvValidation, validateOpenAIEnvironment } from './utils/env-validator';

async function main() {
  // Validate environment setup early
  const envValidation = validateEnvironment();
  if (process.argv.length > 2 && !['--help', '-h', '--version', '-V'].some(arg => process.argv.includes(arg))) {
    printEnvValidation(envValidation);
    console.log(); // Add spacing
  }

  const argv = await yargs(hideBin(process.argv))
    .scriptName('llm-eval')
    .usage('$0 <model> <eval> [options]')
    .example('$0 gpt-3.5-turbo math-basic', 'Run basic math evaluation with GPT-3.5')
    .example('$0 gpt-4 sql-graded --max-samples 50', 'Run SQL evaluation with 50 samples')
    
    .command(
      '$0 <model> <eval>',
      'Run an evaluation',
      (yargs: any) => {
        return yargs
          .positional('model', {
            describe: 'Model to evaluate (e.g., gpt-3.5-turbo, gpt-4)',
            type: 'string',
            demandOption: true,
          })
          .positional('eval', {
            describe: 'Evaluation to run',
            type: 'string',
            demandOption: true,
          });
      }
    )
    
    .command(
      'list',
      'List available evaluations',
      {},
      async (argv: any) => {
        await listEvals(argv.registry as string);
      }
    )
    
    .command(
      'init [path]',
      'Initialize a new registry',
      (yargs: any) => {
        return yargs.positional('path', {
          describe: 'Path to create registry (defaults to ./registry)',
          type: 'string',
          default: './registry',
        });
      },
      async (argv: any) => {
        await initRegistry(argv.path as string);
      }
    )
    
    .command(
      'tokens [command]',
      'Token usage analytics and management',
      (yargs: any) => {
        return yargs
          .command(
            'report [days]',
            'Generate comprehensive token analytics report',
            (yargs: any) => {
              return yargs.positional('days', {
                describe: 'Days to include in report',
                type: 'number',
                default: 30,
              });
            },
            async (argv: any) => {
              await tokenReport(argv.days as number, argv.registry as string);
            }
          )
          .command(
            'trends <eval_name> [days]',
            'Show token usage trends for an evaluation',
            (yargs: any) => {
              return yargs
                .positional('eval_name', {
                  describe: 'Evaluation name to analyze',
                  type: 'string',
                  demandOption: true,
                })
                .positional('days', {
                  describe: 'Days to include',
                  type: 'number',
                  default: 30,
                });
            },
            async (argv: any) => {
              await tokenTrends(argv.eval_name as string, argv.days as number, argv.registry as string);
            }
          )
          .command(
            'efficiency [models..]',
            'Compare token efficiency between models',
            (yargs: any) => {
              return yargs
                .positional('models', {
                  describe: 'Models to compare (space-separated)',
                  type: 'string',
                  array: true,
                })
                .option('eval', {
                  describe: 'Filter by evaluation name',
                  type: 'string',
                })
                .option('days', {
                  describe: 'Days to include',
                  type: 'number',
                  default: 30,
                });
            },
            async (argv: any) => {
              await modelEfficiency(argv.models as string[] || [], argv.eval as string, argv.days as number, argv.registry as string);
            }
          )
          .demandCommand(1, 'You need to specify a tokens subcommand');
      }
    )
    
    .command(
      'costs [command]',
      'Cost analysis and budget management',
      (yargs: any) => {
        return yargs
          .command(
            'breakdown [days]',
            'Show cost breakdown by evaluation',
            (yargs: any) => {
              return yargs.positional('days', {
                describe: 'Days to include in breakdown',
                type: 'number',
                default: 30,
              });
            },
            async (argv: any) => {
              await costBreakdown(argv.days as number, argv.registry as string);
            }
          )
          .command(
            'predict <model> <eval_name> <sample_count>',
            'Predict costs for a future evaluation',
            (yargs: any) => {
              return yargs
                .positional('model', {
                  describe: 'Model to use',
                  type: 'string',
                  demandOption: true,
                })
                .positional('eval_name', {
                  describe: 'Evaluation type',
                  type: 'string',
                  demandOption: true,
                })
                .positional('sample_count', {
                  describe: 'Number of samples',
                  type: 'number',
                  demandOption: true,
                })
                .option('days', {
                  describe: 'Historical days to base prediction on',
                  type: 'number',
                  default: 7,
                });
            },
            async (argv: any) => {
              await costPredict(
                argv.model as string,
                argv.eval_name as string,
                argv.sample_count as number,
                argv.days as number,
                argv.registry as string
              );
            }
          )
          .command(
            'estimate <model> <sample_count>',
            'Quick cost estimate for evaluation',
            (yargs: any) => {
              return yargs
                .positional('model', {
                  describe: 'Model to estimate for',
                  type: 'string',
                  demandOption: true,
                })
                .positional('sample_count', {
                  describe: 'Number of samples',
                  type: 'number',
                  demandOption: true,
                })
                .option('input-length', {
                  describe: 'Average input length in characters',
                  type: 'number',
                  default: 500,
                })
                .option('output-length', {
                  describe: 'Average output length in characters',
                  type: 'number',
                  default: 200,
                });
            },
            async (argv: any) => {
              await costEstimate(
                argv.model as string,
                argv.sample_count as number,
                argv['input-length'] as number,
                argv['output-length'] as number
              );
            }
          )
          .command(
            'budget <eval_name> [amount]',
            'Set or check budget for evaluation',
            (yargs: any) => {
              return yargs
                .positional('eval_name', {
                  describe: 'Evaluation name',
                  type: 'string',
                  demandOption: true,
                })
                .positional('amount', {
                  describe: 'Budget amount in USD (omit to check current)',
                  type: 'number',
                });
            },
            async (argv: any) => {
              await budgetManage(argv.eval_name as string, argv.amount as number | undefined);
            }
          )
          .demandCommand(1, 'You need to specify a costs subcommand');
      }
    )
    
    .command(
      'dashboard [port]',
      'Start analytics dashboard server',
      (yargs: any) => {
        return yargs.positional('port', {
          describe: 'Port to serve dashboard on',
          type: 'number',
          default: 3000,
        });
      },
      async (argv: any) => {
        await startDashboard(argv.port as number, argv.registry as string);
      }
    )
    
    .command(
      'cache',
      'Manage evaluation cache',
      (yargs: any) => {
        return yargs
          .command(
            'stats',
            'Show cache statistics',
            {},
            async (argv: any) => {
              await cacheStats(argv.registry as string);
            }
          )
          .command(
            'clear',
            'Clear all cache entries',
            {},
            async (argv: any) => {
              await cacheClear(argv.registry as string);
            }
          )
          .command(
            'invalidate <model>',
            'Invalidate cache for specific model',
            (yargs: any) => {
              return yargs.positional('model', {
                describe: 'Model name to invalidate cache for',
                type: 'string',
              });
            },
            async (argv: any) => {
              await cacheInvalidate(argv.model as string, argv.registry as string);
            }
          )
          .demandCommand(1, 'Please specify a cache command');
      }
    )

    .command(
      'metrics',
      'Manage custom metrics',
      (yargs: any) => {
        return yargs
          .command(
            'list',
            'List available custom metrics',
            {},
            async (argv: any) => {
              await metricsList();
            }
          )
          .command(
            'test <eval_name>',
            'Test custom metrics on existing evaluation',
            (yargs: any) => {
              return yargs.positional('eval_name', {
                describe: 'Evaluation name to test metrics on',
                type: 'string',
              });
            },
            async (argv: any) => {
              await metricsTest(argv.eval_name as string, argv.registry as string);
            }
          )
          .demandCommand(1, 'Please specify a metrics command');
      }
    )
    
    .option('max-samples', {
      alias: 'm',
      type: 'number',
      description: 'Maximum number of samples to evaluate',
    })
    
    .option('registry', {
      alias: 'r',
      type: 'string',
      description: 'Path to registry directory',
      default: './registry',
    })
    
    .option('log-to-file', {
      alias: 'l',
      type: 'string',
      description: 'Save detailed logs to file',
    })
    
    .option('temperature', {
      alias: 't',
      type: 'number',
      description: 'Model temperature (0.0-2.0)',
      default: 0.0,
    })
    
    .option('max-tokens', {
      type: 'number',
      description: 'Maximum tokens in completion',
    })
    
    .option('timeout', {
      type: 'number',
      description: 'Request timeout in milliseconds (default: 300000ms for Ollama, 120000ms for HuggingFace)',
    })
    
    .option('dry-run', {
      type: 'boolean',
      description: 'Run without calling the model (for testing)',
      default: false,
    })
    
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Show detailed progress',
      default: false,
    })
    
    .option('seed', {
      type: 'number',
      description: 'Random seed for reproducibility',
    })
    
    .help()
    .alias('help', 'h')
    .version()
    .alias('version', 'V')
    .parseAsync();

  // Handle main evaluation command
  if (argv.model && argv.eval && argv._.length === 0) {
    const options: RunOptions = {
      model: argv.model as string,
      eval: argv.eval as string,
      max_samples: argv['max-samples'] as number | undefined,
      registry_path: argv.registry as string,
      log_to_file: argv['log-to-file'] as string | undefined,
      temperature: argv.temperature as number,
      max_tokens: argv['max-tokens'] as number | undefined,
      timeout: argv.timeout as number | undefined,
      dry_run: argv['dry-run'] as boolean,
      verbose: argv.verbose as boolean,
      seed: argv.seed as number | undefined,
    };

    await runEval(options);
  }
}

async function runEval(options: RunOptions): Promise<void> {
  try {
    if (options.verbose) {
      console.log(chalk.blue('🧠 LLM Evaluation Framework'));
      console.log(chalk.gray(`Model: ${options.model} | Eval: ${options.eval}`));
    }
    
    if (options.dry_run) {
      console.log(chalk.yellow('⚠️  DRY RUN MODE - No API calls will be made'));
    } else {
      // Validate API key for models that need it
      const needsOpenAI = options.model.startsWith('gpt-') || 
                         options.model.startsWith('o1-') || 
                         options.model.startsWith('openai/');
      
      if (needsOpenAI && !validateOpenAIEnvironment()) {
        console.log(chalk.red('\nCannot proceed without valid OPENAI_API_KEY'));
        process.exit(1);
      }
    }

    const runner = new EvalRunner(options.registry_path);
    const report = await runner.runEval(options);

    // Generate and save log file if not specified
    const logPath = options.log_to_file || Logger.generateLogPath(
      report.run_id,
      options.model,
      options.eval
    );

    // Always save logs using the actual run_id from the report
    await runner.saveToFile(logPath, report.run_id);

    console.log(`\nDetailed logs saved to: ${logPath}`);
    
    // Color-code the results
    const scoreColor = report.score >= 0.8 ? chalk.green : 
                      report.score >= 0.6 ? chalk.yellow : chalk.red;
    
    console.log(chalk.bold('\nFinal Score: ') + scoreColor(`${(report.score * 100).toFixed(1)}%`));

  } catch (error) {
    console.error(chalk.red('Evaluation failed:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

async function listEvals(registryPath: string): Promise<void> {
  try {
    console.log(chalk.blue('📋 Available Evaluations'));
    console.log(chalk.gray(`Registry: ${registryPath}`));
    
    const registry = new Registry(registryPath);
    await registry.loadRegistry();
    
    const evals = registry.listEvals();
    
    if (evals.length === 0) {
      console.log(chalk.yellow('No evaluations found. Run "llm-eval init" to create a sample registry.'));
      return;
    }

    console.log('');
    for (const evalName of evals) {
      const config = registry.getConfig(evalName);
      console.log(chalk.green(`${evalName}`));
      console.log(chalk.gray(`  ${config.description}`));
      console.log(chalk.gray(`  Metrics: ${config.metrics.join(', ')}`));
      console.log(chalk.gray(`  Class: ${config.class}`));
      console.log('');
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to list evaluations:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

async function initRegistry(registryPath: string): Promise<void> {
  try {
    console.log(chalk.blue(`🏗️  Initializing registry at: ${registryPath}`));
    
    await Registry.createDefaultRegistry(registryPath);
    
    console.log(chalk.green('✅ Registry initialized successfully!'));
    console.log(chalk.gray('\nNext steps:'));
    console.log(chalk.gray('1. Add your datasets to registry/data/'));
    console.log(chalk.gray('2. Configure evaluations in registry/evals/*.yaml'));
    console.log(chalk.gray('3. Run evaluations with: llm-eval <model> <eval>'));
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to initialize registry:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// ========== TOKEN ANALYTICS COMMANDS ==========

async function tokenReport(days: number, registryPath: string): Promise<void> {
  try {
    console.log(chalk.blue('📊 Token Analytics Report'));
    console.log(chalk.gray(`Period: Last ${days} days | Registry: ${registryPath}`));
    
    const store = new EvaluationStore();
    const analytics = new TokenAnalyticsService(store);
    const report = await analytics.generateAnalyticsReport(days);
    
    console.log(chalk.bold('\n📈 Summary:'));
    console.log(`   Total evaluations: ${report.summary.total_evaluations.toLocaleString()}`);
    console.log(`   Total tokens: ${report.summary.total_tokens.toLocaleString()}`);
    console.log(`   Total cost: $${report.summary.total_cost.toFixed(4)}`);
    console.log(`   Avg cost per eval: $${report.summary.avg_cost_per_evaluation.toFixed(4)}`);
    
    if (report.summary.most_efficient_model) {
      console.log(`   Most efficient model: ${chalk.green(report.summary.most_efficient_model)}`);
    }
    if (report.summary.most_expensive_model) {
      console.log(`   Most expensive model: ${chalk.red(report.summary.most_expensive_model)}`);
    }
    
    if (report.model_efficiency.length > 0) {
      console.log(chalk.bold('\n🏆 Model Efficiency Ranking:'));
      report.model_efficiency.slice(0, 5).forEach((model, i) => {
        const rank = i + 1;
        const color = rank === 1 ? chalk.green : rank <= 3 ? chalk.yellow : chalk.gray;
        console.log(`   ${rank}. ${color(model.model)} - $${model.avg_cost_per_sample.toFixed(4)}/sample (${model.avg_tokens_per_sample} tokens)`);
      });
    }
    
    if (report.evaluation_costs.length > 0) {
      console.log(chalk.bold('\n💰 Cost by Evaluation:'));
      report.evaluation_costs.slice(0, 5).forEach((evalCost) => {
        const trendIcon = evalCost.cost_trend === 'increasing' ? '📈' : 
                          evalCost.cost_trend === 'decreasing' ? '📉' : '➡️';
        console.log(`   ${evalCost.evaluation}: $${evalCost.total_cost.toFixed(4)} (${evalCost.total_runs} runs) ${trendIcon}`);
      });
    }
    
    if (report.recommendations.length > 0) {
      console.log(chalk.bold('\n💡 Recommendations:'));
      report.recommendations.forEach(rec => console.log(`   ${rec}`));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to generate token report:'), error instanceof Error ? error.message : String(error));
  }
}

async function tokenTrends(evalName: string, days: number, registryPath: string): Promise<void> {
  try {
    console.log(chalk.blue(`📈 Token Trends for ${evalName}`));
    console.log(chalk.gray(`Period: Last ${days} days | Registry: ${registryPath}`));
    
    const store = new EvaluationStore();
    const analytics = new TokenAnalyticsService(store);
    const trends = await analytics.getTokenTrends(evalName, days);
    
    if (trends.length === 0) {
      console.log(chalk.yellow('📭 No token usage data found for this evaluation'));
      return;
    }
    
    console.log(chalk.bold('\n📊 Daily Trends:'));
    trends.slice(0, 10).forEach((trend) => {
      console.log(`   ${trend.date}:`);
      console.log(`     • Tokens: ${trend.total_tokens.toLocaleString()}`);
      console.log(`     • Cost: $${trend.total_cost.toFixed(4)}`);
      console.log(`     • Avg/sample: ${trend.avg_tokens_per_sample} tokens`);
      console.log(`     • Runs: ${trend.evaluations_run}`);
    });
    
    // Calculate trend direction
    if (trends.length >= 2) {
      const recent = trends.slice(0, Math.ceil(trends.length / 2));
      const older = trends.slice(Math.ceil(trends.length / 2));
      
      const recentAvgCost = recent.reduce((sum, t) => sum + t.total_cost, 0) / recent.length;
      const olderAvgCost = older.reduce((sum, t) => sum + t.total_cost, 0) / older.length;
      
      const trendDirection = recentAvgCost > olderAvgCost ? 'increasing' : 
                            recentAvgCost < olderAvgCost ? 'decreasing' : 'stable';
      const trendIcon = trendDirection === 'increasing' ? '📈' : 
                       trendDirection === 'decreasing' ? '📉' : '➡️';
      
      console.log(chalk.bold(`\n${trendIcon} Trend: ${trendDirection}`));
      if (trendDirection !== 'stable') {
        const change = ((recentAvgCost - olderAvgCost) / olderAvgCost * 100);
        console.log(`   Cost change: ${change > 0 ? '+' : ''}${change.toFixed(1)}%`);
      }
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to get token trends:'), error instanceof Error ? error.message : String(error));
  }
}

async function modelEfficiency(models: string[], evalName: string | undefined, days: number, registryPath: string): Promise<void> {
  try {
    const modelsText = models.length > 0 ? models.join(', ') : 'all models';
    const evalText = evalName || 'all evaluations';
    console.log(chalk.blue(`⚔️  Model Efficiency Comparison`));
    console.log(chalk.gray(`Models: ${modelsText} | Evaluation: ${evalText} | Period: Last ${days} days`));
    
    const store = new EvaluationStore();
    const analytics = new TokenAnalyticsService(store);
    const efficiency = await analytics.compareModelEfficiency(models, evalName, days);
    
    if (efficiency.length === 0) {
      console.log(chalk.yellow('📭 No efficiency data found for the specified criteria'));
      return;
    }
    
    console.log(chalk.bold('\n🏆 Efficiency Ranking (Lower cost per correct answer is better):'));
    efficiency.forEach((model, i) => {
      const rank = i + 1;
      const color = rank === 1 ? chalk.green : rank <= 3 ? chalk.yellow : chalk.white;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '  ';
      
      console.log(`${medal} ${rank}. ${color(model.model)}`);
      console.log(`     • Cost per sample: $${model.avg_cost_per_sample.toFixed(4)}`);
      console.log(`     • Tokens per sample: ${model.avg_tokens_per_sample}`);
      console.log(`     • Total samples: ${model.total_samples.toLocaleString()}`);
      console.log(`     • Total cost: $${model.total_cost.toFixed(4)}`);
      console.log(`     • Efficiency score: ${model.efficiency_score.toFixed(4)}`);
      console.log('');
    });
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to compare model efficiency:'), error instanceof Error ? error.message : String(error));
  }
}

// ========== COST ANALYSIS COMMANDS ==========

async function costBreakdown(days: number, registryPath: string): Promise<void> {
  try {
    console.log(chalk.blue('💰 Cost Breakdown'));
    console.log(chalk.gray(`Period: Last ${days} days | Registry: ${registryPath}`));
    
    const store = new EvaluationStore();
    const analytics = new TokenAnalyticsService(store);
    const breakdown = await analytics.getCostBreakdown(days);
    
    if (breakdown.length === 0) {
      console.log(chalk.yellow('📭 No cost data found'));
      return;
    }
    
    const totalCost = breakdown.reduce((sum, evalItem) => sum + evalItem.total_cost, 0);
    const totalRuns = breakdown.reduce((sum, evalItem) => sum + evalItem.total_runs, 0);
    
    console.log(chalk.bold('\n📊 Summary:'));
    console.log(`   Total cost: $${totalCost.toFixed(4)}`);
    console.log(`   Total runs: ${totalRuns.toLocaleString()}`);
    console.log(`   Average cost per run: $${(totalCost / totalRuns).toFixed(4)}`);
    
    console.log(chalk.bold('\n💸 Cost by Evaluation:'));
    breakdown.forEach((evalItem, i) => {
      const percentage = (evalItem.total_cost / totalCost * 100).toFixed(1);
      const trendIcon = evalItem.cost_trend === 'increasing' ? '📈' : 
                       evalItem.cost_trend === 'decreasing' ? '📉' : '➡️';
      
      console.log(`   ${i + 1}. ${evalItem.evaluation} (${percentage}%)`);
      console.log(`      • Total: $${evalItem.total_cost.toFixed(4)} over ${evalItem.total_runs} runs`);
      console.log(`      • Avg per run: $${evalItem.avg_cost_per_run.toFixed(4)}`);
      console.log(`      • Avg tokens per run: ${evalItem.avg_tokens_per_run.toLocaleString()}`);
      console.log(`      • Models: ${evalItem.models_used.join(', ')}`);
      console.log(`      • Trend: ${evalItem.cost_trend} ${trendIcon}`);
      console.log('');
    });
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to get cost breakdown:'), error instanceof Error ? error.message : String(error));
  }
}

async function costPredict(model: string, evalName: string, sampleCount: number, days: number, registryPath: string): Promise<void> {
  try {
    console.log(chalk.blue('🔮 Cost Prediction'));
    console.log(chalk.gray(`Model: ${model} | Evaluation: ${evalName} | Samples: ${sampleCount} | Based on last ${days} days`));
    
    const store = new EvaluationStore();
    const analytics = new TokenAnalyticsService(store);
    const prediction = await analytics.predictCosts(model, evalName, sampleCount, days);
    
    console.log(chalk.bold('\n💰 Prediction Results:'));
    console.log(`   Estimated cost: ${chalk.green('$' + prediction.estimated_cost.toFixed(4))}`);
    console.log(`   Cost per sample: $${prediction.cost_per_sample.toFixed(4)}`);
    console.log(`   Estimated tokens: ${prediction.token_estimate.toLocaleString()}`);
    
    console.log(chalk.bold('\n📊 Confidence Interval (95%):'));
    console.log(`   Lower bound: $${prediction.confidence_interval[0].toFixed(4)}`);
    console.log(`   Upper bound: $${prediction.confidence_interval[1].toFixed(4)}`);
    
    // Budget warnings
    if (prediction.estimated_cost > 10) {
      console.log(chalk.yellow('\n⚠️  High cost prediction! Consider:'));
      console.log(`   • Reducing sample count`);
      console.log(`   • Using a more efficient model`);
      console.log(`   • Setting a budget limit`);
    }
    
    if (prediction.estimated_cost < 0.01) {
      console.log(chalk.green('\n✅ Low cost evaluation - good to go!'));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to predict costs:'), error instanceof Error ? error.message : String(error));
  }
}

async function costEstimate(model: string, sampleCount: number, inputLength: number, outputLength: number): Promise<void> {
  try {
    console.log(chalk.blue('💡 Quick Cost Estimate'));
    console.log(chalk.gray(`Model: ${model} | Samples: ${sampleCount} | Input: ${inputLength} chars | Output: ${outputLength} chars`));
    
    const costManager = new CostManager();
    const estimate = costManager.estimateEvaluationCost(model, sampleCount, inputLength, outputLength);
    
    console.log(chalk.bold('\n💰 Estimate Results:'));
    console.log(`   Total estimated cost: ${chalk.green('$' + estimate.toFixed(4))}`);
    console.log(`   Cost per sample: $${(estimate / sampleCount).toFixed(4)}`);
    console.log(`   Estimated tokens: ${Math.ceil((inputLength + outputLength) / 4 * sampleCount).toLocaleString()}`);
    
    // Budget suggestions
    const dailyBudget = estimate * 10; // 10x for daily budget
    const monthlyBudget = estimate * 100; // 100x for monthly budget
    
    console.log(chalk.bold('\n📝 Budget Suggestions:'));
    console.log(`   For 10x this evaluation: $${dailyBudget.toFixed(2)}`);
    console.log(`   For 100x this evaluation: $${monthlyBudget.toFixed(2)}`);
    
    if (estimate > 1) {
      console.log(chalk.yellow('\n⚠️  Consider using a more cost-effective model for large-scale testing'));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to estimate costs:'), error instanceof Error ? error.message : String(error));
  }
}

async function budgetManage(evalName: string, amount: number | undefined): Promise<void> {
  try {
    const costManager = new CostManager();
    
    if (amount === undefined) {
      // Check current budget status
      console.log(chalk.blue(`💳 Budget Status for ${evalName}`));
      
      const status = costManager.checkBudgetStatus(evalName);
      if (!status) {
        console.log(chalk.yellow('📭 No budget set for this evaluation'));
        console.log(chalk.gray('   Use: npx ts-node src/cli.ts costs budget ' + evalName + ' <amount>'));
      } else {
        console.log(chalk.bold('\n💰 Current Status:'));
        console.log(`   Budget limit: $${status.budget_limit.toFixed(2)}`);
        console.log(`   Current cost: $${status.current_cost.toFixed(4)}`);
        console.log(`   Used: ${status.percentage_used.toFixed(1)}%`);
        
        const remaining = status.budget_limit - status.current_cost;
        console.log(`   Remaining: $${remaining.toFixed(4)}`);
        
        if (status.type === 'exceeded') {
          console.log(chalk.red(`\n🚨 ${status.message}`));
        } else if (status.type === 'limit_reached') {
          console.log(chalk.yellow(`\n⚠️  ${status.message}`));
        } else if (status.type === 'warning') {
          console.log(chalk.yellow(`\n⚠️  ${status.message}`));
        } else {
          console.log(chalk.green('\n✅ Budget is healthy'));
        }
      }
    } else {
      // Set new budget
      console.log(chalk.blue(`💳 Setting Budget for ${evalName}`));
      
      costManager.setBudget(evalName, amount);
      console.log(chalk.green(`✅ Budget set: $${amount.toFixed(2)}`));
      
      // Check if there's already spending
      const status = costManager.checkBudgetStatus(evalName);
      if (status && status.current_cost > 0) {
        console.log(chalk.gray(`\n📊 Current usage: $${status.current_cost.toFixed(4)} (${status.percentage_used.toFixed(1)}%)`));
      }
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to manage budget:'), error instanceof Error ? error.message : String(error));
  }
}

// ========== DASHBOARD COMMAND ==========

async function startDashboard(port: number, registryPath: string): Promise<void> {
  try {
    console.log(chalk.blue('🌐 Starting Analytics Dashboard'));
    console.log(chalk.gray(`Port: ${port} | Registry: ${registryPath}`));
    
    const { DashboardServer } = await import('./dashboard/dashboard-server');
    const store = new EvaluationStore();
    const dashboard = new DashboardServer(store);
    
    console.log(chalk.bold('\n📊 Available Endpoints:'));
    console.log(chalk.cyan('   Main Dashboard:'));
    console.log(`     GET  http://localhost:${port}/api/dashboard`);
    console.log(chalk.cyan('\n   Token Analytics:'));
    console.log(`     GET  http://localhost:${port}/api/analytics/tokens`);
    console.log(`     GET  http://localhost:${port}/api/analytics/tokens/trends`);
    console.log(`     GET  http://localhost:${port}/api/analytics/tokens/efficiency`);
    console.log(chalk.cyan('\n   Cost Analysis:'));
    console.log(`     GET  http://localhost:${port}/api/analytics/costs/breakdown`);
    console.log(`     GET  http://localhost:${port}/api/analytics/costs/predict`);
    console.log(`     GET  http://localhost:${port}/api/costs/estimate`);
    console.log(chalk.cyan('\n   Budget Management:'));
    console.log(`     POST http://localhost:${port}/api/budget/:evalName`);
    console.log(`     GET  http://localhost:${port}/api/budget/:evalName/status`);
    console.log(chalk.cyan('\n   Health Check:'));
    console.log(`     GET  http://localhost:${port}/api/health`);
    
    dashboard.start(port);
    
    console.log(chalk.green(`\n🚀 Dashboard started successfully!`));
    console.log(chalk.bold(`🌐 Access at: http://localhost:${port}`));
    console.log(chalk.gray('Press Ctrl+C to stop the server'));
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to start dashboard:'), error instanceof Error ? error.message : String(error));
  }
}

// ========== CACHE COMMANDS ==========

async function cacheStats(registryPath: string): Promise<void> {
  try {
    console.log(chalk.blue('📊 Cache Statistics'));
    
    const runner = new EvalRunner(registryPath);
    const stats = await runner.getCacheStats();
    
    console.log(chalk.bold('\n💾 Cache Performance:'));
    console.log(`   Total requests: ${stats.total_requests.toLocaleString()}`);
    console.log(`   Cache hits: ${stats.cache_hits.toLocaleString()}`);
    console.log(`   Cache misses: ${stats.cache_misses.toLocaleString()}`);
    
    const hitRate = stats.hit_rate * 100;
    const hitRateColor = hitRate > 70 ? chalk.green : hitRate > 40 ? chalk.yellow : chalk.red;
    console.log(`   Hit rate: ${hitRateColor(hitRate.toFixed(1) + '%')}`);
    
    if (stats.memory_usage) {
      const memoryMB = (stats.memory_usage / (1024 * 1024)).toFixed(2);
      console.log(`   Memory usage: ${memoryMB}MB`);
    }
    
    console.log(`   Provider: ${stats.redis_connected ? 'Redis' : 'In-Memory'}`);
    
    if (stats.total_requests > 0 && stats.cache_hits > 0) {
      console.log(chalk.green('\n✨ Performance Impact:'));
      console.log(`   Estimated API calls saved: ${stats.cache_hits.toLocaleString()}`);
      console.log(`   Estimated cost savings: ${(stats.cache_hits * 0.002).toFixed(4)} USD`);
    }
    
    await runner.cleanup();
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to get cache stats:'), error instanceof Error ? error.message : String(error));
  }
}

async function cacheClear(registryPath: string): Promise<void> {
  try {
    console.log(chalk.blue('🧹 Clearing Cache'));
    
    const runner = new EvalRunner(registryPath);
    await runner.clearCache();
    
    console.log(chalk.green('✅ Cache cleared successfully'));
    await runner.cleanup();
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to clear cache:'), error instanceof Error ? error.message : String(error));
  }
}

async function cacheInvalidate(model: string, registryPath: string): Promise<void> {
  try {
    console.log(chalk.blue(`🗑️  Invalidating Cache for Model: ${model}`));
    
    const runner = new EvalRunner(registryPath);
    const deletedCount = await runner.invalidateModelCache(model);
    
    if (deletedCount > 0) {
      console.log(chalk.green(`✅ Invalidated ${deletedCount} cache entries for model: ${model}`));
    } else {
      console.log(chalk.yellow(`ℹ️  No cache entries found for model: ${model}`));
    }
    
    await runner.cleanup();
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to invalidate cache:'), error instanceof Error ? error.message : String(error));
  }
}

// ========== METRICS COMMANDS ==========

async function metricsList(): Promise<void> {
  try {
    console.log(chalk.blue('📈 Available Custom Metrics'));
    
    const { metricsRegistry } = await import('./metrics/custom-metrics');
    const metrics = metricsRegistry.getAllMetrics();
    const stats = metricsRegistry.getRegistryStats();
    
    console.log(chalk.bold(`\n📊 Registry Stats:`));
    console.log(`   Total metrics: ${stats.total_metrics}`);
    console.log(`   Enabled metrics: ${stats.enabled_metrics}`);
    
    console.log(chalk.bold('\n📈 Available Metrics:'));
    
    // Group by category
    const metricsByCategory = metrics.reduce((acc, metric) => {
      if (!acc[metric.category]) acc[metric.category] = [];
      acc[metric.category].push(metric);
      return acc;
    }, {} as Record<string, typeof metrics>);

    for (const [category, categoryMetrics] of Object.entries(metricsByCategory)) {
      const categoryEmoji = getCategoryEmojiForCLI(category);
      console.log(`\n   ${categoryEmoji} ${category.toUpperCase()}:`);
      
      for (const metric of categoryMetrics) {
        const status = metric.shouldCalculate() ? chalk.green('✓ enabled') : chalk.gray('✗ disabled');
        const trend = metric.higher_is_better ? '↗️  (higher better)' : '↙️  (lower better)';
        console.log(`      ${metric.name.padEnd(20)} ${status} ${trend}`);
        console.log(`      ${chalk.gray(metric.description)}`);
      }
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to list metrics:'), error instanceof Error ? error.message : String(error));
  }
}

async function metricsTest(evalName: string, registryPath: string): Promise<void> {
  try {
    console.log(chalk.blue(`🧪 Testing Custom Metrics Framework`));
    
    // Since we don't have historical evaluation results easily accessible,
    // we'll create a sample test to demonstrate the metrics system
    console.log(chalk.gray(`\n📊 Creating sample evaluation data for metrics testing...`));
    
    // Mock some evaluation results for testing
    const sampleResults: any[] = [
      {
        sample_id: 'test_1',
        input: [{ role: 'user', content: 'What is 2+2?' }],
        ideal: ['4', 'four'],
        completion: { content: '4', usage: { prompt_tokens: 10, completion_tokens: 1, total_tokens: 11 } },
        score: 1.0,
        passed: true,
        correct: true
      },
      {
        sample_id: 'test_2',
        input: [{ role: 'user', content: 'What is the capital of France?' }],
        ideal: 'Paris',
        completion: { content: 'Paris is the capital of France.', usage: { prompt_tokens: 12, completion_tokens: 8, total_tokens: 20 } },
        score: 1.0,
        passed: true,
        correct: true
      },
      {
        sample_id: 'test_3',
        input: [{ role: 'user', content: 'Explain quantum computing' }],
        ideal: 'quantum computing explanation',
        completion: { content: 'Quantum computing uses quantum mechanics principles...', usage: { prompt_tokens: 8, completion_tokens: 25, total_tokens: 33 } },
        score: 0.8,
        passed: true,
        correct: false
      }
    ];

    const mockReport: any = {
      eval_name: 'metrics_test',
      model: 'test-model',
      total_samples: 3,
      correct: 2,
      incorrect: 1,
      score: 0.867,
      results: sampleResults,
      token_usage: {
        total_prompt_tokens: 30,
        total_completion_tokens: 34,
        total_tokens: 64,
        average_tokens_per_sample: 21,
        max_tokens_per_sample: 33,
        min_tokens_per_sample: 11,
        estimated_cost: 0.0012
      }
    };
    
    // Calculate custom metrics
    const { metricsRegistry } = await import('./metrics/custom-metrics');
    const customMetrics = await metricsRegistry.calculateAllMetrics(sampleResults, mockReport);
    
    if (customMetrics.length === 0) {
      console.log(chalk.yellow('\n⚠️  No custom metrics calculated'));
      return;
    }
    
    console.log(chalk.bold(`\n📈 Custom Metrics Results:`));
    console.log(chalk.gray(`   Sample data: ${sampleResults.length} samples, ${mockReport.score*100}% accuracy\n`));
    
    // Group by category and display
    const metricsByCategory = customMetrics.reduce((acc, metric) => {
      if (!acc[metric.category]) acc[metric.category] = [];
      acc[metric.category].push(metric);
      return acc;
    }, {} as Record<string, typeof customMetrics>);

    for (const [category, metrics] of Object.entries(metricsByCategory)) {
      const categoryEmoji = getCategoryEmojiForCLI(category);
      console.log(`   ${categoryEmoji} ${category.toUpperCase()}:`);
      
      for (const metric of metrics) {
        const trend = metric.higher_is_better ? '↗️' : '↙️';
        const formattedValue = formatMetricValueForCLI(metric.value);
        console.log(`      ${trend} ${metric.display_name}: ${chalk.bold(formattedValue)}`);
        console.log(`         ${chalk.gray(metric.description)}`);
        
        if (metric.metadata) {
          const metadataStr = Object.entries(metric.metadata)
            .map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toFixed(4) : v}`)
            .join(', ');
          console.log(`         ${chalk.gray('Details: ' + metadataStr)}`);
        }
      }
      console.log('');
    }
    
    console.log(chalk.green('✅ Custom metrics framework working correctly!'));
    console.log(chalk.gray('\n💡 To test with real data, run an evaluation first:'));
    console.log(chalk.gray('   npx llm-eval gpt-3.5-turbo math'));
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to test metrics:'), error instanceof Error ? error.message : String(error));
  }
}

// Helper functions for CLI
function getCategoryEmojiForCLI(category: string): string {
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

function formatMetricValueForCLI(value: number): string {
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

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('💥 Uncaught error:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('💥 Unhandled rejection:'), reason);
  process.exit(1);
});

// Run CLI if this is the main module
if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red('💥 CLI error:'), error.message);
    process.exit(1);
  });
}
