/**
 * Registry system for managing evaluations and configurations
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { EvalConfig, EvalRegistry, EvalTemplate, BasicEvalArgs, ModelGradedEvalArgs } from './types';
import { BasicEval } from './templates/basic-eval';
import { ModelGradedEval } from './templates/model-graded-eval';
import { ChoiceBasedEval, ChoiceBasedEvalArgs } from './templates/choice-based-eval';
import { LLMClient } from './types';

export class Registry {
  private configs: EvalRegistry = {};
  private registryPath: string;

  constructor(registryPath: string = './registry') {
    this.registryPath = registryPath;
  }

  /**
   * Load all evaluation configurations from the registry directory
   */
  async loadRegistry(): Promise<void> {
    const evalsDir = path.join(this.registryPath, 'evals');
    
    if (!fs.existsSync(evalsDir)) {
      throw new Error(`Registry directory not found: ${evalsDir}`);
    }

    const files = fs.readdirSync(evalsDir).filter(file => 
      file.endsWith('.yaml') || file.endsWith('.yml')
    );

    for (const file of files) {
      const filePath = path.join(evalsDir, file);
      await this.loadConfigFile(filePath);
    }
  }

  /**
   * Load a single configuration file
   */
  private async loadConfigFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = yaml.parse(content);

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid YAML structure');
      }

      Object.entries(data).forEach(([key, config]) => {
        if (this.isValidConfig(config)) {
          this.configs[key] = config as EvalConfig;
        } else {
          console.warn(`Invalid config for ${key} in ${filePath}`);
        }
      });
    } catch (error) {
      throw new Error(`Failed to load config file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a specific evaluation configuration
   */
  getConfig(evalName: string): EvalConfig {
    const config = this.configs[evalName];
    if (!config) {
      throw new Error(`Evaluation '${evalName}' not found in registry. Available: ${Object.keys(this.configs).join(', ')}`);
    }
    return config;
  }

  /**
   * List all available evaluations
   */
  listEvals(): string[] {
    return Object.keys(this.configs);
  }

  /**
   * Create an evaluation template instance
   */
  createTemplate(evalName: string, gradingClient?: LLMClient): EvalTemplate {
    const config = this.getConfig(evalName);
    const className = config.class.split(':')[1] || config.class;

    switch (className) {
      case 'BasicEval':
        return new BasicEval(config.args as BasicEvalArgs);
      
      case 'ModelGradedEval':
        if (!gradingClient) {
          throw new Error('Grading client is required for model-graded evaluations');
        }
        return new ModelGradedEval(config.args as ModelGradedEvalArgs, gradingClient);
      
      case 'ChoiceBasedEval':
        if (!gradingClient) {
          throw new Error('Grading client is required for choice-based evaluations');
        }
        return new ChoiceBasedEval(config.args as ChoiceBasedEvalArgs, gradingClient);
      
      default:
        throw new Error(`Unknown evaluation template: ${className}`);
    }
  }

  /**
   * Get the dataset path for an evaluation
   */
  getDatasetPath(evalName: string): string {
    const config = this.getConfig(evalName);
    const samplesPath = config.args.samples_jsonl as string;
    
    if (!samplesPath) {
      throw new Error(`No samples_jsonl specified for evaluation ${evalName}`);
    }

    // If it's a relative path, make it relative to registry/data
    if (!path.isAbsolute(samplesPath)) {
      return path.join(this.registryPath, 'data', samplesPath);
    }
    
    return samplesPath;
  }

  /**
   * Validate a configuration object
   */
  private isValidConfig(config: any): boolean {
    return (
      config &&
      typeof config === 'object' &&
      typeof config.id === 'string' &&
      typeof config.description === 'string' &&
      Array.isArray(config.metrics) &&
      typeof config.class === 'string' &&
      config.args &&
      typeof config.args === 'object'
    );
  }

  /**
   * Create a default registry structure
   */
  static async createDefaultRegistry(registryPath: string): Promise<void> {
    const evalsDir = path.join(registryPath, 'evals');
    const dataDir = path.join(registryPath, 'data');

    // Create directories
    fs.mkdirSync(evalsDir, { recursive: true });
    fs.mkdirSync(dataDir, { recursive: true });

    // Create example evaluation config
    const exampleConfig = {
      'math-basic': {
        id: 'math-basic.dev.v0',
        description: 'Basic math evaluation using exact matching',
        metrics: ['accuracy'],
        class: 'BasicEval',
        args: {
          samples_jsonl: 'math/basic.jsonl',
          match_type: 'exact',
          case_sensitive: false,
        },
      },
      'math-basic.dev.v0': {
        id: 'math-basic.dev.v0',
        description: 'Basic math evaluation using exact matching',
        metrics: ['accuracy'],
        class: 'BasicEval',
        args: {
          samples_jsonl: 'math/basic.jsonl',
          match_type: 'exact',
          case_sensitive: false,
        },
      },
    };

    const configPath = path.join(evalsDir, 'math.yaml');
    fs.writeFileSync(configPath, yaml.stringify(exampleConfig));

    console.log(`Created default registry at ${registryPath}`);
  }
}
