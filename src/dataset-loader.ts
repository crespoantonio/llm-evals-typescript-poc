/**
 * Dataset loading and validation utilities
 */

import * as fs from 'fs';
import * as path from 'path';
import { EvalDataset, EvalSample, ChatMessage } from './types';

/**
 * Load a JSONL dataset from file
 */
export async function loadDataset(filePath: string): Promise<EvalDataset> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Dataset file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const samples: EvalSample[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines
    
    try {
      const data = JSON.parse(lines[i]);
      const sample = validateSample(data, i + 1);
      samples.push(sample);
    } catch (error) {
      throw new Error(`Invalid JSON at line ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (samples.length === 0) {
    throw new Error('No valid samples found in dataset');
  }

  return {
    samples,
    metadata: {
      source: filePath,
      loaded_at: new Date().toISOString(),
      sample_count: samples.length,
    },
  };
}

/**
 * Validate and normalize a single sample
 */
function validateSample(data: any, lineNumber: number): EvalSample {
  if (!data || typeof data !== 'object') {
    throw new Error(`Sample at line ${lineNumber} must be an object`);
  }

  // Validate input
  if (!Array.isArray(data.input)) {
    throw new Error(`Sample at line ${lineNumber}: 'input' must be an array`);
  }

  const input: ChatMessage[] = [];
  for (let i = 0; i < data.input.length; i++) {
    const msg = data.input[i];
    if (!msg || typeof msg !== 'object') {
      throw new Error(`Sample at line ${lineNumber}: input[${i}] must be an object`);
    }
    if (!msg.role || !['system', 'user', 'assistant'].includes(msg.role)) {
      throw new Error(`Sample at line ${lineNumber}: input[${i}].role must be 'system', 'user', or 'assistant'`);
    }
    if (typeof msg.content !== 'string') {
      throw new Error(`Sample at line ${lineNumber}: input[${i}].content must be a string`);
    }
    input.push({
      role: msg.role,
      content: msg.content,
    });
  }

  // Validate ideal
  if (data.ideal === undefined || data.ideal === null) {
    throw new Error(`Sample at line ${lineNumber}: 'ideal' is required`);
  }

  let ideal: string | string[];
  if (typeof data.ideal === 'string') {
    ideal = data.ideal;
  } else if (Array.isArray(data.ideal)) {
    ideal = data.ideal.map((item: any) => {
      if (typeof item !== 'string') {
        throw new Error(`Sample at line ${lineNumber}: all items in 'ideal' array must be strings`);
      }
      return item;
    });
  } else {
    throw new Error(`Sample at line ${lineNumber}: 'ideal' must be a string or array of strings`);
  }

  return {
    input,
    ideal,
    metadata: data.metadata || {},
  };
}

/**
 * Save dataset to JSONL file
 */
export async function saveDataset(dataset: EvalDataset, filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const lines = dataset.samples.map(sample => JSON.stringify({
    input: sample.input,
    ideal: sample.ideal,
    ...(sample.metadata && Object.keys(sample.metadata).length > 0 ? { metadata: sample.metadata } : {}),
  }));

  fs.writeFileSync(filePath, lines.join('\n'));
}

/**
 * Utility to create a sample dataset
 */
export function createSampleDataset(samples: Array<{
  systemPrompt?: string;
  userInput: string;
  ideal: string | string[];
  metadata?: Record<string, any>;
}>): EvalDataset {
  return {
    samples: samples.map(sample => ({
      input: [
        ...(sample.systemPrompt ? [{ role: 'system' as const, content: sample.systemPrompt }] : []),
        { role: 'user' as const, content: sample.userInput },
      ],
      ideal: sample.ideal,
      metadata: sample.metadata || {},
    })),
  };
}
