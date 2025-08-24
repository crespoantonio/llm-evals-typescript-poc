/**
 * Model-graded evaluation template using LLM for scoring
 */

import { EvalTemplate, EvalSample, CompletionResult, EvalResult, ModelGradedEvalArgs, ChatMessage } from '../types';
import { LLMClient } from '../types';

export class ModelGradedEval implements EvalTemplate {
  name = 'model-graded';
  private args: ModelGradedEvalArgs;
  private gradingClient: LLMClient;

  constructor(args: ModelGradedEvalArgs, gradingClient: LLMClient) {
    this.args = args;
    this.gradingClient = gradingClient;
  }

  async evaluate(sample: EvalSample, completion: CompletionResult): Promise<EvalResult> {
    const sampleId = this.generateSampleId(sample);
    
    try {
      const gradingResult = await this.gradeWithModel(sample, completion);
      
      return {
        sample_id: sampleId,
        input: sample.input,
        ideal: sample.ideal,
        completion,
        score: gradingResult.score,
        passed: gradingResult.score >= 0.5, // Consider >= 0.5 as passing
        reasoning: gradingResult.reasoning,
        metadata: {
          eval_type: this.args.eval_type,
          grading_model: this.gradingClient.getModel(),
        },
      };
    } catch (error) {
      console.warn(`Grading failed for sample ${sampleId}: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        sample_id: sampleId,
        input: sample.input,
        ideal: sample.ideal,
        completion,
        score: 0,
        passed: false,
        reasoning: `Grading failed: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {
          eval_type: this.args.eval_type,
          grading_model: this.gradingClient.getModel(),
          grading_error: true,
        },
      };
    }
  }

  private async gradeWithModel(sample: EvalSample, completion: CompletionResult): Promise<{
    score: number;
    reasoning: string;
  }> {
    const gradingPrompt = this.buildGradingPrompt(sample, completion);
    
    const gradingMessages: ChatMessage[] = [
      {
        role: 'system',
        content: this.getSystemPrompt(),
      },
      {
        role: 'user',
        content: gradingPrompt,
      },
    ];

    const gradingResponse = await this.gradingClient.complete(gradingMessages, {
      temperature: 0.0, // Use deterministic grading
      max_tokens: 1000,
    });

    return this.parseGradingResponse(gradingResponse.content);
  }

  private getSystemPrompt(): string {
    if (this.args.grading_prompt) {
      return this.args.grading_prompt;
    }

    return `You are an expert evaluator tasked with grading the quality of responses from a language model.

Your job is to:
1. Compare the model's response to the ideal/expected answer
2. Consider correctness, completeness, and accuracy
3. Provide a score from 0.0 to 1.0 where:
   - 1.0 = Perfect match or equivalent correct answer
   - 0.8-0.9 = Mostly correct with minor issues
   - 0.6-0.7 = Partially correct but missing key elements
   - 0.4-0.5 = Some correct elements but significant problems
   - 0.0-0.3 = Incorrect or completely off-target

${this.args.eval_type === 'cot_classify' ? `
Please think step by step and provide your reasoning before giving the final score.

Format your response as:
REASONING: [Your detailed analysis]
SCORE: [Your numeric score from 0.0 to 1.0]
` : `
Format your response as:
SCORE: [Your numeric score from 0.0 to 1.0]
REASONING: [Brief explanation]
`}`;
  }

  private buildGradingPrompt(sample: EvalSample, completion: CompletionResult): string {
    const idealText = Array.isArray(sample.ideal) 
      ? sample.ideal.join(' OR ')
      : sample.ideal;

    const userQuery = sample.input
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join('\n');

    const systemContext = sample.input
      .filter(msg => msg.role === 'system')
      .map(msg => msg.content)
      .join('\n');

    return `Please evaluate this language model response:

${systemContext ? `CONTEXT:\n${systemContext}\n\n` : ''}QUESTION:
${userQuery}

EXPECTED ANSWER:
${idealText}

MODEL'S RESPONSE:
${completion.content}

Please evaluate how well the model's response matches the expected answer.`;
  }

  private parseGradingResponse(response: string): { score: number; reasoning: string } {
    const lines = response.split('\n');
    let score = 0;
    let reasoning = response;

    // Look for score patterns
    const scoreMatch = response.match(/SCORE:\s*([0-9]*\.?[0-9]+)/i);
    if (scoreMatch) {
      const parsedScore = parseFloat(scoreMatch[1]);
      if (!isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= 1) {
        score = parsedScore;
      }
    }

    // Extract reasoning if structured response
    if (this.args.eval_type === 'cot_classify') {
      const reasoningMatch = response.match(/REASONING:\s*(.*?)(?:\s*SCORE:|$)/is);
      if (reasoningMatch) {
        reasoning = reasoningMatch[1].trim();
      }
    } else {
      const reasoningMatch = response.match(/REASONING:\s*(.*?)$/is);
      if (reasoningMatch) {
        reasoning = reasoningMatch[1].trim();
      }
    }

    return { score, reasoning };
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
