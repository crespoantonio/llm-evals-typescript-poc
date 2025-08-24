// Cost Tracking and Budget Management
import { CompletionResult } from '../types';

export interface CostConfig {
  provider: string;
  model: string;
  input_cost_per_1k_tokens: number;
  output_cost_per_1k_tokens: number;
  image_cost_per_image?: number;
}

export interface CostBreakdown {
  total_cost: number;
  input_tokens: number;
  output_tokens: number;
  input_cost: number;
  output_cost: number;
  requests: number;
  model: string;
  evaluation: string;
}

export interface BudgetAlert {
  type: 'warning' | 'exceeded' | 'limit_reached';
  message: string;
  current_cost: number;
  budget_limit: number;
  percentage_used: number;
}

export class CostManager {
  private costs: Map<string, CostConfig> = new Map();
  private budgets: Map<string, number> = new Map(); // evaluation -> budget limit
  private currentCosts: Map<string, number> = new Map(); // evaluation -> current cost

  constructor() {
    this.initDefaultCosts();
  }

  private initDefaultCosts() {
    // OpenAI pricing (as of 2024)
    this.addCostConfig({
      provider: 'openai',
      model: 'gpt-4',
      input_cost_per_1k_tokens: 0.03,
      output_cost_per_1k_tokens: 0.06
    });

    this.addCostConfig({
      provider: 'openai', 
      model: 'gpt-3.5-turbo',
      input_cost_per_1k_tokens: 0.001,
      output_cost_per_1k_tokens: 0.002
    });

    this.addCostConfig({
      provider: 'openai',
      model: 'gpt-4-vision-preview',
      input_cost_per_1k_tokens: 0.01,
      output_cost_per_1k_tokens: 0.03,
      image_cost_per_image: 0.00765
    });

    // Anthropic pricing
    this.addCostConfig({
      provider: 'anthropic',
      model: 'claude-3-opus',
      input_cost_per_1k_tokens: 0.015,
      output_cost_per_1k_tokens: 0.075
    });

    this.addCostConfig({
      provider: 'anthropic',
      model: 'claude-3-sonnet', 
      input_cost_per_1k_tokens: 0.003,
      output_cost_per_1k_tokens: 0.015
    });
  }

  addCostConfig(config: CostConfig) {
    this.costs.set(`${config.provider}:${config.model}`, config);
  }

  setBudget(evaluation: string, budget: number) {
    this.budgets.set(evaluation, budget);
    if (!this.currentCosts.has(evaluation)) {
      this.currentCosts.set(evaluation, 0);
    }
  }

  calculateCompletionCost(
    model: string, 
    completion: CompletionResult,
    inputTokens?: number
  ): number {
    const config = this.findCostConfig(model);
    if (!config) {
      console.warn(`⚠️  No cost config found for model ${model}`);
      return 0;
    }

    // Estimate tokens if not provided (rough approximation)
    const estimatedInputTokens = inputTokens || Math.ceil(completion.content.length / 4);
    const estimatedOutputTokens = Math.ceil(completion.content.length / 4);

    const inputCost = (estimatedInputTokens / 1000) * config.input_cost_per_1k_tokens;
    const outputCost = (estimatedOutputTokens / 1000) * config.output_cost_per_1k_tokens;

    return inputCost + outputCost;
  }

  trackEvaluationCost(
    evaluation: string,
    model: string,
    completions: CompletionResult[]
  ): CostBreakdown {
    let totalCost = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let inputCost = 0;
    let outputCost = 0;

    for (const completion of completions) {
      const cost = this.calculateCompletionCost(model, completion);
      totalCost += cost;
      
      // Rough token estimation
      const estimatedInputTokens = Math.ceil(completion.content.length / 4);
      const estimatedOutputTokens = Math.ceil(completion.content.length / 4);
      
      totalInputTokens += estimatedInputTokens;
      totalOutputTokens += estimatedOutputTokens;
    }

    // Update current cost for this evaluation
    const currentCost = this.currentCosts.get(evaluation) || 0;
    this.currentCosts.set(evaluation, currentCost + totalCost);

    return {
      total_cost: totalCost,
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      input_cost: inputCost,
      output_cost: outputCost,
      requests: completions.length,
      model,
      evaluation
    };
  }

  checkBudgetStatus(evaluation: string): BudgetAlert | null {
    const budget = this.budgets.get(evaluation);
    const currentCost = this.currentCosts.get(evaluation) || 0;

    if (!budget) return null;

    const percentageUsed = (currentCost / budget) * 100;

    if (currentCost >= budget) {
      return {
        type: 'exceeded',
        message: `🚨 Budget exceeded for ${evaluation}! Used $${currentCost.toFixed(4)} of $${budget.toFixed(4)} budget`,
        current_cost: currentCost,
        budget_limit: budget,
        percentage_used: percentageUsed
      };
    }

    if (percentageUsed >= 90) {
      return {
        type: 'limit_reached',
        message: `⚠️  Budget limit reached for ${evaluation}: ${percentageUsed.toFixed(1)}% used ($${currentCost.toFixed(4)}/$${budget.toFixed(4)})`,
        current_cost: currentCost,
        budget_limit: budget,
        percentage_used: percentageUsed
      };
    }

    if (percentageUsed >= 75) {
      return {
        type: 'warning',
        message: `⚠️  Budget warning for ${evaluation}: ${percentageUsed.toFixed(1)}% used ($${currentCost.toFixed(4)}/$${budget.toFixed(4)})`,
        current_cost: currentCost,
        budget_limit: budget,
        percentage_used: percentageUsed
      };
    }

    return null;
  }

  estimateEvaluationCost(
    model: string,
    sampleCount: number,
    avgInputLength: number = 500,
    avgOutputLength: number = 200
  ): number {
    const config = this.findCostConfig(model);
    if (!config) return 0;

    const avgInputTokens = Math.ceil(avgInputLength / 4);
    const avgOutputTokens = Math.ceil(avgOutputLength / 4);

    const costPerSample = 
      (avgInputTokens / 1000) * config.input_cost_per_1k_tokens +
      (avgOutputTokens / 1000) * config.output_cost_per_1k_tokens;

    return costPerSample * sampleCount;
  }

  generateCostReport(): {
    evaluations: Array<{
      name: string;
      cost: number;
      budget?: number;
      percentage_used?: number;
      status: 'under_budget' | 'warning' | 'exceeded';
    }>;
    total_cost: number;
    total_budget: number;
  } {
    const evaluations: any[] = [];
    let totalCost = 0;
    let totalBudget = 0;

    for (const [evaluation, cost] of this.currentCosts.entries()) {
      const budget = this.budgets.get(evaluation);
      const percentageUsed = budget ? (cost / budget) * 100 : undefined;
      
      let status: 'under_budget' | 'warning' | 'exceeded' = 'under_budget';
      if (budget) {
        if (cost >= budget) status = 'exceeded';
        else if (percentageUsed && percentageUsed >= 75) status = 'warning';
      }

      evaluations.push({
        name: evaluation,
        cost,
        budget,
        percentage_used: percentageUsed,
        status
      });

      totalCost += cost;
      if (budget) totalBudget += budget;
    }

    return {
      evaluations: evaluations.sort((a, b) => b.cost - a.cost),
      total_cost: totalCost,
      total_budget: totalBudget
    };
  }

  private findCostConfig(model: string): CostConfig | undefined {
    // Try exact match first
    for (const [key, config] of this.costs.entries()) {
      if (key.includes(model)) return config;
    }

    // Try partial matches
    const lowerModel = model.toLowerCase();
    for (const [key, config] of this.costs.entries()) {
      if (lowerModel.includes(config.model)) return config;
    }

    return undefined;
  }
}
