// Example: Adding Anthropic Claude support
// 1. Install: npm install @anthropic-ai/sdk
// 2. Add this to src/llm-client.ts:

import { Anthropic } from '@anthropic-ai/sdk';

export class AnthropicClient implements LLMClient {
  private client: Anthropic;
  private model: string;

  constructor(model: string, apiKey?: string) {
    this.model = model;
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  async complete(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResult> {
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const userMessages = messages.filter(m => m.role !== 'system');

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options?.max_tokens || 4000,
      temperature: options?.temperature,
      system: systemMessage,
      messages: userMessages as any,
    });

    return {
      content: response.content[0].type === 'text' ? response.content[0].text : '',
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      model: this.model,
    };
  }

  getModel(): string { return this.model; }
}

// 3. Update createLLMClient function:
export function createLLMClient(model: string): LLMClient {
  if (model.startsWith('gpt-') || model.startsWith('o1-')) {
    return new OpenAIClient(model);
  }
  if (model.startsWith('claude-')) {
    return new AnthropicClient(model);
  }
  // ... add more providers
}

// Then you could run:
// npx ts-node src/cli.ts claude-3-sonnet-20240229 math-basic
