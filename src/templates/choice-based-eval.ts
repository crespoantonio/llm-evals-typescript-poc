/**
 * Choice-based evaluation template with structured grading
 * Similar to OpenAI Evals format with template variables and choice scoring
 */

import { EvalTemplate, EvalSample, CompletionResult, EvalResult } from '../types';
import { LLMClient } from '../types';

export interface ChoiceBasedEvalArgs {
  samples_jsonl: string;
  prompt: string; // Template with {input}, {ideal}, {completion} variables
  choice_strings: string[]; // Valid choices the grader can make
  choice_scores: Record<string, number>; // Score mapping for each choice
  grading_model?: string;
  input_outputs?: {
    input?: string; // What to use as input (default: 'input')
    ideal?: string; // What to use as ideal (default: 'ideal')
    completion?: string; // What to use as completion (default: 'completion')
  };
}

export class ChoiceBasedEval implements EvalTemplate {
  name = 'choice-based';
  private args: ChoiceBasedEvalArgs;
  private gradingClient: LLMClient;

  constructor(args: ChoiceBasedEvalArgs, gradingClient: LLMClient) {
    this.args = {
      input_outputs: {
        input: 'input',
        ideal: 'ideal', 
        completion: 'completion',
        ...args.input_outputs
      },
      ...args
    };
    this.gradingClient = gradingClient;
  }

  async evaluate(sample: EvalSample, completion: CompletionResult): Promise<EvalResult> {
    const sampleId = this.generateSampleId(sample);
    
    try {
      const gradingResult = await this.gradeWithChoices(sample, completion);
      
      return {
        sample_id: sampleId,
        input: sample.input,
        ideal: sample.ideal,
        completion,
        score: gradingResult.score,
        passed: gradingResult.score >= 0.5, // Consider >= 0.5 as passing
        reasoning: gradingResult.reasoning,
        metadata: {
          chosen_option: gradingResult.choice,
          available_choices: this.args.choice_strings,
          grading_model: this.gradingClient.getModel(),
          template_type: 'choice_based',
        },
      };
    } catch (error) {
      console.warn(`Choice-based grading failed for sample ${sampleId}: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        sample_id: sampleId,
        input: sample.input,
        ideal: sample.ideal,
        completion,
        score: 0,
        passed: false,
        reasoning: `Grading failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {
          grading_error: true,
          grading_model: this.gradingClient.getModel(),
          template_type: 'choice_based',
        },
      };
    }
  }

  private async gradeWithChoices(sample: EvalSample, completion: CompletionResult): Promise<{
    choice: string;
    score: number;
    reasoning: string;
  }> {
    // Build the grading prompt with template variables
    const gradingPrompt = this.buildGradingPrompt(sample, completion);
    
    const gradingMessages = [
      {
        role: 'system' as const,
        content: `You are evaluating responses. You must respond with exactly one of these choices: ${this.args.choice_strings.join(', ')}. Provide your reasoning first, then state your choice clearly.`,
      },
      {
        role: 'user' as const,
        content: gradingPrompt,
      },
    ];

    const gradingResponse = await this.gradingClient.complete(gradingMessages, {
      temperature: 0.0, // Use deterministic grading
      max_tokens: 1000,
    });

    return this.parseGradingResponse(gradingResponse.content);
  }

  private buildGradingPrompt(sample: EvalSample, completion: CompletionResult): string {
    // Extract input content based on configuration
    const inputContent = this.extractInputContent(sample);
    const idealContent = Array.isArray(sample.ideal) 
      ? sample.ideal.join(' OR ')
      : sample.ideal;
    const completionContent = completion.content;

    // Replace template variables
    let prompt = this.args.prompt;
    prompt = prompt.replace(/\{input\}/g, inputContent);
    prompt = prompt.replace(/\{ideal\}/g, idealContent);
    prompt = prompt.replace(/\{completion\}/g, completionContent);

    return prompt;
  }

  private extractInputContent(sample: EvalSample): string {
    // Extract the user message content as the main input
    const userMessage = sample.input.find(msg => msg.role === 'user');
    return userMessage ? userMessage.content : JSON.stringify(sample.input);
  }

  private parseGradingResponse(response: string): { choice: string; score: number; reasoning: string } {
    // Look for one of the valid choice strings in the response
    let foundChoice = '';
    for (const choice of this.args.choice_strings) {
      // Look for the choice string as a standalone word or at the end of a line
      const regex = new RegExp(`\\b${choice}\\b|${choice}\\s*$`, 'i');
      if (regex.test(response)) {
        foundChoice = choice;
        break;
      }
    }

    // If no valid choice found, default to the first choice with score 0
    if (!foundChoice) {
      console.warn(`No valid choice found in response: ${response.substring(0, 100)}...`);
      foundChoice = this.args.choice_strings[0];
    }

    // Get the score for this choice
    const score = this.args.choice_scores[foundChoice] ?? 0;

    return {
      choice: foundChoice,
      score,
      reasoning: response.trim(),
    };
  }

  private generateSampleId(sample: EvalSample): string {
    const content = JSON.stringify(sample.input) + JSON.stringify(sample.ideal);
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}
