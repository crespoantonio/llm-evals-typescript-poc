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
 * Ollama client implementation for local models
 */
export class OllamaClient implements LLMClient {
  private model: string;
  private baseUrl: string;

  constructor(model: string = 'llama2', baseUrl: string = 'http://localhost:11434') {
    this.model = model.replace('ollama/', ''); // Remove ollama/ prefix if present
    this.baseUrl = baseUrl;
  }

  async complete(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResult> {
    try {
      // Convert messages to Ollama format
      const prompt = this.formatMessagesAsPrompt(messages);
      
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: options?.temperature ?? 0.0,
            num_predict: options?.max_tokens,
            top_p: options?.top_p,
            frequency_penalty: options?.frequency_penalty,
            presence_penalty: options?.presence_penalty,
            stop: options?.stop,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} ${errorText}`);
      }

      const data = await response.json() as {
        response: string;
        prompt_eval_count?: number;
        eval_count?: number;
        done?: boolean;
      };
      
      if (!data.response) {
        throw new Error('Empty response from Ollama');
      }

      return {
        content: data.response,
        usage: {
          prompt_tokens: data.prompt_eval_count || 0,
          completion_tokens: data.eval_count || 0,
          total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        model: this.model,
        finish_reason: data.done ? 'stop' : undefined,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error(`Failed to connect to Ollama at ${this.baseUrl}. Make sure Ollama is running with: ollama serve`);
      }
      throw new Error(`Ollama completion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getModel(): string {
    return this.model;
  }

  private formatMessagesAsPrompt(messages: ChatMessage[]): string {
    // Simple prompt formatting for Ollama
    return messages
      .map(msg => {
        switch (msg.role) {
          case 'system':
            return `System: ${msg.content}`;
          case 'user':
            return `Human: ${msg.content}`;
          case 'assistant':
            return `Assistant: ${msg.content}`;
          default:
            return msg.content;
        }
      })
      .join('\n\n') + '\n\nAssistant:';
  }
}

/**
 * Hugging Face Inference API client implementation
 */
export class HuggingFaceClient implements LLMClient {
  private model: string;
  private apiKey?: string;
  private baseUrl: string;

  constructor(model: string, apiKey?: string, baseUrl: string = 'https://api-inference.huggingface.co/models') {
    // Remove hf/ prefix if present
    this.model = model.replace('hf/', '');
    this.apiKey = apiKey || process.env.HUGGINGFACE_API_KEY;
    this.baseUrl = baseUrl;
  }

  async complete(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResult> {
    try {
      // Convert messages to a single prompt for most HF models
      const prompt = this.formatMessagesAsPrompt(messages);
      
      const response = await fetch(`${this.baseUrl}/${this.model}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            temperature: options?.temperature ?? 0.7,
            max_new_tokens: options?.max_tokens || 256,
            top_p: options?.top_p,
            repetition_penalty: options?.frequency_penalty ? 1 + options.frequency_penalty : undefined,
            stop_sequences: options?.stop,
            return_full_text: false,
          },
          options: {
            wait_for_model: true,
            use_cache: false,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 503) {
          throw new Error(`Model ${this.model} is loading. Try again in a few moments.`);
        }
        if (response.status === 401) {
          throw new Error(`Unauthorized: Invalid or missing Hugging Face API key. Set HUGGINGFACE_API_KEY environment variable.`);
        }
        throw new Error(`Hugging Face API error: ${response.status} ${errorText}`);
      }

      const data = await response.json() as Array<{
        generated_text: string;
      }> | { error: string };

      if ('error' in data) {
        throw new Error(`Hugging Face API error: ${data.error}`);
      }

      if (!Array.isArray(data) || data.length === 0 || !data[0].generated_text) {
        throw new Error('Empty or invalid response from Hugging Face');
      }

      const generatedText = data[0].generated_text;
      
      // Estimate token usage (approximate)
      const promptTokens = Math.ceil(prompt.length / 4);
      const completionTokens = Math.ceil(generatedText.length / 4);

      return {
        content: generatedText,
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: promptTokens + completionTokens,
        },
        model: this.model,
        finish_reason: 'stop',
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error(`Failed to connect to Hugging Face API. Check your internet connection.`);
      }
      throw new Error(`Hugging Face completion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getModel(): string {
    return this.model;
  }

  private formatMessagesAsPrompt(messages: ChatMessage[]): string {
    // Format messages for instruction-following models
    return messages
      .map(msg => {
        switch (msg.role) {
          case 'system':
            return `### Instruction:\n${msg.content}`;
          case 'user':
            return `### User:\n${msg.content}`;
          case 'assistant':
            return `### Assistant:\n${msg.content}`;
          default:
            return msg.content;
        }
      })
      .join('\n\n') + '\n\n### Assistant:\n';
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
  
  if (model.startsWith('ollama/') || model.includes('ollama')) {
    return new OllamaClient(model);
  }
  
  if (model.startsWith('hf/') || model.includes('huggingface.co')) {
    return new HuggingFaceClient(model);
  }
  
  // Add more providers here as needed
  // if (model.startsWith('claude-')) {
  //   return new AnthropicClient(model);
  // }
  
  // Default to OpenAI for unknown models
  console.warn(`Unknown model provider for ${model}, defaulting to OpenAI`);
  return new OpenAIClient(model);
}
