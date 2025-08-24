/**
 * LLM client implementations for different providers
 */

import { OpenAI } from 'openai';
import { ChatMessage, CompletionOptions, CompletionResult, LLMClient } from './types';

/**
 * OpenAI client implementation
 */
export class OpenAIClient implements LLMClient {
  private client: OpenAI;
  private model: string;

  constructor(model: string = 'gpt-3.5-turbo', apiKey?: string) {
    this.model = model;
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  async complete(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResult> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: options?.temperature ?? 0.0,
        max_tokens: options?.max_tokens,
        top_p: options?.top_p,
        frequency_penalty: options?.frequency_penalty,
        presence_penalty: options?.presence_penalty,
        stop: options?.stop,
      });

      const choice = response.choices[0];
      if (!choice.message.content) {
        throw new Error('Empty completion received');
      }

      return {
        content: choice.message.content,
        usage: response.usage ? {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens,
        } : undefined,
        model: response.model,
        finish_reason: choice.finish_reason || undefined,
      };
    } catch (error) {
      throw new Error(`OpenAI completion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getModel(): string {
    return this.model;
  }
}

/**
 * Factory function to create LLM clients
 */
export function createLLMClient(model: string): LLMClient {
  // Determine provider from model name
  if (model.startsWith('gpt-') || model.startsWith('o1-')) {
    return new OpenAIClient(model);
  }
  
  // Add more providers here as needed
  // if (model.startsWith('claude-')) {
  //   return new AnthropicClient(model);
  // }
  
  // Default to OpenAI for unknown models
  console.warn(`Unknown model provider for ${model}, defaulting to OpenAI`);
  return new OpenAIClient(model);
}
