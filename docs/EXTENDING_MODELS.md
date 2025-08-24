# Adding Support for New LLM Providers

## Example: Adding Anthropic Claude Support

### 1. Install the Anthropic SDK
```bash
npm install @anthropic-ai/sdk
```

### 2. Create the Client Implementation

Add this to `src/llm-client.ts`:

```typescript
import { Anthropic } from '@anthropic-ai/sdk';

export class AnthropicClient implements LLMClient {
  private client: Anthropic;
  private model: string;

  constructor(model: string = 'claude-3-sonnet-20240229', apiKey?: string) {
    this.model = model;
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  async complete(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResult> {
    try {
      // Convert system message to system parameter
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      const userMessages = messages.filter(m => m.role !== 'system');

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options?.max_tokens || 4000,
        temperature: options?.temperature,
        system: systemMessage || undefined,
        messages: userMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
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
    } catch (error) {
      throw new Error(`Anthropic completion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getModel(): string {
    return this.model;
  }
}
```

### 3. Update the Factory Function

Update the `createLLMClient` function:

```typescript
export function createLLMClient(model: string): LLMClient {
  if (model.startsWith('gpt-') || model.startsWith('o1-')) {
    return new OpenAIClient(model);
  }
  
  if (model.startsWith('claude-')) {
    return new AnthropicClient(model);
  }
  
  if (model.startsWith('gemini-')) {
    return new GoogleClient(model);
  }
  
  if (model.includes('local') || model.includes('ollama')) {
    return new LocalClient(model);
  }
  
  console.warn(`Unknown model provider for ${model}, defaulting to OpenAI`);
  return new OpenAIClient(model);
}
```

### 4. Set API Keys

```bash
export ANTHROPIC_API_KEY="your-anthropic-api-key"
export GOOGLE_API_KEY="your-google-api-key"
```

## Supported Model Examples

Once extended, you could run:

```bash
# OpenAI models
npm run dev gpt-4 math-basic
npm run dev gpt-3.5-turbo sql-basic

# Anthropic models
npm run dev claude-3-sonnet-20240229 math-basic
npm run dev claude-3-opus-20240229 sql-graded

# Google models
npm run dev gemini-pro math-basic

# Local models
npm run dev ollama/llama2 math-basic
```

## Provider-Specific Features

Each provider can implement provider-specific features:

- **OpenAI**: Function calling, structured outputs
- **Anthropic**: System prompts, tool use
- **Google**: Safety settings, custom parameters
- **Local**: Custom endpoints, local model management
