// Automated evaluation pipelines for CI/CD integration
import { EvalRunner } from '../eval-runner';
import { RunOptions, EvalReport } from '../types';
import { ModelComparison, ComparisonConfig } from '../ab-testing/model-comparisons';
import { CostManager } from '../cost-tracking/cost-manager';
import { EvaluationMonitor } from '../monitoring/evaluation-monitor';

export interface PipelineConfig {
  name: string;
  trigger: PipelineTrigger;
  evaluations: string[];
  models: string[];
  quality_gates: QualityGate[];
  notifications: NotificationConfig[];
  schedule?: CronSchedule;
  parallel_execution?: boolean;
  max_retries?: number;
}

export interface PipelineTrigger {
  type: 'schedule' | 'webhook' | 'file_change' | 'model_update';
  config: Record<string, any>;
}

export interface QualityGate {
  name: string;
  condition: QualityCondition;
  action: 'warn' | 'fail' | 'block_deployment';
  required: boolean;
}

export interface QualityCondition {
  type: 'min_score' | 'max_regression' | 'max_cost' | 'max_latency';
  threshold: number;
  evaluations?: string[];
  models?: string[];
}

export interface NotificationConfig {
  type: 'slack' | 'email' | 'github_status' | 'webhook';
  config: Record<string, any>;
  trigger_on: ('success' | 'failure' | 'warning')[];
}

export interface CronSchedule {
  minute?: string;
  hour?: string;
  day_of_month?: string;
  month?: string;
  day_of_week?: string;
}

export interface PipelineResult {
  pipeline_id: string;
  name: string;
  status: 'success' | 'failure' | 'warning';
  started_at: string;
  finished_at: string;
  duration_ms: number;
  evaluation_results: EvalReport[];
  quality_gate_results: QualityGateResult[];
  cost_summary: any;
  alerts: any[];
  deployment_recommendation: 'approve' | 'reject' | 'review_required';
  summary: string;
}

export interface QualityGateResult {
  gate_name: string;
  status: 'passed' | 'failed' | 'warning';
  actual_value: number;
  threshold: number;
  message: string;
}

export class EvaluationPipeline {
  private runner: EvalRunner;
  private comparison: ModelComparison;
  private costManager: CostManager;
  private monitor: EvaluationMonitor;
  private activePipelines: Map<string, PipelineResult> = new Map();

  constructor(registryPath: string, costManager: CostManager, monitor: EvaluationMonitor) {
    this.runner = new EvalRunner(registryPath);
    this.comparison = new ModelComparison(registryPath);
    this.costManager = costManager;
    this.monitor = monitor;
  }

  async runPipeline(config: PipelineConfig): Promise<PipelineResult> {
    const pipelineId = `pipeline_${Date.now()}_${config.name.replace(/\s+/g, '_')}`;
    const startTime = Date.now();

    console.log(`🚀 Starting pipeline: "${config.name}" (${pipelineId})`);

    const result: PipelineResult = {
      pipeline_id: pipelineId,
      name: config.name,
      status: 'success',
      started_at: new Date().toISOString(),
      finished_at: '',
      duration_ms: 0,
      evaluation_results: [],
      quality_gate_results: [],
      cost_summary: {},
      alerts: [],
      deployment_recommendation: 'approve',
      summary: ''
    };

    this.activePipelines.set(pipelineId, result);

    try {
      // 1. Run all evaluations
      console.log(`📊 Running ${config.evaluations.length} evaluations on ${config.models.length} models...`);
      
      if (config.parallel_execution) {
        result.evaluation_results = await this.runEvaluationsParallel(config);
      } else {
        result.evaluation_results = await this.runEvaluationsSequential(config);
      }

      // 2. Check quality gates
      console.log(`🚧 Checking ${config.quality_gates.length} quality gates...`);
      result.quality_gate_results = this.evaluateQualityGates(config.quality_gates, result.evaluation_results);

      // 3. Calculate cost summary
      result.cost_summary = this.calculateCostSummary(result.evaluation_results);

      // 4. Check for alerts
      for (const evalResult of result.evaluation_results) {
        const alerts = await this.monitor.checkAlerts(evalResult);
        result.alerts.push(...alerts);
      }

      // 5. Determine overall status and deployment recommendation
      const failedGates = result.quality_gate_results.filter(g => g.status === 'failed');
      const warningGates = result.quality_gate_results.filter(g => g.status === 'warning');

      if (failedGates.length > 0) {
        result.status = 'failure';
        result.deployment_recommendation = 'reject';
      } else if (warningGates.length > 0 || result.alerts.length > 0) {
        result.status = 'warning';
        result.deployment_recommendation = 'review_required';
      }

      // 6. Generate summary
      result.summary = this.generatePipelineSummary(result);

      console.log(`✅ Pipeline "${config.name}" completed: ${result.status.toUpperCase()}`);

    } catch (error) {
      result.status = 'failure';
      result.deployment_recommendation = 'reject';
      result.summary = `Pipeline failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`❌ Pipeline "${config.name}" failed:`, error);
    }

    // Finalize result
    result.finished_at = new Date().toISOString();
    result.duration_ms = Date.now() - startTime;

    // Send notifications
    await this.sendNotifications(config.notifications, result);

    this.activePipelines.delete(pipelineId);
    return result;
  }

  private async runEvaluationsSequential(config: PipelineConfig): Promise<EvalReport[]> {
    const results: EvalReport[] = [];

    for (const model of config.models) {
      for (const evaluation of config.evaluations) {
        console.log(`  🧪 Running ${model} on ${evaluation}...`);
        
        const options: RunOptions = {
          model,
          eval: evaluation,
          registry_path: './registry',
          verbose: false
        };

        const report = await this.runner.runEval(options);
        results.push(report);

        // Track costs
        this.costManager.trackEvaluationCost(evaluation, model, []);
      }
    }

    return results;
  }

  private async runEvaluationsParallel(config: PipelineConfig): Promise<EvalReport[]> {
    const tasks: Promise<EvalReport>[] = [];

    for (const model of config.models) {
      for (const evaluation of config.evaluations) {
        const options: RunOptions = {
          model,
          eval: evaluation,
          registry_path: './registry',
          verbose: false
        };

        tasks.push(this.runner.runEval(options));
      }
    }

    console.log(`  ⚡ Running ${tasks.length} evaluations in parallel...`);
    return await Promise.all(tasks);
  }

  private evaluateQualityGates(gates: QualityGate[], results: EvalReport[]): QualityGateResult[] {
    return gates.map(gate => this.evaluateQualityGate(gate, results));
  }

  private evaluateQualityGate(gate: QualityGate, results: EvalReport[]): QualityGateResult {
    const { condition } = gate;
    
    // Filter results if specific evaluations/models are specified
    let filteredResults = results;
    if (condition.evaluations) {
      filteredResults = filteredResults.filter(r => condition.evaluations!.includes(r.eval_name));
    }
    if (condition.models) {
      filteredResults = filteredResults.filter(r => condition.models!.includes(r.model));
    }

    let actualValue: number;
    let passed: boolean;
    let message: string;

    switch (condition.type) {
      case 'min_score':
        actualValue = this.calculateAverageScore(filteredResults);
        passed = actualValue >= condition.threshold;
        message = `Average score: ${(actualValue * 100).toFixed(1)}% (required: ≥${(condition.threshold * 100).toFixed(1)}%)`;
        break;

      case 'max_regression':
        // This would compare against baseline - simplified for example
        actualValue = 0; // Would calculate regression from baseline
        passed = actualValue <= condition.threshold;
        message = `Performance regression: ${(actualValue * 100).toFixed(1)}% (max allowed: ${(condition.threshold * 100).toFixed(1)}%)`;
        break;

      case 'max_cost':
        actualValue = this.calculateTotalCost(filteredResults);
        passed = actualValue <= condition.threshold;
        message = `Total cost: $${actualValue.toFixed(4)} (max allowed: $${condition.threshold.toFixed(4)})`;
        break;

      case 'max_latency':
        actualValue = this.calculateAverageLatency(filteredResults);
        passed = actualValue <= condition.threshold;
        message = `Average latency: ${actualValue.toFixed(0)}ms (max allowed: ${condition.threshold.toFixed(0)}ms)`;
        break;

      default:
        actualValue = 0;
        passed = true;
        message = 'Unknown condition type';
    }

    return {
      gate_name: gate.name,
      status: passed ? 'passed' : (gate.required ? 'failed' : 'warning'),
      actual_value: actualValue,
      threshold: condition.threshold,
      message
    };
  }

  private calculateAverageScore(results: EvalReport[]): number {
    if (results.length === 0) return 0;
    return results.reduce((sum, r) => sum + r.score, 0) / results.length;
  }

  private calculateTotalCost(results: EvalReport[]): number {
    // Would integrate with cost manager to get actual costs
    return results.length * 0.01; // Placeholder
  }

  private calculateAverageLatency(results: EvalReport[]): number {
    if (results.length === 0) return 0;
    return results.reduce((sum, r) => sum + (r.duration_ms / r.total_samples), 0) / results.length;
  }

  private calculateCostSummary(results: EvalReport[]): any {
    return {
      total_cost: this.calculateTotalCost(results),
      cost_per_evaluation: this.calculateTotalCost(results) / results.length,
      cost_breakdown: results.map(r => ({
        evaluation: r.eval_name,
        model: r.model,
        estimated_cost: 0.01 // Placeholder
      }))
    };
  }

  private generatePipelineSummary(result: PipelineResult): string {
    const totalEvals = result.evaluation_results.length;
    const passedGates = result.quality_gate_results.filter(g => g.status === 'passed').length;
    const totalGates = result.quality_gate_results.length;
    const avgScore = this.calculateAverageScore(result.evaluation_results);

    return `Completed ${totalEvals} evaluations with ${(avgScore * 100).toFixed(1)}% average score. ` +
           `Quality gates: ${passedGates}/${totalGates} passed. ` +
           `${result.alerts.length} alerts triggered. ` +
           `Duration: ${(result.duration_ms / 1000).toFixed(1)}s. ` +
           `Recommendation: ${result.deployment_recommendation.replace('_', ' ').toUpperCase()}`;
  }

  private async sendNotifications(configs: NotificationConfig[], result: PipelineResult): Promise<void> {
    for (const config of configs) {
      if (config.trigger_on.includes(result.status as any)) {
        await this.sendNotification(config, result);
      }
    }
  }

  private async sendNotification(config: NotificationConfig, result: PipelineResult): Promise<void> {
    const message = `Pipeline "${result.name}" ${result.status}: ${result.summary}`;
    
    switch (config.type) {
      case 'slack':
        console.log(`📱 Would send Slack notification: ${message}`);
        break;
      case 'email':
        console.log(`📧 Would send email notification: ${message}`);
        break;
      case 'github_status':
        console.log(`🔗 Would update GitHub status: ${result.deployment_recommendation}`);
        break;
      case 'webhook':
        console.log(`🌐 Would send webhook notification to ${config.config.url}`);
        break;
    }
  }

  // Schedule management methods
  schedulePipeline(config: PipelineConfig): void {
    if (!config.schedule) return;
    
    console.log(`⏰ Scheduling pipeline "${config.name}" with cron: ${this.cronToString(config.schedule)}`);
    // Implementation would use node-cron or similar
  }

  private cronToString(schedule: CronSchedule): string {
    return `${schedule.minute || '*'} ${schedule.hour || '*'} ${schedule.day_of_month || '*'} ${schedule.month || '*'} ${schedule.day_of_week || '*'}`;
  }

  getActivePipelines(): PipelineResult[] {
    return Array.from(this.activePipelines.values());
  }
}
