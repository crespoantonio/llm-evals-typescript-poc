// Example: Analytics Dashboard Server
// Note: This requires express to be installed: npm install express @types/express
import { EvaluationStore } from '../database/evaluation-store';

// Mock analytics class for demonstration
class EvaluationAnalytics {
  constructor(private store: EvaluationStore) {}
  
  async getPerformanceTrends(evalName: string, options: any) {
    return this.store.getPerformanceTrends(evalName, 30);
  }
  
  async compareModels(options: any) {
    return this.store.compareModels(options.models, options.evaluations);
  }
  
  async analyzeFailures(runId: string) {
    return { failures: [], analysis: 'Mock analysis' };
  }
}

export class DashboardServer {
  private app: any;
  private analytics: EvaluationAnalytics;
  private store: EvaluationStore;

  constructor(store?: EvaluationStore) {
    this.store = store || new EvaluationStore();
    this.analytics = new EvaluationAnalytics(this.store);
    this.app = this.createApp();
    this.setupRoutes();
  }

  private createApp() {
    try {
      const express = require('express');
      return express();
    } catch (error) {
      console.warn('⚠️  express not installed. Run: npm install express @types/express');
      // Return mock app
      return {
        get: () => {},
        listen: () => console.log('Mock server - express not available')
      };
    }
  }

  private setupRoutes() {
    // Get evaluation trends over time
    this.app.get('/api/trends/:evalName', async (req: any, res: any) => {
      const trends = await this.analytics.getPerformanceTrends(req.params.evalName, {
        timeRange: req.query.range as string || '30d',
        models: req.query.models as string[] || [],
        granularity: req.query.granularity as 'day' | 'hour' || 'day'
      });
      
      res.json(trends);
    });

    // Compare multiple models side-by-side
    this.app.get('/api/compare', async (req: any, res: any) => {
      const comparison = await this.analytics.compareModels({
        models: req.query.models as string[],
        evaluations: req.query.evals as string[],
        metrics: ['accuracy', 'avg_score', 'latency', 'cost']
      });
      
      res.json(comparison);
    });

    // Get detailed failure analysis
    this.app.get('/api/failures/:runId', async (req: any, res: any) => {
      const analysis = await this.analytics.analyzeFailures(req.params.runId);
      res.json(analysis);
    });
  }

  start(port = 3000) {
    this.app.listen(port, () => {
      console.log(`🌐 Dashboard available at http://localhost:${port}`);
    });
  }
}
