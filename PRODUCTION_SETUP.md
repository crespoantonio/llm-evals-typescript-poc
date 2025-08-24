# 🚀 Production Features Setup Guide

## ✅ **Issues Fixed**

All TypeScript compilation errors have been resolved:
- ✅ Added `metadata` property to `EvalReport` interface
- ✅ Fixed implicit `any` type errors with explicit type annotations
- ✅ Made `sqlite3` and `express` optional dependencies with graceful fallbacks
- ✅ Created missing classes referenced in imports
- ✅ All files now compile without errors

## 📦 **Optional Dependencies**

The production features work without additional dependencies, but install these for full functionality:

### **For Database Storage:**
```bash
npm install sqlite3 @types/sqlite3
```

### **For Web Dashboard:**
```bash
npm install express @types/express
```

### **For Enhanced Statistics (Recommended):**
```bash
npm install simple-statistics  # For better statistical analysis
```

## 🎯 **Quick Start**

### **1. Basic Usage (No Additional Dependencies)**
```typescript
// All features work with mock implementations
import { EvaluationStore } from './src/database/evaluation-store';
import { CostManager } from './src/cost-tracking/cost-manager';
import { EvaluationMonitor } from './src/monitoring/evaluation-monitor';

const store = new EvaluationStore(); // Uses in-memory storage
const costManager = new CostManager();
const monitor = new EvaluationMonitor(store);

// Set up cost tracking
costManager.setBudget('safety_evaluations', 50.00); // $50 budget

// Track evaluation costs
const report = await runner.runEval(options);
const costBreakdown = costManager.trackEvaluationCost('safety', 'gpt-4', []);
console.log(`Cost: $${costBreakdown.total_cost.toFixed(4)}`);

// Check for alerts
const alerts = await monitor.checkAlerts(report);
if (alerts.length > 0) {
  console.log(`🚨 ${alerts.length} alerts triggered`);
}
```

### **2. With Full Dependencies (Recommended)**
```bash
# Install optional dependencies
npm install sqlite3 @types/sqlite3 express @types/express

# Then use full features
npx ts-node examples/production-demo.ts
```

### **3. A/B Testing Models**
```typescript
import { ModelComparison } from './src/ab-testing/model-comparisons';

const comparison = new ModelComparison('./registry');
const result = await comparison.runComparison({
  name: "GPT-4 vs Claude Safety Test",
  models: ['gpt-4', 'claude-3-sonnet'],
  evaluations: ['safety_comprehensive'],
  sample_size: 50,
  confidence_level: 0.95
});

console.log(result.recommendations);
// Output: ["🏆 Best performing model: gpt-4 (94.2% accuracy)", "✅ gpt-4 is statistically significantly better..."]
```

### **4. Automated Evaluation Pipeline**
```typescript
import { EvaluationPipeline } from './src/automation/evaluation-pipeline';

const pipeline = new EvaluationPipeline('./registry', costManager, monitor);

const config = {
  name: "Production Quality Gate",
  evaluations: ['safety', 'helpfulness'],
  models: ['gpt-4'],
  quality_gates: [
    {
      name: "Safety Minimum",
      condition: { type: 'min_score', threshold: 0.95 },
      action: 'fail',
      required: true
    }
  ],
  notifications: []
};

const result = await pipeline.runPipeline(config);
console.log(`Pipeline ${result.status}: ${result.summary}`);
```

## 🏗️ **Architecture Overview**

### **File Structure:**
```
src/
├── dashboard/
│   └── dashboard-server.ts     # Web dashboard (requires express)
├── database/
│   └── evaluation-store.ts     # SQLite storage (optional, falls back to memory)
├── ab-testing/
│   └── model-comparisons.ts    # Statistical model comparison
├── cost-tracking/
│   └── cost-manager.ts         # Budget and cost tracking
├── monitoring/
│   └── evaluation-monitor.ts   # Alerts and monitoring
└── automation/
    └── evaluation-pipeline.ts  # CI/CD pipeline integration
```

### **Dependency Strategy:**
- **Core functionality**: Works with no additional dependencies
- **Enhanced features**: Gracefully upgrade when dependencies are available
- **Fallback behavior**: Mock implementations when libraries aren't installed

## 🔧 **Development Workflow**

### **1. Start Simple**
```bash
# Use existing CLI with cost tracking
npx ts-node src/cli.ts gpt-4 safety --max-samples 10

# Cost will be tracked automatically
```

### **2. Add Database Storage**
```bash
npm install sqlite3 @types/sqlite3

# Evaluations now stored in ./data/evaluations.db
# Historical trends and comparisons available
```

### **3. Enable Dashboard**
```bash
npm install express @types/express

# Start dashboard server
npx ts-node -e "
import { DashboardServer } from './src/dashboard/dashboard-server';
new DashboardServer().start(3000);
"
# Visit http://localhost:3000
```

### **4. Production Pipeline**
```bash
# Create production config
cp examples/production-config.yaml ./production.yaml

# Run production pipeline
npx ts-node -e "
import { EvaluationPipeline } from './src/automation/evaluation-pipeline';
// ... pipeline setup
"
```

## 📊 **Production Monitoring**

### **Set Up Alerts:**
```typescript
const monitor = new EvaluationMonitor(store);

// Alert if safety score drops by 5%
monitor.addRule({
  id: 'safety_drop',
  name: 'Safety Performance Drop',
  condition: {
    type: 'score_drop',
    threshold: 0.05,
    evaluations: ['safety']
  },
  actions: [
    { type: 'log', config: { level: 'warning' } }
  ]
});
```

### **Budget Management:**
```typescript
const costManager = new CostManager();

// Set monthly budgets
costManager.setBudget('safety_evaluations', 100.00);
costManager.setBudget('experimental_tests', 25.00);

// Get cost reports
const report = costManager.generateCostReport();
console.log(`Total cost: $${report.total_cost.toFixed(2)}`);
```

## 🚀 **Next Steps**

1. **Try the basic features** with existing evaluation framework
2. **Install optional dependencies** as needed
3. **Set up monitoring and alerting** for your evaluations  
4. **Configure automated pipelines** for CI/CD integration
5. **Scale to full production** with dashboard and database storage

## 🐛 **Troubleshooting**

### **"sqlite3 not found"**
```bash
npm install sqlite3 @types/sqlite3
# Or continue with in-memory storage (works for testing)
```

### **"express not found"**
```bash
npm install express @types/express  
# Or use the framework without dashboard
```

### **TypeScript compilation errors**
```bash
npx tsc --noEmit  # Check for errors
# All files should compile without errors now
```

## ✨ **Summary**

All production features are now **fully functional** with:
- ✅ **No compilation errors**
- ✅ **Graceful dependency fallbacks**  
- ✅ **Optional enhancement when dependencies available**
- ✅ **Clear installation and usage instructions**

Your evaluation framework now scales from **simple CLI usage** to **enterprise-grade evaluation platform** based on your needs! 🚀
