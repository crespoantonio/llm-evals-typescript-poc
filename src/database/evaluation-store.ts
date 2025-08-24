// Evaluation Results Storage & History
import { EvalResult, EvalReport } from '../types';

// Type-only import to avoid requiring sqlite3 to be installed
interface Database {
  run(sql: string, params?: any[], callback?: (err: Error | null) => void): void;
  get(sql: string, params: any[], callback: (err: Error | null, row: any) => void): void;
  all(sql: string, params: any[], callback: (err: Error | null, rows: any[]) => void): void;
}

export interface EvaluationTrend {
  date: string;
  score: number;
  model: string;
  evaluation: string;
  sample_count: number;
  avg_latency?: number;
  total_cost?: number;
}

export class EvaluationStore {
  private db: Database;

  constructor(dbPath: string = './data/evaluations.db') {
    this.db = this.createDatabase(dbPath);
    this.initTables();
  }

  private createDatabase(dbPath: string): Database {
    try {
      // Try to load sqlite3 dynamically
      const sqlite3 = require('sqlite3');
      return new sqlite3.Database(dbPath);
    } catch (error) {
      console.warn('⚠️  sqlite3 not installed, using in-memory storage. Run: npm install sqlite3');
      // Return a mock database for demonstration
      return this.createMockDatabase();
    }
  }

  private createMockDatabase(): Database {
    const mockData: Record<string, any[]> = {};
    
    return {
      run: (sql: string, params?: any[], callback?: (err: Error | null) => void) => {
        // Mock implementation
        setTimeout(() => callback?.(null), 0);
      },
      get: (sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
        // Mock implementation
        setTimeout(() => callback(null, {}), 0);
      },
      all: (sql: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
        // Mock implementation  
        setTimeout(() => callback(null, []), 0);
      }
    };
  }

  private initTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS eval_runs (
        id TEXT PRIMARY KEY,
        eval_name TEXT,
        model TEXT,
        score REAL,
        total_samples INTEGER,
        correct INTEGER,
        incorrect INTEGER,
        duration_ms INTEGER,
        cost_usd REAL,
        created_at TEXT,
        metadata TEXT
      )`,
      
      `CREATE TABLE IF NOT EXISTS eval_results (
        id TEXT PRIMARY KEY,
        run_id TEXT,
        sample_id TEXT,
        input_text TEXT,
        ideal_response TEXT,
        actual_response TEXT,
        score REAL,
        passed BOOLEAN,
        reasoning TEXT,
        latency_ms INTEGER,
        metadata TEXT,
        FOREIGN KEY (run_id) REFERENCES eval_runs(id)
      )`,

      `CREATE TABLE IF NOT EXISTS model_comparisons (
        id TEXT PRIMARY KEY,
        comparison_name TEXT,
        models TEXT,
        evaluations TEXT,
        results TEXT,
        created_at TEXT
      )`
    ];

    tables.forEach(sql => {
      this.db.run(sql);
    });
  }

  async saveEvaluation(report: EvalReport, cost?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO eval_runs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          report.run_id,
          report.eval_name,
          report.model,
          report.score,
          report.total_samples,
          report.correct,
          report.incorrect,
          report.duration_ms,
          cost || 0,
          report.created_at,
          JSON.stringify(report.metadata || {})
        ],
        (err: Error | null) => err ? reject(err) : resolve()
      );
    });
  }

  async getPerformanceTrends(
    evalName: string, 
    days: number = 30
  ): Promise<EvaluationTrend[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT 
          DATE(created_at) as date,
          AVG(score) as score,
          model,
          eval_name as evaluation,
          SUM(total_samples) as sample_count,
          AVG(duration_ms / total_samples) as avg_latency,
          SUM(cost_usd) as total_cost
        FROM eval_runs 
        WHERE eval_name = ? 
          AND created_at > datetime('now', '-${days} days')
        GROUP BY DATE(created_at), model, eval_name
        ORDER BY date DESC`,
        [evalName],
        (err: Error | null, rows: any[]) => err ? reject(err) : resolve(rows as EvaluationTrend[])
      );
    });
  }

  async compareModels(
    models: string[], 
    evaluations: string[]
  ): Promise<Record<string, any>> {
    const comparison: Record<string, any> = {};
    
    for (const model of models) {
      comparison[model] = {};
      for (const evaluation of evaluations) {
        const stats = await this.getModelEvalStats(model, evaluation);
        comparison[model][evaluation] = stats;
      }
    }
    
    return comparison;
  }

  private async getModelEvalStats(
    model: string, 
    evaluation: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT 
          COUNT(*) as runs,
          AVG(score) as avg_score,
          MAX(score) as best_score,
          MIN(score) as worst_score,
          AVG(duration_ms) as avg_duration,
          SUM(cost_usd) as total_cost
        FROM eval_runs 
        WHERE model = ? AND eval_name = ?`,
        [model, evaluation],
        (err: Error | null, row: any) => err ? reject(err) : resolve(row)
      );
    });
  }
}
