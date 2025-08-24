// A/B Testing for Model Performance
import { EvalRunner } from '../eval-runner';
import { RunOptions, EvalReport } from '../types';

export interface ComparisonConfig {
  name: string;
  models: string[];
  evaluations: string[];
  sample_size?: number;
  confidence_level?: number; // 0.95 for 95% confidence
  statistical_test?: 'ttest' | 'wilcoxon' | 'bootstrap';
}

export interface ComparisonResult {
  comparison_id: string;
  config: ComparisonConfig;
  model_results: Record<string, EvalReport[]>;
  statistical_analysis: {
    significant_differences: Array<{
      model_a: string;
      model_b: string;
      evaluation: string;
      p_value: number;
      effect_size: number;
      is_significant: boolean;
      winner?: string;
    }>;
    overall_ranking: Array<{
      model: string;
      avg_score: number;
      confidence_interval: [number, number];
    }>;
  };
  recommendations: string[];
  created_at: string;
}

export class ModelComparison {
  private runner: EvalRunner;

  constructor(registryPath: string) {
    this.runner = new EvalRunner(registryPath);
  }

  async runComparison(config: ComparisonConfig): Promise<ComparisonResult> {
    console.log(`🔬 Starting A/B test: "${config.name}"`);
    console.log(`📊 Testing ${config.models.length} models on ${config.evaluations.length} evaluations`);

    const results: Record<string, EvalReport[]> = {};

    // Run all model-evaluation combinations
    for (const model of config.models) {
      results[model] = [];
      
      for (const evaluation of config.evaluations) {
        console.log(`\n🧪 Testing ${model} on ${evaluation}...`);
        
        const options: RunOptions = {
          model,
          eval: evaluation,
          registry_path: './registry',
          max_samples: config.sample_size,
          verbose: false
        };

        const report = await this.runner.runEval(options);
        results[model].push(report);
      }
    }

    // Perform statistical analysis
    const statistical_analysis = this.performStatisticalAnalysis(results, config);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(statistical_analysis, results);

    return {
      comparison_id: `comparison_${Date.now()}`,
      config,
      model_results: results,
      statistical_analysis,
      recommendations,
      created_at: new Date().toISOString()
    };
  }

  private performStatisticalAnalysis(
    results: Record<string, EvalReport[]>, 
    config: ComparisonConfig
  ) {
    const significant_differences: any[] = [];
    const overall_ranking: any[] = [];

    // Compare each pair of models
    const models = Object.keys(results);
    for (let i = 0; i < models.length; i++) {
      for (let j = i + 1; j < models.length; j++) {
        const modelA = models[i];
        const modelB = models[j];

        for (let evalIdx = 0; evalIdx < config.evaluations.length; evalIdx++) {
          const reportA = results[modelA][evalIdx];
          const reportB = results[modelB][evalIdx];
          
          const scoresA = reportA.results.map(r => r.score);
          const scoresB = reportB.results.map(r => r.score);
          
          // Simplified t-test (in production, use proper statistical library)
          const stats = this.simpleTTest(scoresA, scoresB);
          
          significant_differences.push({
            model_a: modelA,
            model_b: modelB,
            evaluation: config.evaluations[evalIdx],
            p_value: stats.pValue,
            effect_size: stats.effectSize,
            is_significant: stats.pValue < (1 - (config.confidence_level || 0.95)),
            winner: stats.meanDifference > 0 ? modelA : modelB
          });
        }
      }
    }

    // Calculate overall ranking
    for (const model of models) {
      const allScores = results[model].flatMap(report => 
        report.results.map(r => r.score)
      );
      
      const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      const stdDev = Math.sqrt(
        allScores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / allScores.length
      );
      
      // Simple confidence interval (mean ± 1.96 * stderr)
      const stderr = stdDev / Math.sqrt(allScores.length);
      const margin = 1.96 * stderr;
      
      overall_ranking.push({
        model,
        avg_score: avgScore,
        confidence_interval: [avgScore - margin, avgScore + margin] as [number, number]
      });
    }

    // Sort by average score descending
    overall_ranking.sort((a, b) => b.avg_score - a.avg_score);

    return { significant_differences, overall_ranking };
  }

  private simpleTTest(scoresA: number[], scoresB: number[]) {
    const meanA = scoresA.reduce((a, b) => a + b, 0) / scoresA.length;
    const meanB = scoresB.reduce((a, b) => a + b, 0) / scoresB.length;
    
    const varA = scoresA.reduce((sum, score) => sum + Math.pow(score - meanA, 2), 0) / (scoresA.length - 1);
    const varB = scoresB.reduce((sum, score) => sum + Math.pow(score - meanB, 2), 0) / (scoresB.length - 1);
    
    const pooledStd = Math.sqrt((varA / scoresA.length) + (varB / scoresB.length));
    const tStat = (meanA - meanB) / pooledStd;
    
    // Simplified p-value calculation (use proper library in production)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(tStat)));
    
    // Cohen's d for effect size
    const pooledVariance = ((scoresA.length - 1) * varA + (scoresB.length - 1) * varB) / 
                          (scoresA.length + scoresB.length - 2);
    const effectSize = (meanA - meanB) / Math.sqrt(pooledVariance);
    
    return {
      meanDifference: meanA - meanB,
      tStat,
      pValue: Math.max(0.001, pValue), // Floor at 0.001
      effectSize
    };
  }

  private normalCDF(x: number): number {
    // Approximation of normal CDF
    return (1 + Math.sign(x) * Math.sqrt(1 - Math.exp(-2 * x * x / Math.PI))) / 2;
  }

  private generateRecommendations(
    analysis: any, 
    results: Record<string, EvalReport[]>
  ): string[] {
    const recommendations: string[] = [];
    
    const topModel = analysis.overall_ranking[0];
    const secondModel = analysis.overall_ranking[1];
    
    recommendations.push(
      `🏆 Best performing model: ${topModel.model} (${(topModel.avg_score * 100).toFixed(1)}% accuracy)`
    );
    
    if (topModel.confidence_interval[0] > secondModel.confidence_interval[1]) {
      recommendations.push(
        `✅ ${topModel.model} is statistically significantly better than ${secondModel.model}`
      );
    } else {
      recommendations.push(
        `⚠️  No statistically significant difference between top 2 models - consider cost/speed trade-offs`
      );
    }

    // Check for evaluation-specific winners
    const significantDifferences = analysis.significant_differences.filter((d: any) => d.is_significant);
    if (significantDifferences.length > 0) {
      recommendations.push(
        `📊 Found ${significantDifferences.length} statistically significant performance differences`
      );
    }

    return recommendations;
  }
}
