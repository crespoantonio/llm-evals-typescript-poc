import { EvalResult, EvalReport, CompletionResult } from '../types.js';

export interface MetricResult {
  name: string;
  value: number;
  display_name: string;
  description: string;
  higher_is_better: boolean;
  category: 'accuracy' | 'efficiency' | 'cost' | 'quality' | 'safety' | 'business' | 'custom';
  metadata?: Record<string, any>;
}

export interface MetricConfig {
  enabled: boolean;
  weight?: number; // For weighted composite scores
  threshold?: number; // For pass/fail metrics
  parameters?: Record<string, any>; // Metric-specific parameters
}

/**
 * Abstract base class for custom evaluation metrics
 */
export abstract class CustomMetric {
  abstract readonly name: string;
  abstract readonly display_name: string;
  abstract readonly description: string;
  abstract readonly higher_is_better: boolean;
  abstract readonly category: MetricResult['category'];

  protected config: MetricConfig;

  constructor(config: MetricConfig = { enabled: true }) {
    this.config = config;
  }

  /**
   * Calculate the metric value from evaluation results
   */
  abstract calculate(results: EvalResult[], report?: EvalReport): Promise<MetricResult>;

  /**
   * Validate if this metric can be calculated with the given data
   */
  validate(results: EvalResult[]): { valid: boolean; reason?: string } {
    if (results.length === 0) {
      return { valid: false, reason: 'No results to calculate metric' };
    }
    return { valid: true };
  }

  /**
   * Check if metric should be calculated based on configuration
   */
  shouldCalculate(): boolean {
    return this.config.enabled;
  }

  /**
   * Get metric configuration
   */
  getConfig(): MetricConfig {
    return { ...this.config };
  }

  /**
   * Update metric configuration
   */
  updateConfig(config: Partial<MetricConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Cost Efficiency Metric - measures accuracy per dollar spent
 */
export class CostEfficiencyMetric extends CustomMetric {
  readonly name = 'cost_efficiency';
  readonly display_name = 'Cost Efficiency';
  readonly description = 'Accuracy achieved per dollar spent (higher is better)';
  readonly higher_is_better = true;
  readonly category = 'efficiency' as const;

  async calculate(results: EvalResult[], report?: EvalReport): Promise<MetricResult> {
    const totalCost = report?.token_usage?.estimated_cost || 0;
    const accuracy = report?.score || 0;

    let value = 0;
    if (totalCost > 0) {
      value = accuracy / totalCost;
    }

    return {
      name: this.name,
      value: Math.round(value * 1000) / 1000, // Round to 3 decimals
      display_name: this.display_name,
      description: this.description,
      higher_is_better: this.higher_is_better,
      category: this.category,
      metadata: {
        accuracy,
        total_cost: totalCost,
        cost_per_point: totalCost > 0 ? totalCost / (accuracy * 100) : 0
      }
    };
  }
}

/**
 * Response Consistency Metric - measures how consistent responses are across similar inputs
 */
export class ResponseConsistencyMetric extends CustomMetric {
  readonly name = 'response_consistency';
  readonly display_name = 'Response Consistency';
  readonly description = 'Consistency of responses across similar inputs';
  readonly higher_is_better = true;
  readonly category = 'quality' as const;

  async calculate(results: EvalResult[]): Promise<MetricResult> {
    // Group similar inputs and measure response variance
    const responseGroups = this.groupSimilarInputs(results);
    let consistencySum = 0;
    let groupCount = 0;

    for (const group of responseGroups) {
      if (group.length > 1) {
        const consistency = this.calculateGroupConsistency(group);
        consistencySum += consistency;
        groupCount++;
      }
    }

    const value = groupCount > 0 ? consistencySum / groupCount : 1.0;

    return {
      name: this.name,
      value: Math.round(value * 1000) / 1000,
      display_name: this.display_name,
      description: this.description,
      higher_is_better: this.higher_is_better,
      category: this.category,
      metadata: {
        groups_analyzed: groupCount,
        total_samples: results.length
      }
    };
  }

  private groupSimilarInputs(results: EvalResult[]): EvalResult[][] {
    // Simple grouping by input similarity (can be enhanced with embeddings)
    const groups = new Map<string, EvalResult[]>();
    
    for (const result of results) {
      const inputKey = this.normalizeInput(result.input);
      if (!groups.has(inputKey)) {
        groups.set(inputKey, []);
      }
      groups.get(inputKey)!.push(result);
    }

    return Array.from(groups.values());
  }

  private normalizeInput(input: any): string {
    // Simple normalization - can be enhanced
    return JSON.stringify(input).toLowerCase().replace(/\s+/g, ' ').trim();
  }

  private calculateGroupConsistency(group: EvalResult[]): number {
    if (group.length < 2) return 1.0;

    const responses = group.map(r => r.completion.content);
    const uniqueResponses = new Set(responses);
    
    // Simple consistency metric: ratio of unique responses to total responses
    return 1.0 - (uniqueResponses.size - 1) / (responses.length - 1);
  }
}

/**
 * Token Efficiency Metric - measures tokens used per correct answer
 */
export class TokenEfficiencyMetric extends CustomMetric {
  readonly name = 'token_efficiency';
  readonly display_name = 'Token Efficiency';
  readonly description = 'Average tokens used per correct answer';
  readonly higher_is_better = false; // Lower token usage is better
  readonly category = 'efficiency' as const;

  async calculate(results: EvalResult[]): Promise<MetricResult> {
    const correctResults = results.filter(r => r.passed);
    
    if (correctResults.length === 0) {
      return {
        name: this.name,
        value: 0,
        display_name: this.display_name,
        description: this.description,
        higher_is_better: this.higher_is_better,
        category: this.category,
        metadata: { correct_answers: 0, total_samples: results.length }
      };
    }

    const totalTokens = correctResults.reduce((sum, result) => {
      return sum + (result.completion.usage?.total_tokens || 0);
    }, 0);

    const value = totalTokens / correctResults.length;

    return {
      name: this.name,
      value: Math.round(value * 10) / 10,
      display_name: this.display_name,
      description: this.description,
      higher_is_better: this.higher_is_better,
      category: this.category,
      metadata: {
        correct_answers: correctResults.length,
        total_tokens: totalTokens,
        total_samples: results.length
      }
    };
  }
}

/**
 * Business Impact Metric - custom metric for business-specific scoring
 */
export class BusinessImpactMetric extends CustomMetric {
  readonly name = 'business_impact';
  readonly display_name = 'Business Impact Score';
  readonly description = 'Custom business impact metric based on domain-specific criteria';
  readonly higher_is_better = true;
  readonly category = 'business' as const;

  async calculate(results: EvalResult[]): Promise<MetricResult> {
    // This is a template - customize based on your business logic
    const impactWeights = this.config.parameters?.impact_weights || {
      accuracy: 0.4,
      speed: 0.3,
      cost: 0.2,
      user_satisfaction: 0.1
    };

    let totalImpact = 0;
    let validResults = 0;

    for (const result of results) {
      const impact = this.calculateSampleImpact(result, impactWeights);
      if (impact !== null) {
        totalImpact += impact;
        validResults++;
      }
    }

    const value = validResults > 0 ? totalImpact / validResults : 0;

    return {
      name: this.name,
      value: Math.round(value * 100) / 100,
      display_name: this.display_name,
      description: this.description,
      higher_is_better: this.higher_is_better,
      category: this.category,
      metadata: {
        impact_weights: impactWeights,
        samples_processed: validResults,
        total_samples: results.length
      }
    };
  }

  private calculateSampleImpact(result: EvalResult, weights: Record<string, number>): number | null {
    // Custom business logic here
    const accuracy = result.passed ? 1.0 : 0.0;
    const speedScore = this.calculateSpeedScore(result);
    const costScore = this.calculateCostScore(result);
    const satisfactionScore = this.calculateSatisfactionScore(result);

    if (speedScore === null || costScore === null || satisfactionScore === null) {
      return null;
    }

    return (
      accuracy * weights.accuracy +
      speedScore * weights.speed +
      costScore * weights.cost +
      satisfactionScore * weights.user_satisfaction
    );
  }

  private calculateSpeedScore(result: EvalResult): number | null {
    // Example: faster responses get higher scores
    const responseTime = result.completion.usage?.total_tokens || 0;
    if (responseTime === 0) return null;
    
    // Normalize to 0-1 scale (customize thresholds)
    const maxExpectedTokens = 500;
    return Math.max(0, (maxExpectedTokens - responseTime) / maxExpectedTokens);
  }

  private calculateCostScore(result: EvalResult): number | null {
    // Example: lower cost gets higher scores
    const tokens = result.completion.usage?.total_tokens || 0;
    if (tokens === 0) return null;
    
    // Normalize based on token efficiency
    const maxExpectedTokens = 300;
    return Math.max(0, (maxExpectedTokens - tokens) / maxExpectedTokens);
  }

  private calculateSatisfactionScore(result: EvalResult): number {
    // Example: based on response quality indicators
    // This could be enhanced with sentiment analysis, length appropriateness, etc.
    const response = result.completion.content;
    
    // Simple heuristics (customize based on your domain)
    let score = 0.5; // Base score
    
    if (response.length > 10) score += 0.2; // Not too short
    if (response.length < 500) score += 0.2; // Not too long
    if (!/^(sorry|i don't|i can't)/i.test(response)) score += 0.1; // Not apologetic
    
    return Math.min(1.0, score);
  }
}

/**
 * Latency Percentile Metric - measures response time percentiles
 */
export class LatencyPercentileMetric extends CustomMetric {
  readonly name = 'latency_p95';
  readonly display_name = 'Latency P95';
  readonly description = '95th percentile of response latency';
  readonly higher_is_better = false;
  readonly category = 'efficiency' as const;

  async calculate(results: EvalResult[]): Promise<MetricResult> {
    // Since we don't track actual latency yet, we'll estimate based on tokens
    // In a real implementation, you'd track actual response times
    const latencies = results.map(result => {
      const tokens = result.completion.usage?.total_tokens || 0;
      // Rough estimation: 1 token = 10ms (customize based on your models)
      return tokens * 10;
    }).filter(latency => latency > 0);

    if (latencies.length === 0) {
      return {
        name: this.name,
        value: 0,
        display_name: this.display_name,
        description: this.description,
        higher_is_better: this.higher_is_better,
        category: this.category
      };
    }

    latencies.sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95);
    const value = latencies[p95Index] || latencies[latencies.length - 1];

    return {
      name: this.name,
      value: Math.round(value),
      display_name: this.display_name,
      description: this.description,
      higher_is_better: this.higher_is_better,
      category: this.category,
      metadata: {
        samples_with_latency: latencies.length,
        total_samples: results.length,
        median_latency: latencies[Math.floor(latencies.length * 0.5)],
        avg_latency: Math.round(latencies.reduce((sum, l) => sum + l, 0) / latencies.length)
      }
    };
  }
}

/**
 * Registry for managing custom metrics
 */
export class MetricsRegistry {
  private metrics = new Map<string, CustomMetric>();
  private defaultMetrics: CustomMetric[];

  constructor() {
    // Initialize with built-in custom metrics
    this.defaultMetrics = [
      new CostEfficiencyMetric(),
      new ResponseConsistencyMetric(),
      new TokenEfficiencyMetric(),
      new BusinessImpactMetric(),
      new LatencyPercentileMetric()
    ];

    // Register default metrics silently
    for (const metric of this.defaultMetrics) {
      this.registerMetric(metric, false);
    }
  }

  /**
   * Register a custom metric
   */
  registerMetric(metric: CustomMetric, verbose: boolean = false): void {
    if (this.metrics.has(metric.name)) {
      if (verbose) {
        console.warn(`⚠️  Metric '${metric.name}' already exists, overwriting`);
      }
    }
    this.metrics.set(metric.name, metric);
    if (verbose) {
      console.log(`📊 Registered custom metric: ${metric.display_name}`);
    }
  }

  /**
   * Unregister a metric
   */
  unregisterMetric(name: string): boolean {
    return this.metrics.delete(name);
  }

  /**
   * Get a specific metric
   */
  getMetric(name: string): CustomMetric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Get all registered metrics
   */
  getAllMetrics(): CustomMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get metrics by category
   */
  getMetricsByCategory(category: MetricResult['category']): CustomMetric[] {
    return Array.from(this.metrics.values()).filter(m => m.category === category);
  }

  /**
   * Calculate all enabled metrics
   */
  async calculateAllMetrics(results: EvalResult[], report?: EvalReport): Promise<MetricResult[]> {
    const metricResults: MetricResult[] = [];
    const enabledMetrics = Array.from(this.metrics.values()).filter(m => m.shouldCalculate());

    for (const metric of enabledMetrics) {
      try {
        const validation = metric.validate(results);
        if (!validation.valid) {
          console.warn(`⚠️  Skipping metric ${metric.name}: ${validation.reason}`);
          continue;
        }

        const result = await metric.calculate(results, report);
        metricResults.push(result);
      } catch (error) {
        console.error(`❌ Error calculating metric ${metric.name}:`, (error as Error).message);
      }
    }

    return metricResults;
  }

  /**
   * Configure multiple metrics at once
   */
  configureMetrics(configurations: Record<string, Partial<MetricConfig>>): void {
    for (const [metricName, config] of Object.entries(configurations)) {
      const metric = this.metrics.get(metricName);
      if (metric) {
        metric.updateConfig(config);
      } else {
        console.warn(`⚠️  Metric '${metricName}' not found, skipping configuration`);
      }
    }
  }

  /**
   * Get metrics registry statistics
   */
  getRegistryStats(): {
    total_metrics: number;
    enabled_metrics: number;
    metrics_by_category: Record<string, number>;
  } {
    const allMetrics = Array.from(this.metrics.values());
    const enabledMetrics = allMetrics.filter(m => m.shouldCalculate());
    
    const metricsByCategory: Record<string, number> = {};
    for (const metric of allMetrics) {
      metricsByCategory[metric.category] = (metricsByCategory[metric.category] || 0) + 1;
    }

    return {
      total_metrics: allMetrics.length,
      enabled_metrics: enabledMetrics.length,
      metrics_by_category: metricsByCategory
    };
  }

  /**
   * Reset to default metrics only
   */
  resetToDefaults(): void {
    this.metrics.clear();
    for (const metric of this.defaultMetrics) {
      this.registerMetric(metric, false);
    }
  }
}

// Export singleton instance
export const metricsRegistry = new MetricsRegistry();
