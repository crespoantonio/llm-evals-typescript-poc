/**
 * Token Analytics Service
 * Provides comprehensive analysis of token usage, costs, and trends
 */

import { EvaluationStore } from '../database/evaluation-store';
import { EvalReport, TokenUsage } from '../types';

export interface TokenTrend {
  date: string;
  total_tokens: number;
  total_cost: number;
  avg_tokens_per_sample: number;
  evaluations_run: number;
  model: string;
  eval_name: string;
}

export interface CostTrend {
  date: string;
  total_cost: number;
  total_tokens: number;
  cost_per_token: number;
  evaluations: string[];
  models: string[];
}

export interface ModelEfficiency {
  model: string;
  avg_tokens_per_sample: number;
  avg_cost_per_sample: number;
  total_samples: number;
  total_cost: number;
  efficiency_score: number; // cost-effectiveness metric
}

export interface EvaluationCostSummary {
  evaluation: string;
  total_runs: number;
  total_cost: number;
  total_tokens: number;
  avg_cost_per_run: number;
  avg_tokens_per_run: number;
  cost_trend: 'increasing' | 'decreasing' | 'stable';
  models_used: string[];
}

export interface TokenAnalyticsReport {
  summary: {
    total_evaluations: number;
    total_tokens: number;
    total_cost: number;
    avg_cost_per_evaluation: number;
    most_expensive_model: string;
    most_efficient_model: string;
  };
  trends: {
    daily_costs: CostTrend[];
    weekly_costs: CostTrend[];
    monthly_costs: CostTrend[];
  };
  model_efficiency: ModelEfficiency[];
  evaluation_costs: EvaluationCostSummary[];
  recommendations: string[];
}

export class TokenAnalyticsService {
  private store: EvaluationStore;

  constructor(store?: EvaluationStore) {
    this.store = store || new EvaluationStore();
  }

  /**
   * Generate comprehensive token analytics report
   */
  async generateAnalyticsReport(days: number = 30): Promise<TokenAnalyticsReport> {
    const reports = await this.getRecentReportsWithTokens(days);
    
    if (reports.length === 0) {
      return this.getEmptyReport();
    }

    const summary = this.calculateSummaryMetrics(reports);
    const trends = await this.calculateCostTrends(days);
    const modelEfficiency = this.calculateModelEfficiency(reports);
    const evaluationCosts = this.calculateEvaluationCosts(reports);
    const recommendations = this.generateRecommendations(reports, modelEfficiency);

    return {
      summary,
      trends,
      model_efficiency: modelEfficiency,
      evaluation_costs: evaluationCosts,
      recommendations
    };
  }

  /**
   * Get token usage trends over time
   */
  async getTokenTrends(evalName?: string, days: number = 30): Promise<TokenTrend[]> {
    try {
      const query = evalName 
        ? `SELECT 
             DATE(created_at) as date,
             SUM(CAST(JSON_EXTRACT(metadata, '$.token_usage.total_tokens') AS INTEGER)) as total_tokens,
             SUM(CAST(JSON_EXTRACT(metadata, '$.token_usage.estimated_cost') AS REAL)) as total_cost,
             AVG(CAST(JSON_EXTRACT(metadata, '$.token_usage.average_tokens_per_sample') AS INTEGER)) as avg_tokens_per_sample,
             COUNT(*) as evaluations_run,
             model,
             eval_name
           FROM eval_runs 
           WHERE eval_name = ? 
             AND created_at > datetime('now', '-${days} days')
             AND JSON_EXTRACT(metadata, '$.token_usage') IS NOT NULL
           GROUP BY DATE(created_at), model, eval_name
           ORDER BY date DESC`
        : `SELECT 
             DATE(created_at) as date,
             SUM(CAST(JSON_EXTRACT(metadata, '$.token_usage.total_tokens') AS INTEGER)) as total_tokens,
             SUM(CAST(JSON_EXTRACT(metadata, '$.token_usage.estimated_cost') AS REAL)) as total_cost,
             AVG(CAST(JSON_EXTRACT(metadata, '$.token_usage.average_tokens_per_sample') AS INTEGER)) as avg_tokens_per_sample,
             COUNT(*) as evaluations_run,
             model,
             eval_name
           FROM eval_runs 
           WHERE created_at > datetime('now', '-${days} days')
             AND JSON_EXTRACT(metadata, '$.token_usage') IS NOT NULL
           GROUP BY DATE(created_at), model, eval_name
           ORDER BY date DESC`;

      // Mock implementation for now since we don't have direct SQL access
      const reports = await this.getRecentReportsWithTokens(days);
      const trends = this.groupReportsByDate(reports, evalName);
      
      return trends;
    } catch (error) {
      console.warn('Failed to get token trends, using fallback:', error);
      return [];
    }
  }

  /**
   * Compare token efficiency between models
   */
  async compareModelEfficiency(models: string[], evalName?: string, days: number = 30): Promise<ModelEfficiency[]> {
    const reports = await this.getRecentReportsWithTokens(days);
    
    const filteredReports = reports.filter(report => {
      const matchesModel = models.length === 0 || models.includes(report.model);
      const matchesEval = !evalName || report.eval_name === evalName;
      return matchesModel && matchesEval && report.token_usage;
    });

    return this.calculateModelEfficiency(filteredReports);
  }

  /**
   * Get cost breakdown by evaluation type
   */
  async getCostBreakdown(days: number = 30): Promise<EvaluationCostSummary[]> {
    const reports = await this.getRecentReportsWithTokens(days);
    return this.calculateEvaluationCosts(reports);
  }

  /**
   * Predict costs for future evaluations
   */
  async predictCosts(
    model: string, 
    evalName: string, 
    sampleCount: number,
    days: number = 7
  ): Promise<{
    estimated_cost: number;
    confidence_interval: [number, number];
    cost_per_sample: number;
    token_estimate: number;
  }> {
    const reports = await this.getRecentReportsWithTokens(days);
    const similarReports = reports.filter(r => 
      r.model === model && 
      r.eval_name === evalName && 
      r.token_usage
    );

    if (similarReports.length === 0) {
      // Fallback to model-based estimation
      return {
        estimated_cost: 0.05 * sampleCount, // Rough estimate
        confidence_interval: [0.03 * sampleCount, 0.08 * sampleCount],
        cost_per_sample: 0.05,
        token_estimate: 1000 * sampleCount
      };
    }

    const avgCostPerSample = similarReports.reduce((sum, r) => 
      sum + (r.token_usage!.estimated_cost / r.total_samples), 0
    ) / similarReports.length;

    const avgTokensPerSample = similarReports.reduce((sum, r) => 
      sum + r.token_usage!.average_tokens_per_sample, 0
    ) / similarReports.length;

    const estimatedCost = avgCostPerSample * sampleCount;
    const variance = this.calculateVariance(similarReports.map(r => 
      r.token_usage!.estimated_cost / r.total_samples
    ));
    const stdDev = Math.sqrt(variance);

    return {
      estimated_cost: estimatedCost,
      confidence_interval: [
        Math.max(0, estimatedCost - 1.96 * stdDev * Math.sqrt(sampleCount)),
        estimatedCost + 1.96 * stdDev * Math.sqrt(sampleCount)
      ],
      cost_per_sample: avgCostPerSample,
      token_estimate: avgTokensPerSample * sampleCount
    };
  }

  /**
   * Private helper methods
   */

  private async getRecentReportsWithTokens(days: number): Promise<EvalReport[]> {
    // This is a mock implementation
    // In a real implementation, this would query the database
    return [];
  }

  private getEmptyReport(): TokenAnalyticsReport {
    return {
      summary: {
        total_evaluations: 0,
        total_tokens: 0,
        total_cost: 0,
        avg_cost_per_evaluation: 0,
        most_expensive_model: '',
        most_efficient_model: ''
      },
      trends: {
        daily_costs: [],
        weekly_costs: [],
        monthly_costs: []
      },
      model_efficiency: [],
      evaluation_costs: [],
      recommendations: ['Start running evaluations to see analytics']
    };
  }

  private calculateSummaryMetrics(reports: EvalReport[]): TokenAnalyticsReport['summary'] {
    const totalTokens = reports.reduce((sum, r) => sum + (r.token_usage?.total_tokens || 0), 0);
    const totalCost = reports.reduce((sum, r) => sum + (r.token_usage?.estimated_cost || 0), 0);
    
    // Find most expensive and efficient models
    const modelStats = this.calculateModelEfficiency(reports);
    const mostExpensive = modelStats.sort((a, b) => b.avg_cost_per_sample - a.avg_cost_per_sample)[0];
    const mostEfficient = modelStats.sort((a, b) => a.efficiency_score - b.efficiency_score)[0];

    return {
      total_evaluations: reports.length,
      total_tokens: totalTokens,
      total_cost: totalCost,
      avg_cost_per_evaluation: reports.length > 0 ? totalCost / reports.length : 0,
      most_expensive_model: mostExpensive?.model || '',
      most_efficient_model: mostEfficient?.model || ''
    };
  }

  private async calculateCostTrends(days: number): Promise<TokenAnalyticsReport['trends']> {
    // Mock implementation - in real version would query database by date ranges
    return {
      daily_costs: [],
      weekly_costs: [],
      monthly_costs: []
    };
  }

  private calculateModelEfficiency(reports: EvalReport[]): ModelEfficiency[] {
    const modelGroups = new Map<string, EvalReport[]>();
    
    reports.forEach(report => {
      if (!report.token_usage) return;
      
      if (!modelGroups.has(report.model)) {
        modelGroups.set(report.model, []);
      }
      modelGroups.get(report.model)!.push(report);
    });

    return Array.from(modelGroups.entries()).map(([model, modelReports]) => {
      const totalSamples = modelReports.reduce((sum, r) => sum + r.total_samples, 0);
      const totalCost = modelReports.reduce((sum, r) => sum + (r.token_usage?.estimated_cost || 0), 0);
      const avgTokensPerSample = modelReports.reduce((sum, r) => 
        sum + (r.token_usage?.average_tokens_per_sample || 0), 0
      ) / modelReports.length;
      const avgCostPerSample = totalSamples > 0 ? totalCost / totalSamples : 0;
      
      // Efficiency score: lower is better (cost per correct answer)
      const correctAnswers = modelReports.reduce((sum, r) => sum + r.correct, 0);
      const efficiencyScore = correctAnswers > 0 ? totalCost / correctAnswers : Infinity;

      return {
        model,
        avg_tokens_per_sample: Math.round(avgTokensPerSample),
        avg_cost_per_sample: avgCostPerSample,
        total_samples: totalSamples,
        total_cost: totalCost,
        efficiency_score: efficiencyScore
      };
    }).sort((a, b) => a.efficiency_score - b.efficiency_score);
  }

  private calculateEvaluationCosts(reports: EvalReport[]): EvaluationCostSummary[] {
    const evalGroups = new Map<string, EvalReport[]>();
    
    reports.forEach(report => {
      if (!report.token_usage) return;
      
      if (!evalGroups.has(report.eval_name)) {
        evalGroups.set(report.eval_name, []);
      }
      evalGroups.get(report.eval_name)!.push(report);
    });

    return Array.from(evalGroups.entries()).map(([evaluation, evalReports]) => {
      const totalCost = evalReports.reduce((sum, r) => sum + (r.token_usage?.estimated_cost || 0), 0);
      const totalTokens = evalReports.reduce((sum, r) => sum + (r.token_usage?.total_tokens || 0), 0);
      const modelsUsed = [...new Set(evalReports.map(r => r.model))];
      
      // Calculate cost trend (simplified)
      const recentCost = evalReports.slice(0, Math.ceil(evalReports.length / 2))
        .reduce((sum, r) => sum + (r.token_usage?.estimated_cost || 0), 0);
      const olderCost = evalReports.slice(Math.ceil(evalReports.length / 2))
        .reduce((sum, r) => sum + (r.token_usage?.estimated_cost || 0), 0);
      
      let costTrend: 'increasing' | 'decreasing' | 'stable';
      if (recentCost > olderCost * 1.1) costTrend = 'increasing';
      else if (recentCost < olderCost * 0.9) costTrend = 'decreasing';
      else costTrend = 'stable';

      return {
        evaluation,
        total_runs: evalReports.length,
        total_cost: totalCost,
        total_tokens: totalTokens,
        avg_cost_per_run: totalCost / evalReports.length,
        avg_tokens_per_run: totalTokens / evalReports.length,
        cost_trend: costTrend,
        models_used: modelsUsed
      };
    }).sort((a, b) => b.total_cost - a.total_cost);
  }

  private generateRecommendations(reports: EvalReport[], modelEfficiency: ModelEfficiency[]): string[] {
    const recommendations: string[] = [];

    if (modelEfficiency.length === 0) {
      return ['Run more evaluations to generate recommendations'];
    }

    // Cost optimization recommendations
    const mostEfficient = modelEfficiency[0];
    const leastEfficient = modelEfficiency[modelEfficiency.length - 1];
    
    if (modelEfficiency.length > 1) {
      const savings = (leastEfficient.avg_cost_per_sample - mostEfficient.avg_cost_per_sample) * 100;
      if (savings > 0.01) {
        recommendations.push(
          `💡 Switch from ${leastEfficient.model} to ${mostEfficient.model} to save ~$${savings.toFixed(4)} per 100 samples`
        );
      }
    }

    // High cost warnings
    const totalCost = reports.reduce((sum, r) => sum + (r.token_usage?.estimated_cost || 0), 0);
    if (totalCost > 50) {
      recommendations.push(`⚠️  High costs detected: $${totalCost.toFixed(2)} in recent evaluations`);
    }

    // Token efficiency recommendations
    const avgTokens = modelEfficiency.reduce((sum, m) => sum + m.avg_tokens_per_sample, 0) / modelEfficiency.length;
    if (avgTokens > 2000) {
      recommendations.push('📊 Consider shorter prompts or smaller context windows to reduce token usage');
    }

    // Model-specific recommendations
    const gptModels = modelEfficiency.filter(m => m.model.startsWith('gpt-'));
    const ollamaModels = modelEfficiency.filter(m => m.model.startsWith('ollama/'));
    
    if (gptModels.length > 0 && ollamaModels.length === 0) {
      recommendations.push('🏠 Consider trying Ollama for cost-free local evaluations');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Your token usage looks optimized!');
    }

    return recommendations;
  }

  private groupReportsByDate(reports: EvalReport[], evalName?: string): TokenTrend[] {
    const filtered = reports.filter(r => !evalName || r.eval_name === evalName);
    
    const grouped = new Map<string, EvalReport[]>();
    filtered.forEach(report => {
      const date = report.created_at.split('T')[0];
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(report);
    });

    return Array.from(grouped.entries()).map(([date, dayReports]) => ({
      date,
      total_tokens: dayReports.reduce((sum, r) => sum + (r.token_usage?.total_tokens || 0), 0),
      total_cost: dayReports.reduce((sum, r) => sum + (r.token_usage?.estimated_cost || 0), 0),
      avg_tokens_per_sample: dayReports.reduce((sum, r) => 
        sum + (r.token_usage?.average_tokens_per_sample || 0), 0
      ) / dayReports.length,
      evaluations_run: dayReports.length,
      model: dayReports[0].model,
      eval_name: dayReports[0].eval_name
    })).sort((a, b) => b.date.localeCompare(a.date));
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
}
