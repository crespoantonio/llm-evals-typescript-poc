// Real-time monitoring and alerting for evaluation performance
import { EvalReport, EvalResult } from '../types';
import { EvaluationStore } from '../database/evaluation-store';

export interface AlertRule {
  id: string;
  name: string;
  condition: AlertCondition;
  actions: AlertAction[];
  enabled: boolean;
  cooldown_minutes?: number; // Prevent spam
}

export interface AlertCondition {
  type: 'score_drop' | 'failure_rate' | 'latency_spike' | 'cost_spike' | 'custom';
  threshold: number;
  comparison: 'less_than' | 'greater_than' | 'percentage_change';
  time_window_minutes?: number;
  evaluation_names?: string[];
  models?: string[];
}

export interface AlertAction {
  type: 'email' | 'slack' | 'webhook' | 'log';
  config: Record<string, any>;
}

export interface Alert {
  id: string;
  rule_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  triggered_at: string;
  resolved_at?: string;
  data: Record<string, any>;
}

export class EvaluationMonitor {
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private lastAlertTimes: Map<string, number> = new Map();
  private store: EvaluationStore;

  constructor(store: EvaluationStore) {
    this.store = store;
    this.setupDefaultRules();
  }

  private setupDefaultRules() {
    // Performance degradation alert
    this.addRule({
      id: 'performance_drop',
      name: 'Performance Drop Alert',
      condition: {
        type: 'score_drop',
        threshold: 0.1, // 10% drop
        comparison: 'percentage_change',
        time_window_minutes: 60
      },
      actions: [
        { type: 'log', config: { level: 'warning' } },
        { type: 'slack', config: { channel: '#eval-alerts' } }
      ],
      enabled: true,
      cooldown_minutes: 30
    });

    // High failure rate alert  
    this.addRule({
      id: 'high_failure_rate',
      name: 'High Failure Rate',
      condition: {
        type: 'failure_rate',
        threshold: 0.2, // 20% failure rate
        comparison: 'greater_than',
        time_window_minutes: 30
      },
      actions: [
        { type: 'log', config: { level: 'error' } },
        { type: 'email', config: { to: 'team@company.com' } }
      ],
      enabled: true,
      cooldown_minutes: 15
    });

    // Latency spike alert
    this.addRule({
      id: 'latency_spike',
      name: 'Response Time Spike',
      condition: {
        type: 'latency_spike',
        threshold: 2.0, // 2x normal latency
        comparison: 'percentage_change',
        time_window_minutes: 15
      },
      actions: [
        { type: 'log', config: { level: 'warning' } }
      ],
      enabled: true,
      cooldown_minutes: 10
    });
  }

  addRule(rule: AlertRule) {
    this.alertRules.set(rule.id, rule);
  }

  async checkAlerts(report: EvalReport): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = [];

    for (const [ruleId, rule] of this.alertRules.entries()) {
      if (!rule.enabled) continue;

      // Check cooldown
      const lastAlertTime = this.lastAlertTimes.get(ruleId) || 0;
      const cooldownMs = (rule.cooldown_minutes || 0) * 60 * 1000;
      if (Date.now() - lastAlertTime < cooldownMs) continue;

      const alert = await this.evaluateRule(rule, report);
      if (alert) {
        triggeredAlerts.push(alert);
        this.activeAlerts.set(alert.id, alert);
        this.lastAlertTimes.set(ruleId, Date.now());
        
        // Execute alert actions
        await this.executeAlertActions(alert, rule.actions);
      }
    }

    return triggeredAlerts;
  }

  private async evaluateRule(rule: AlertRule, report: EvalReport): Promise<Alert | null> {
    const { condition } = rule;

    // Filter by evaluation/model if specified
    if (condition.evaluation_names && !condition.evaluation_names.includes(report.eval_name)) {
      return null;
    }
    if (condition.models && !condition.models.includes(report.model)) {
      return null;
    }

    switch (condition.type) {
      case 'score_drop':
        return await this.checkScoreDrop(rule, report);
      
      case 'failure_rate':
        return this.checkFailureRate(rule, report);
      
      case 'latency_spike':
        return await this.checkLatencySpike(rule, report);
      
      default:
        return null;
    }
  }

  private async checkScoreDrop(rule: AlertRule, report: EvalReport): Promise<Alert | null> {
    const { condition } = rule;
    
    // Get recent performance trends
    const trends = await this.store.getPerformanceTrends(
      report.eval_name, 
      Math.ceil((condition.time_window_minutes || 60) / (24 * 60)) // Convert to days
    );

    if (trends.length < 2) return null; // Need historical data

    const recentScores = trends.slice(0, 5).map(t => t.score);
    const olderScores = trends.slice(5, 10).map(t => t.score);

    if (recentScores.length === 0 || olderScores.length === 0) return null;

    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
    
    const percentageChange = Math.abs((recentAvg - olderAvg) / olderAvg);

    if (recentAvg < olderAvg && percentageChange >= condition.threshold) {
      return {
        id: `alert_${Date.now()}_${rule.id}`,
        rule_id: rule.id,
        severity: percentageChange >= 0.2 ? 'high' : 'medium',
        title: `Performance Drop Detected: ${report.eval_name}`,
        description: `Score dropped ${(percentageChange * 100).toFixed(1)}% for ${report.eval_name} on ${report.model}. Recent average: ${(recentAvg * 100).toFixed(1)}%, Previous average: ${(olderAvg * 100).toFixed(1)}%`,
        triggered_at: new Date().toISOString(),
        data: {
          recent_average: recentAvg,
          previous_average: olderAvg,
          percentage_change: percentageChange,
          evaluation: report.eval_name,
          model: report.model
        }
      };
    }

    return null;
  }

  private checkFailureRate(rule: AlertRule, report: EvalReport): Alert | null {
    const failureRate = report.incorrect / report.total_samples;
    
    if (failureRate >= rule.condition.threshold) {
      return {
        id: `alert_${Date.now()}_${rule.id}`,
        rule_id: rule.id,
        severity: failureRate >= 0.5 ? 'critical' : 'high',
        title: `High Failure Rate: ${report.eval_name}`,
        description: `Failure rate of ${(failureRate * 100).toFixed(1)}% detected for ${report.eval_name} on ${report.model} (${report.incorrect}/${report.total_samples} failed)`,
        triggered_at: new Date().toISOString(),
        data: {
          failure_rate: failureRate,
          failed_samples: report.incorrect,
          total_samples: report.total_samples,
          evaluation: report.eval_name,
          model: report.model
        }
      };
    }

    return null;
  }

  private async checkLatencySpike(rule: AlertRule, report: EvalReport): Promise<Alert | null> {
    const avgLatency = report.duration_ms / report.total_samples;
    
    // Get baseline latency from historical data
    const trends = await this.store.getPerformanceTrends(report.eval_name, 7);
    if (trends.length === 0) return null;

    const baselineLatency = trends.reduce((sum, t) => sum + (t.avg_latency || 0), 0) / trends.length;
    
    if (baselineLatency > 0 && avgLatency > baselineLatency * rule.condition.threshold) {
      return {
        id: `alert_${Date.now()}_${rule.id}`,
        rule_id: rule.id,
        severity: 'medium',
        title: `Latency Spike: ${report.eval_name}`,
        description: `Response time spike detected: ${avgLatency.toFixed(0)}ms vs baseline ${baselineLatency.toFixed(0)}ms (${((avgLatency / baselineLatency) * 100).toFixed(1)}% increase)`,
        triggered_at: new Date().toISOString(),
        data: {
          current_latency: avgLatency,
          baseline_latency: baselineLatency,
          spike_ratio: avgLatency / baselineLatency,
          evaluation: report.eval_name,
          model: report.model
        }
      };
    }

    return null;
  }

  private async executeAlertActions(alert: Alert, actions: AlertAction[]): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'log':
            this.logAlert(alert, action.config);
            break;
          
          case 'slack':
            await this.sendSlackAlert(alert, action.config);
            break;
          
          case 'email':
            await this.sendEmailAlert(alert, action.config);
            break;
          
          case 'webhook':
            await this.sendWebhookAlert(alert, action.config);
            break;
        }
      } catch (error) {
        console.error(`Failed to execute alert action ${action.type}:`, error);
      }
    }
  }

  private logAlert(alert: Alert, config: any): void {
    const logMessage = `🚨 [${alert.severity.toUpperCase()}] ${alert.title}: ${alert.description}`;
    
    switch (config.level) {
      case 'error':
        console.error(logMessage);
        break;
      case 'warning':
        console.warn(logMessage);
        break;
      default:
        console.info(logMessage);
    }
  }

  private async sendSlackAlert(alert: Alert, config: any): Promise<void> {
    // Implementation would integrate with Slack API
    console.log(`📱 Would send Slack alert to ${config.channel}: ${alert.title}`);
  }

  private async sendEmailAlert(alert: Alert, config: any): Promise<void> {
    // Implementation would integrate with email service
    console.log(`📧 Would send email alert to ${config.to}: ${alert.title}`);
  }

  private async sendWebhookAlert(alert: Alert, config: any): Promise<void> {
    // Implementation would send HTTP POST to webhook URL
    console.log(`🌐 Would send webhook alert to ${config.url}: ${alert.title}`);
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved_at = new Date().toISOString();
      return true;
    }
    return false;
  }
}
