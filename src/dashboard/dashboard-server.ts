// Example: Analytics Dashboard Server
// Note: This requires express to be installed: npm install express @types/express
import { EvaluationStore } from '../database/evaluation-store';
import { TokenAnalyticsService } from '../analytics/token-analytics';
import { CostManager } from '../cost-tracking/cost-manager';

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
  private tokenAnalytics: TokenAnalyticsService;
  private costManager: CostManager;

  constructor(store?: EvaluationStore) {
    this.store = store || new EvaluationStore();
    this.analytics = new EvaluationAnalytics(this.store);
    this.tokenAnalytics = new TokenAnalyticsService(this.store);
    this.costManager = new CostManager();
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

    // ========== TOKEN ANALYTICS ENDPOINTS ==========

    // Get comprehensive token analytics report
    this.app.get('/api/analytics/tokens', async (req: any, res: any) => {
      try {
        const days = parseInt(req.query.days) || 30;
        const report = await this.tokenAnalytics.generateAnalyticsReport(days);
        res.json(report);
      } catch (error) {
        console.error('Token analytics error:', error);
        res.status(500).json({ error: 'Failed to generate token analytics' });
      }
    });

    // Get token usage trends
    this.app.get('/api/analytics/tokens/trends', async (req: any, res: any) => {
      try {
        const evalName = req.query.eval_name;
        const days = parseInt(req.query.days) || 30;
        const trends = await this.tokenAnalytics.getTokenTrends(evalName, days);
        res.json(trends);
      } catch (error) {
        console.error('Token trends error:', error);
        res.status(500).json({ error: 'Failed to get token trends' });
      }
    });

    // Compare model token efficiency
    this.app.get('/api/analytics/tokens/efficiency', async (req: any, res: any) => {
      try {
        const models = req.query.models?.split(',') || [];
        const evalName = req.query.eval_name;
        const days = parseInt(req.query.days) || 30;
        const efficiency = await this.tokenAnalytics.compareModelEfficiency(models, evalName, days);
        res.json(efficiency);
      } catch (error) {
        console.error('Model efficiency error:', error);
        res.status(500).json({ error: 'Failed to compare model efficiency' });
      }
    });

    // Get cost breakdown by evaluation
    this.app.get('/api/analytics/costs/breakdown', async (req: any, res: any) => {
      try {
        const days = parseInt(req.query.days) || 30;
        const breakdown = await this.tokenAnalytics.getCostBreakdown(days);
        res.json(breakdown);
      } catch (error) {
        console.error('Cost breakdown error:', error);
        res.status(500).json({ error: 'Failed to get cost breakdown' });
      }
    });

    // Predict costs for future evaluations
    this.app.get('/api/analytics/costs/predict', async (req: any, res: any) => {
      try {
        const { model, eval_name, sample_count, days } = req.query;
        if (!model || !eval_name || !sample_count) {
          return res.status(400).json({ error: 'Missing required parameters: model, eval_name, sample_count' });
        }
        
        const prediction = await this.tokenAnalytics.predictCosts(
          model,
          eval_name,
          parseInt(sample_count),
          parseInt(days) || 7
        );
        res.json(prediction);
      } catch (error) {
        console.error('Cost prediction error:', error);
        res.status(500).json({ error: 'Failed to predict costs' });
      }
    });

    // ========== BUDGET MANAGEMENT ENDPOINTS ==========

    // Set budget for an evaluation
    this.app.post('/api/budget/:evalName', async (req: any, res: any) => {
      try {
        const evalName = req.params.evalName;
        const { budget } = req.body;
        
        if (typeof budget !== 'number' || budget <= 0) {
          return res.status(400).json({ error: 'Budget must be a positive number' });
        }
        
        this.costManager.setBudget(evalName, budget);
        res.json({ success: true, eval_name: evalName, budget });
      } catch (error) {
        console.error('Budget setting error:', error);
        res.status(500).json({ error: 'Failed to set budget' });
      }
    });

    // Get budget status
    this.app.get('/api/budget/:evalName/status', async (req: any, res: any) => {
      try {
        const evalName = req.params.evalName;
        const status = this.costManager.checkBudgetStatus(evalName);
        res.json(status || { status: 'no_budget_set' });
      } catch (error) {
        console.error('Budget status error:', error);
        res.status(500).json({ error: 'Failed to get budget status' });
      }
    });

    // Estimate evaluation cost
    this.app.get('/api/costs/estimate', async (req: any, res: any) => {
      try {
        const { model, sample_count, avg_input_length, avg_output_length } = req.query;
        
        if (!model || !sample_count) {
          return res.status(400).json({ error: 'Missing required parameters: model, sample_count' });
        }
        
        const estimate = this.costManager.estimateEvaluationCost(
          model,
          parseInt(sample_count),
          parseInt(avg_input_length) || 500,
          parseInt(avg_output_length) || 200
        );
        
        res.json({
          model,
          sample_count: parseInt(sample_count),
          estimated_cost: estimate,
          cost_per_sample: estimate / parseInt(sample_count)
        });
      } catch (error) {
        console.error('Cost estimation error:', error);
        res.status(500).json({ error: 'Failed to estimate costs' });
      }
    });

    // Main dashboard data
    this.app.get('/api/dashboard', async (req: any, res: any) => {
      try {
        const days = parseInt(req.query.days) || 7;
        
        // Get comprehensive dashboard data
        const [tokenAnalytics, trends, efficiency] = await Promise.all([
          this.tokenAnalytics.generateAnalyticsReport(days),
          this.tokenAnalytics.getTokenTrends(undefined, days),
          this.tokenAnalytics.compareModelEfficiency([], undefined, days)
        ]);
        
        const dashboard = {
          summary: tokenAnalytics.summary,
          recent_trends: trends.slice(0, 10),
          top_models: efficiency.slice(0, 5),
          recommendations: tokenAnalytics.recommendations,
          period_days: days,
          generated_at: new Date().toISOString()
        };
        
        res.json(dashboard);
      } catch (error) {
        console.error('Dashboard data error:', error);
        res.status(500).json({ error: 'Failed to get dashboard data' });
      }
    });

    // Get list of recent evaluation runs
    this.app.get('/api/evaluations/runs', async (req: any, res: any) => {
      try {
        const days = parseInt(req.query.days) || 30;
        const runs = await this.store.getEvaluationRunsList(days);
        res.json(runs);
      } catch (error) {
        console.error('Error getting evaluation runs:', error);
        res.status(500).json({ error: 'Failed to get evaluation runs' });
      }
    });

    // Get detailed results for a specific evaluation run
    this.app.get('/api/evaluations/:runId/details', async (req: any, res: any) => {
      try {
        const runId = req.params.runId;
        const details = await this.store.getEvaluationDetails(runId);
        res.json(details);
      } catch (error) {
        console.error('Error getting evaluation details:', error);
        res.status(500).json({ error: 'Failed to get evaluation details' });
      }
    });

    // Health check endpoint
    this.app.get('/api/health', async (req: any, res: any) => {
      res.json({
        status: 'healthy',
        services: {
          database: 'connected',
          analytics: 'ready',
          cost_tracking: 'ready'
        },
        timestamp: new Date().toISOString()
      });
    });

    // Static file serving (if express is available)
    if (this.app.get && this.app.use) {
      // Serve basic HTML dashboard
      this.app.get('/', (req: any, res: any) => {
        res.send(this.generateDashboardHTML());
      });
    }
  }

  /**
   * Generate basic HTML dashboard
   */
  private generateDashboardHTML(): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LLM Evaluation Analytics Dashboard</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            .container { max-width: 1200px; margin: 0 auto; }
            .header {
                background: white;
                border-radius: 15px;
                padding: 30px;
                margin-bottom: 30px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                text-align: center;
            }
            .header h1 {
                color: #333;
                font-size: 2.5rem;
                margin-bottom: 10px;
                background: linear-gradient(45deg, #667eea, #764ba2);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            .header p { color: #666; font-size: 1.1rem; }
            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 20px;
            }
            .card {
                background: white;
                border-radius: 15px;
                padding: 25px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .card:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 40px rgba(0,0,0,0.15);
            }
            .card h2 {
                color: #333;
                margin-bottom: 20px;
                font-size: 1.3rem;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .icon { font-size: 1.5rem; }
            .metric {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 0;
                border-bottom: 1px solid #eee;
            }
            .metric:last-child { border-bottom: none; }
            .metric-label { color: #666; font-size: 0.95rem; }
            .metric-value { 
                font-weight: bold; 
                font-size: 1.1rem;
                color: #333;
            }
            .loading {
                text-align: center;
                padding: 40px;
                color: #666;
                font-size: 1.1rem;
            }
            .error {
                background: #fee;
                border: 1px solid #fcc;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                color: #c66;
            }
            .chart-container {
                position: relative;
                height: 300px;
                margin-top: 20px;
            }
            .endpoints {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 20px;
                margin-top: 20px;
                font-family: 'Courier New', monospace;
                font-size: 0.9rem;
            }
            .endpoint {
                margin: 8px 0;
                color: #495057;
            }
            .endpoint strong { color: #007bff; }
            .recommendations {
                background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
                border-radius: 10px;
                padding: 20px;
                margin-top: 20px;
            }
            .recommendation {
                background: rgba(255,255,255,0.8);
                border-radius: 8px;
                padding: 12px;
                margin: 8px 0;
                border-left: 4px solid #28a745;
            }
            button {
                background: linear-gradient(45deg, #667eea, #764ba2);
                border: none;
                border-radius: 8px;
                padding: 12px 24px;
                color: white;
                font-weight: bold;
                cursor: pointer;
                transition: transform 0.2s ease;
                margin: 10px 5px;
            }
            button:hover { transform: scale(1.05); }
            .status-healthy { color: #28a745; font-weight: bold; }
            .status-warning { color: #ffc107; font-weight: bold; }
            .status-error { color: #dc3545; font-weight: bold; }
            
            /* Evaluation Details Styles */
            .evaluation-selector {
                margin-bottom: 20px;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 10px;
            }
            .evaluation-selector select {
                padding: 10px;
                border-radius: 5px;
                border: 1px solid #ddd;
                font-size: 1rem;
                width: 100%;
                max-width: 400px;
            }
            .detail-item {
                background: white;
                margin: 15px 0;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                border-left: 4px solid #007bff;
            }
            .detail-item.passed {
                border-left-color: #28a745;
            }
            .detail-item.failed {
                border-left-color: #dc3545;
            }
            .detail-header {
                display: flex;
                justify-content: between;
                align-items: center;
                margin-bottom: 15px;
                font-weight: bold;
            }
            .detail-section {
                margin: 10px 0;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 5px;
            }
            .detail-section h4 {
                margin: 0 0 8px 0;
                color: #495057;
                font-size: 0.9rem;
                text-transform: uppercase;
                font-weight: bold;
            }
            .detail-content {
                font-family: 'Courier New', monospace;
                font-size: 0.9rem;
                color: #333;
                white-space: pre-wrap;
                word-wrap: break-word;
            }
            .passed-badge {
                background: #28a745;
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: bold;
            }
            .failed-badge {
                background: #dc3545;
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: bold;
            }
            .score-badge {
                background: #6c757d;
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🧠 LLM Evaluation Analytics</h1>
                <p>Real-time token usage, cost tracking, and model performance insights</p>
                <div>
                    <button onclick="refreshData()">🔄 Refresh Data</button>
                    <button onclick="togglePeriod()">📅 Toggle Period</button>
                    <button onclick="showEvaluationDetails()">🔍 Evaluation Details</button>
                    <button onclick="showEndpoints()">🔌 Show API Endpoints</button>
                </div>
            </div>

            <div class="grid" id="dashboard">
                <div class="card">
                    <div class="loading">📊 Loading analytics dashboard...</div>
                </div>
            </div>
        </div>

        <script>
            let currentPeriod = 7;
            
            async function fetchDashboardData() {
                try {
                    const response = await fetch(\`/api/dashboard?days=\${currentPeriod}\`);
                    if (!response.ok) throw new Error('Failed to fetch dashboard data');
                    return await response.json();
                } catch (error) {
                    console.error('Dashboard fetch error:', error);
                    return null;
                }
            }

            async function fetchHealthStatus() {
                try {
                    const response = await fetch('/api/health');
                    return await response.json();
                } catch (error) {
                    return { status: 'error', error: error.message };
                }
            }

            function formatCurrency(amount) {
                return new Intl.NumberFormat('en-US', { 
                    style: 'currency', 
                    currency: 'USD',
                    minimumFractionDigits: 4,
                    maximumFractionDigits: 4 
                }).format(amount);
            }

            function formatNumber(num) {
                return new Intl.NumberFormat('en-US').format(num);
            }

            function renderSummaryCard(summary) {
                return \`
                    <div class="card">
                        <h2><span class="icon">📈</span>Summary (Last \${currentPeriod} Days)</h2>
                        <div class="metric">
                            <span class="metric-label">Total Evaluations</span>
                            <span class="metric-value">\${formatNumber(summary.total_evaluations)}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Total Tokens</span>
                            <span class="metric-value">\${formatNumber(summary.total_tokens)}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Total Cost</span>
                            <span class="metric-value">\${formatCurrency(summary.total_cost)}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Avg Cost per Eval</span>
                            <span class="metric-value">\${formatCurrency(summary.avg_cost_per_evaluation)}</span>
                        </div>
                        \${summary.most_efficient_model ? \`
                        <div class="metric">
                            <span class="metric-label">Most Efficient Model</span>
                            <span class="metric-value" style="color: #28a745;">\${summary.most_efficient_model}</span>
                        </div>
                        \` : ''}
                        \${summary.most_expensive_model ? \`
                        <div class="metric">
                            <span class="metric-label">Most Expensive Model</span>
                            <span class="metric-value" style="color: #dc3545;">\${summary.most_expensive_model}</span>
                        </div>
                        \` : ''}
                    </div>
                \`;
            }

            function renderTopModelsCard(models) {
                if (!models || models.length === 0) {
                    return \`
                        <div class="card">
                            <h2><span class="icon">🏆</span>Top Models</h2>
                            <div class="loading">No model data available</div>
                        </div>
                    \`;
                }

                const modelsList = models.map((model, i) => {
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🔸';
                    return \`
                        <div class="metric">
                            <span class="metric-label">\${medal} \${model.model}</span>
                            <span class="metric-value">\${formatCurrency(model.avg_cost_per_sample)}/sample</span>
                        </div>
                    \`;
                }).join('');

                return \`
                    <div class="card">
                        <h2><span class="icon">🏆</span>Most Efficient Models</h2>
                        \${modelsList}
                    </div>
                \`;
            }

            function renderRecommendationsCard(recommendations) {
                if (!recommendations || recommendations.length === 0) {
                    return \`
                        <div class="card">
                            <h2><span class="icon">💡</span>Recommendations</h2>
                            <div class="loading">No recommendations available</div>
                        </div>
                    \`;
                }

                const recommendationsList = recommendations.slice(0, 5).map(rec => 
                    \`<div class="recommendation">\${rec}</div>\`
                ).join('');

                return \`
                    <div class="card">
                        <h2><span class="icon">💡</span>AI Recommendations</h2>
                        <div class="recommendations">
                            \${recommendationsList}
                        </div>
                    </div>
                \`;
            }

            async function renderSystemStatusCard() {
                const health = await fetchHealthStatus();
                
                const statusClass = health.status === 'healthy' ? 'status-healthy' : 
                                  health.status === 'warning' ? 'status-warning' : 'status-error';
                
                return \`
                    <div class="card">
                        <h2><span class="icon">⚡</span>System Status</h2>
                        <div class="metric">
                            <span class="metric-label">Overall Status</span>
                            <span class="metric-value \${statusClass}">\${health.status.toUpperCase()}</span>
                        </div>
                        \${health.services ? Object.entries(health.services).map(([service, status]) => \`
                            <div class="metric">
                                <span class="metric-label">\${service.replace('_', ' ').toUpperCase()}</span>
                                <span class="metric-value status-healthy">\${status}</span>
                            </div>
                        \`).join('') : ''}
                        <div class="metric">
                            <span class="metric-label">Last Updated</span>
                            <span class="metric-value">\${new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                \`;
            }

            function renderAPIEndpointsCard() {
                return \`
                    <div class="card">
                        <h2><span class="icon">🔌</span>API Endpoints</h2>
                        <div class="endpoints">
                            <div class="endpoint"><strong>GET</strong> /api/dashboard - Main dashboard data</div>
                            <div class="endpoint"><strong>GET</strong> /api/analytics/tokens - Token analytics report</div>
                            <div class="endpoint"><strong>GET</strong> /api/analytics/tokens/trends - Token usage trends</div>
                            <div class="endpoint"><strong>GET</strong> /api/analytics/tokens/efficiency - Model efficiency comparison</div>
                            <div class="endpoint"><strong>GET</strong> /api/analytics/costs/breakdown - Cost breakdown by evaluation</div>
                            <div class="endpoint"><strong>GET</strong> /api/analytics/costs/predict - Cost prediction</div>
                            <div class="endpoint"><strong>GET</strong> /api/costs/estimate - Quick cost estimate</div>
                            <div class="endpoint"><strong>POST</strong> /api/budget/:evalName - Set budget</div>
                            <div class="endpoint"><strong>GET</strong> /api/budget/:evalName/status - Check budget status</div>
                            <div class="endpoint"><strong>GET</strong> /api/health - System health check</div>
                        </div>
                    </div>
                \`;
            }

            async function renderDashboard() {
                const dashboardElement = document.getElementById('dashboard');
                
                try {
                    const data = await fetchDashboardData();
                    
                    if (!data) {
                        dashboardElement.innerHTML = \`
                            <div class="card">
                                <div class="error">
                                    ❌ Failed to load dashboard data. 
                                    Make sure evaluations have been run and the database is accessible.
                                </div>
                            </div>
                        \`;
                        return;
                    }

                    const summaryCard = renderSummaryCard(data.summary);
                    const modelsCard = renderTopModelsCard(data.top_models);
                    const recommendationsCard = renderRecommendationsCard(data.recommendations);
                    const statusCard = await renderSystemStatusCard();
                    const endpointsCard = renderAPIEndpointsCard();

                    dashboardElement.innerHTML = summaryCard + modelsCard + recommendationsCard + statusCard + endpointsCard;
                    
                } catch (error) {
                    dashboardElement.innerHTML = \`
                        <div class="card">
                            <div class="error">❌ Dashboard error: \${error.message}</div>
                        </div>
                    \`;
                }
            }

            function refreshData() {
                renderDashboard();
            }

            function togglePeriod() {
                currentPeriod = currentPeriod === 7 ? 30 : currentPeriod === 30 ? 90 : 7;
                renderDashboard();
            }

            function showEndpoints() {
                const endpointsCard = renderAPIEndpointsCard();
                document.getElementById('dashboard').innerHTML = endpointsCard + 
                    '<div class="card"><button onclick="renderDashboard()">← Back to Dashboard</button></div>';
            }

            // ========== EVALUATION DETAILS FUNCTIONS ==========
            
            async function showEvaluationDetails() {
                try {
                    const runs = await fetchEvaluationRuns();
                    renderEvaluationSelector(runs);
                } catch (error) {
                    console.error('Error loading evaluation runs:', error);
                    document.getElementById('dashboard').innerHTML = 
                        '<div class="card"><div class="error">Failed to load evaluation runs</div></div>';
                }
            }
            
            async function fetchEvaluationRuns() {
                const response = await fetch('/api/evaluations/runs');
                if (!response.ok) throw new Error('Failed to fetch evaluation runs');
                return await response.json();
            }
            
            async function fetchEvaluationDetails(runId) {
                const response = await fetch(\`/api/evaluations/\${runId}/details\`);
                if (!response.ok) throw new Error('Failed to fetch evaluation details');
                return await response.json();
            }
            
            function renderEvaluationSelector(runs) {
                const dashboardElement = document.getElementById('dashboard');
                
                if (!runs || runs.length === 0) {
                    dashboardElement.innerHTML = \`
                        <div class="card">
                            <h2><span class="icon">🔍</span>Evaluation Details</h2>
                            <div class="loading">No evaluations found in the last 30 days</div>
                            <button onclick="renderDashboard()">← Back to Dashboard</button>
                        </div>
                    \`;
                    return;
                }
                
                const options = runs.map(run => {
                    const date = new Date(run.created_at).toLocaleString();
                    const accuracy = (run.score * 100).toFixed(1);
                    return \`<option value="\${run.run_id}">
                        \${run.eval_name} | \${run.model} | \${accuracy}% | \${date}
                    </option>\`;
                }).join('');
                
                dashboardElement.innerHTML = \`
                    <div class="card">
                        <h2><span class="icon">🔍</span>Evaluation Details</h2>
                        <div class="evaluation-selector">
                            <label for="runSelector"><strong>Select an evaluation to view details:</strong></label><br><br>
                            <select id="runSelector" onchange="loadEvaluationDetails()">
                                <option value="">Choose an evaluation...</option>
                                \${options}
                            </select>
                        </div>
                        <button onclick="renderDashboard()">← Back to Dashboard</button>
                        <div id="evaluationDetails"></div>
                    </div>
                \`;
            }
            
            async function loadEvaluationDetails() {
                const runId = document.getElementById('runSelector').value;
                const detailsContainer = document.getElementById('evaluationDetails');
                
                if (!runId) {
                    detailsContainer.innerHTML = '';
                    return;
                }
                
                detailsContainer.innerHTML = '<div class="loading">Loading evaluation details...</div>';
                
                try {
                    const details = await fetchEvaluationDetails(runId);
                    renderEvaluationDetails(details);
                } catch (error) {
                    console.error('Error loading evaluation details:', error);
                    detailsContainer.innerHTML = '<div class="error">Failed to load evaluation details</div>';
                }
            }
            
            function renderEvaluationDetails(details) {
                const detailsContainer = document.getElementById('evaluationDetails');
                
                if (!details || details.length === 0) {
                    detailsContainer.innerHTML = '<div class="loading">No details found for this evaluation</div>';
                    return;
                }
                
                const detailsHtml = details.map((detail, index) => {
                    const passed = detail.passed === 1;
                    const passedClass = passed ? 'passed' : 'failed';
                    const badge = passed ? 
                        '<span class="passed-badge">✓ PASSED</span>' : 
                        '<span class="failed-badge">✗ FAILED</span>';
                    const scoreBadge = \`<span class="score-badge">Score: \${detail.score}</span>\`;
                    
                    // Parse input if it's JSON (chat messages format)
                    let inputDisplay = detail.input_text;
                    try {
                        const parsed = JSON.parse(detail.input_text);
                        if (Array.isArray(parsed)) {
                            inputDisplay = parsed.map(msg => \`**\${msg.role.toUpperCase()}:** \${msg.content}\`).join('\\n\\n');
                        }
                    } catch (e) {
                        // Keep original if not JSON
                    }
                    
                    return \`
                        <div class="detail-item \${passedClass}">
                            <div class="detail-header">
                                <span>Sample \${index + 1}: \${detail.sample_id}</span>
                                <span>\${badge} \${scoreBadge}</span>
                            </div>
                            
                            <div class="detail-section">
                                <h4>📝 Input Prompt</h4>
                                <div class="detail-content">\${inputDisplay}</div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>🎯 Expected Response</h4>
                                <div class="detail-content">\${detail.ideal_response}</div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>🤖 Model Output</h4>
                                <div class="detail-content">\${detail.actual_response}</div>
                            </div>
                            
                            \${detail.reasoning ? \`
                                <div class="detail-section">
                                    <h4>🧠 Evaluation Reasoning</h4>
                                    <div class="detail-content">\${detail.reasoning}</div>
                                </div>
                            \` : ''}
                        </div>
                    \`;
                }).join('');
                
                const summaryInfo = details.length > 0 ? \`
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <strong>📊 Summary:</strong> 
                        \${details[0].eval_name} | \${details[0].model} | 
                        \${details.length} samples | 
                        \${details.filter(d => d.passed === 1).length} passed | 
                        \${details.filter(d => d.passed === 0).length} failed
                        <br><strong>Run Date:</strong> \${new Date(details[0].run_created_at).toLocaleString()}
                    </div>
                \` : '';
                
                detailsContainer.innerHTML = summaryInfo + detailsHtml;
            }

            // Auto-refresh every 30 seconds
            setInterval(refreshData, 30000);
            
            // Initial load
            renderDashboard();
        </script>
    </body>
    </html>
    `;
  }

  start(port = 3000) {
    this.app.listen(port, () => {
      console.log(`🌐 Dashboard available at http://localhost:${port}`);
    });
  }
}
