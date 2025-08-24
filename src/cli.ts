#!/usr/bin/env node

/**
 * Command-line interface for the LLM evaluation framework
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import { EvalRunner } from './eval-runner';
import { Registry } from './registry';
import { Logger } from './logger';
import { RunOptions } from './types';

async function main() {
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
      dry_run: argv['dry-run'] as boolean,
      verbose: argv.verbose as boolean,
      seed: argv.seed as number | undefined,
    };

    await runEval(options);
  }
}

async function runEval(options: RunOptions): Promise<void> {
  try {
    console.log(chalk.blue('🧠 LLM Evaluation Framework'));
    console.log(chalk.gray(`Model: ${options.model} | Eval: ${options.eval}`));
    
    if (options.dry_run) {
      console.log(chalk.yellow('⚠️  DRY RUN MODE - No API calls will be made'));
    }

    const runner = new EvalRunner(options.registry_path);
    const report = await runner.runEval(options);

    // Generate log file if not specified
    if (!options.log_to_file) {
      options.log_to_file = Logger.generateLogPath(
        report.run_id,
        options.model,
        options.eval
      );
      
      const runner2 = new EvalRunner(options.registry_path);
      await runner2.runEval({ ...options, log_to_file: options.log_to_file });
    }

    console.log(chalk.green(`\n📁 Detailed logs saved to: ${options.log_to_file}`));
    
    // Color-code the results
    const scoreColor = report.score >= 0.8 ? chalk.green : 
                      report.score >= 0.6 ? chalk.yellow : chalk.red;
    
    console.log(chalk.bold('\n🎯 Final Score: ') + scoreColor(`${(report.score * 100).toFixed(1)}%`));

  } catch (error) {
    console.error(chalk.red('❌ Evaluation failed:'), error instanceof Error ? error.message : String(error));
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
