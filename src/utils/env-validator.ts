/**
 * Environment validation utilities
 * Detects common .env file issues and provides helpful error messages
 */

import chalk from 'chalk';
import * as fs from 'fs';

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  loadedVars: number;
}

/**
 * Validates environment setup and detects common .env issues
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if .env file exists
  const envExists = fs.existsSync('.env');
  if (!envExists) {
    warnings.push('No .env file found. You may need to create one for API keys.');
  }

  // Count loaded environment variables from common prefixes
  const commonEnvVars = Object.keys(process.env).filter(key => 
    key.startsWith('OPENAI_') || 
    key.startsWith('ANTHROPIC_') || 
    key.startsWith('HUGGINGFACE_') ||
    key.startsWith('SLACK_') ||
    key.startsWith('SMTP_')
  );

  const loadedVars = commonEnvVars.length;

  // Check for common .env issues
  if (envExists && loadedVars === 0) {
    errors.push('🚨 .env file exists but no variables loaded! This usually means:');
    errors.push('   • File encoding issue (should be UTF-8, not UTF-16)');
    errors.push('   • Invalid format (use KEY=value, no spaces around =)');
    errors.push('   • File corruption or BOM (Byte Order Mark) issue');
    errors.push('');
    errors.push('💡 Fix: Save your .env file as UTF-8 encoding');
  }

  // Check for specific API key issues
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    if (openaiKey === 'your_openai_api_key_here' || openaiKey === 'your_api_key_here') {
      errors.push('🔑 OPENAI_API_KEY is still a placeholder. Replace with your real API key from https://platform.openai.com/api-keys');
    } else if (!openaiKey.startsWith('sk-')) {
      errors.push('🔑 OPENAI_API_KEY format looks incorrect. Should start with "sk-"');
    } else if (openaiKey.length < 40) {
      errors.push('🔑 OPENAI_API_KEY seems too short. Should be 51+ characters');
    }
  }

  // Check for anthropic key if present
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey && anthropicKey === 'your_anthropic_api_key_here') {
    warnings.push('🔑 ANTHROPIC_API_KEY is placeholder (optional for Claude models)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    loadedVars
  };
}

/**
 * Print environment validation results with colored output
 */
export function printEnvValidation(result: EnvValidationResult): void {
  // Only show validation output if there are errors or this is verbose mode
  if (result.errors.length === 0 && result.warnings.length === 0) {
    return; // Silent success
  }

  console.log(chalk.blue('🔧 Environment Validation'));
  
  if (result.loadedVars > 0 && result.errors.length === 0) {
    console.log(chalk.green(`✅ Loaded ${result.loadedVars} environment variable(s)`));
  }

  // Only show actionable warnings (skip minor optional ones)
  const actionableWarnings = result.warnings.filter(warning => 
    !warning.includes('placeholder (optional')
  );
  
  if (actionableWarnings.length > 0) {
    console.log(chalk.yellow('\n⚠️  Warnings:'));
    actionableWarnings.forEach(warning => {
      console.log(chalk.yellow(`   ${warning}`));
    });
  }

  // Print errors
  if (result.errors.length > 0) {
    console.log(chalk.red('\n❌ Environment Issues:'));
    result.errors.forEach(error => {
      console.log(chalk.red(`   ${error}`));
    });
    
    console.log(chalk.cyan('\n📖 Quick Fix Guide:'));
    console.log(chalk.cyan('   1. Open your .env file'));
    console.log(chalk.cyan('   2. Ensure it\'s saved as UTF-8 encoding'));
    console.log(chalk.cyan('   3. Format: OPENAI_API_KEY=sk-your-actual-key'));
    console.log(chalk.cyan('   4. No spaces around the = sign'));
    console.log(chalk.cyan('   5. No quotes unless the value contains spaces'));
  }

  if (result.isValid && (actionableWarnings.length > 0 || result.errors.length > 0)) {
    console.log(chalk.green('\n✅ Environment setup looks good!'));
  }
}

/**
 * Validates environment for OpenAI API calls specifically
 */
export function validateOpenAIEnvironment(): boolean {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error(chalk.red('❌ OPENAI_API_KEY not found in environment'));
    console.log(chalk.yellow('💡 Create a .env file with: OPENAI_API_KEY=sk-your-key-here'));
    return false;
  }

  if (apiKey === 'your_openai_api_key_here' || apiKey === 'your_api_key_here') {
    console.error(chalk.red('❌ OPENAI_API_KEY is still a placeholder'));
    console.log(chalk.yellow('💡 Replace with your real API key from https://platform.openai.com/api-keys'));
    return false;
  }

  if (!apiKey.startsWith('sk-')) {
    console.error(chalk.red('❌ OPENAI_API_KEY format incorrect (should start with "sk-")'));
    return false;
  }

  return true;
}
