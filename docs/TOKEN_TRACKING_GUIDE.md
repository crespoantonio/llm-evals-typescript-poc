# 📊 Token Tracking & Cost Management Guide

This guide explains how to use the comprehensive token tracking, cost analysis, and budget management features in the LLM Evaluation Framework.

## 🎯 Overview

The token tracking system provides:
- **Real-time token usage** calculation for all evaluations
- **Cost estimation** and **budget management**
- **Model efficiency** comparison
- **Interactive web dashboard** with analytics
- **CLI commands** for cost analysis
- **Predictive cost modeling** for planning

## 📈 What Gets Tracked

### **Token Usage**
- **Prompt tokens**: Tokens in the input/question
- **Completion tokens**: Tokens in the model's response  
- **Total tokens**: Combined prompt + completion tokens
- **Per-sample statistics**: Min, max, and average tokens per question
- **Embeddings usage**: Tokens used for semantic similarity evaluations

### **Cost Calculations**
- **Real-time cost tracking** based on current model pricing
- **Cost per sample** and **cost per evaluation**
- **Cost breakdown** by prompt vs completion tokens
- **Historical cost trends** and projections
- **Budget alerts** and **spending limits**

### **Model Efficiency Metrics**
- **Cost per correct answer** (efficiency score)
- **Token efficiency** comparison between models
- **Performance vs cost** analysis
- **ROI calculations** for model selection

---

## 🚀 Getting Started

### **1. Basic Usage - Automatic Tracking**

Token tracking happens **automatically** for all evaluations:

```bash
# Standard evaluation - tokens are tracked automatically
npx ts-node src/cli.ts gpt-3.5-turbo math-basic --max-samples 10

# Results now include token usage:
# 🎯 Final Results:
#    Accuracy: 85.0% (8/10)
# 📊 Token Usage:
#    • Total tokens: 1,247
#    • Avg tokens/sample: 124
# 💰 Estimated Cost:
#    • Total: $0.0025
#    • Cost per sample: $0.0003
```

### **2. Advanced Analytics Commands**

```bash
# Generate comprehensive token report
npx ts-node src/cli.ts tokens report 30

# Show token trends for specific evaluation
npx ts-node src/cli.ts tokens trends math-basic 7

# Compare model efficiency
npx ts-node src/cli.ts tokens efficiency gpt-3.5-turbo gpt-4 --eval math-basic

# Get cost breakdown by evaluation
npx ts-node src/cli.ts costs breakdown 30

# Predict costs for future evaluation
npx ts-node src/cli.ts costs predict gpt-4 math-basic 100

# Quick cost estimate
npx ts-node src/cli.ts costs estimate gpt-3.5-turbo 50 --input-length 500

# Budget management
npx ts-node src/cli.ts costs budget math-basic 25.00  # Set $25 budget
npx ts-node src/cli.ts costs budget math-basic        # Check status
```

### **3. Web Dashboard**

```bash
# Start interactive web dashboard
npx ts-node src/cli.ts dashboard 3000

# Visit http://localhost:3000 for:
# • Real-time analytics
# • Cost visualization  
# • Model efficiency comparison
# • Budget monitoring
# • API endpoints explorer
```

---

## 💻 CLI Commands Reference

### **Token Analytics**

#### `tokens report [days]`
Generate comprehensive token usage report.

```bash
npx ts-node src/cli.ts tokens report 30
```

**Output:**
- Total evaluations, tokens, and costs
- Model efficiency rankings
- Cost breakdown by evaluation
- AI recommendations for optimization

#### `tokens trends <eval_name> [days]`
Show token usage trends for a specific evaluation.

```bash
npx ts-node src/cli.ts tokens trends math-basic 7
```

**Output:**
- Daily token usage patterns
- Cost trends over time
- Trend direction analysis
- Performance metrics

#### `tokens efficiency [models...] --eval <eval_name> --days <days>`
Compare token efficiency between models.

```bash
npx ts-node src/cli.ts tokens efficiency gpt-3.5-turbo gpt-4 ollama/llama2 --eval math-basic --days 30
```

**Output:**
- Efficiency ranking (cost per correct answer)
- Token usage comparison
- Total cost analysis
- Performance metrics

### **Cost Analysis**

#### `costs breakdown [days]`
Show cost breakdown by evaluation type.

```bash
npx ts-node src/cli.ts costs breakdown 30
```

**Output:**
- Total costs and evaluation counts
- Cost percentage by evaluation
- Trend analysis (increasing/decreasing/stable)
- Models used per evaluation

#### `costs predict <model> <eval_name> <sample_count> --days <days>`
Predict costs for future evaluations.

```bash
npx ts-node src/cli.ts costs predict gpt-4 math-basic 500 --days 7
```

**Output:**
- Predicted cost with confidence intervals
- Cost per sample estimation
- Token usage prediction
- Budget recommendations

#### `costs estimate <model> <sample_count> --input-length <chars> --output-length <chars>`
Quick cost estimation without historical data.

```bash
npx ts-node src/cli.ts costs estimate gpt-3.5-turbo 100 --input-length 500 --output-length 200
```

**Output:**
- Estimated total cost
- Cost per sample
- Token usage estimation
- Budget suggestions

#### `costs budget <eval_name> [amount]`
Set or check evaluation budget.

```bash
# Set budget
npx ts-node src/cli.ts costs budget math-basic 50.00

# Check budget status  
npx ts-node src/cli.ts costs budget math-basic
```

**Output:**
- Current budget status
- Spending percentage
- Remaining budget
- Alert status (if applicable)

### **Web Dashboard**

#### `dashboard [port]`
Start interactive web analytics dashboard.

```bash
npx ts-node src/cli.ts dashboard 3000
```

**Features:**
- Real-time analytics dashboard
- Interactive data visualization
- Model efficiency comparison
- Cost trend analysis
- API endpoints explorer
- Auto-refresh every 30 seconds

---

## 🌐 Web Dashboard Features

### **Main Dashboard**
- **Summary metrics**: Total evaluations, tokens, costs
- **Model rankings**: Efficiency-based model comparison
- **AI recommendations**: Automated cost optimization suggestions
- **System status**: Health monitoring and service status

### **Interactive Features**
- **Period toggle**: Switch between 7, 30, and 90-day views
- **Real-time refresh**: Auto-updates every 30 seconds
- **API explorer**: Browse all available endpoints
- **Responsive design**: Works on desktop and mobile

### **Visual Components**
- **Cost trend charts**: Historical cost analysis
- **Model efficiency rankings**: Visual performance comparison  
- **Budget status indicators**: Color-coded budget health
- **Recommendation cards**: AI-powered optimization tips

---

## 🔌 API Endpoints

### **Token Analytics**
```http
GET /api/analytics/tokens?days=30
GET /api/analytics/tokens/trends?eval_name=math-basic&days=30  
GET /api/analytics/tokens/efficiency?models=gpt-4,gpt-3.5-turbo&days=30
```

### **Cost Analysis**
```http
GET /api/analytics/costs/breakdown?days=30
GET /api/analytics/costs/predict?model=gpt-4&eval_name=math-basic&sample_count=100&days=7
GET /api/costs/estimate?model=gpt-3.5-turbo&sample_count=50&avg_input_length=500
```

### **Budget Management**
```http
POST /api/budget/:evalName
     Body: { "budget": 25.00 }
GET  /api/budget/:evalName/status
```

### **Dashboard Data**
```http
GET /api/dashboard?days=7
GET /api/health
```

---

## 📊 Understanding Metrics

### **Token Usage Metrics**

| Metric | Description | Usage |
|--------|-------------|-------|
| **Total Tokens** | Combined prompt + completion tokens | Overall usage tracking |
| **Avg Tokens/Sample** | Average tokens per evaluation question | Efficiency comparison |
| **Token Range** | Min to max tokens per sample | Variability analysis |
| **Prompt vs Completion** | Input vs output token breakdown | Cost optimization |

### **Cost Metrics**

| Metric | Description | Usage |
|--------|-------------|-------|
| **Cost per Sample** | Average cost per evaluation question | Budget planning |
| **Cost per Correct Answer** | Cost divided by successful evaluations | Efficiency scoring |
| **Cost Trend** | Increasing/decreasing/stable | Budget forecasting |
| **Efficiency Score** | Cost per correct answer ranking | Model selection |

### **Budget Health Indicators**

| Status | Percentage | Description | Action |
|--------|------------|-------------|---------|
| **🟢 Healthy** | 0-75% | Normal usage | Continue monitoring |
| **🟡 Warning** | 75-90% | Approaching limit | Review usage |
| **🟠 Limit Reached** | 90-100% | Near budget limit | Consider optimization |
| **🔴 Exceeded** | >100% | Budget exceeded | Immediate action needed |

---

## 🛠️ Advanced Configuration

### **Custom Cost Tracking**

```typescript
// Add custom model pricing
import { CostManager } from './src/cost-tracking/cost-manager';

const costManager = new CostManager();
costManager.addCostConfig({
  provider: 'custom-ai',
  model: 'custom-model-v1',
  input_cost_per_1k_tokens: 0.002,
  output_cost_per_1k_tokens: 0.004
});
```

### **Budget Automation**

```typescript
// Set budgets programmatically
costManager.setBudget('safety_evaluations', 100.00);
costManager.setBudget('performance_tests', 50.00);

// Check budget status
const alert = costManager.checkBudgetStatus('safety_evaluations');
if (alert?.type === 'exceeded') {
  console.log('🚨 Budget exceeded!', alert.message);
}
```

### **Custom Analytics**

```typescript
// Generate custom analytics reports
import { TokenAnalyticsService } from './src/analytics/token-analytics';

const analytics = new TokenAnalyticsService();
const report = await analytics.generateAnalyticsReport(30);

console.log('Total cost:', report.summary.total_cost);
console.log('Recommendations:', report.recommendations);
```

---

## 💡 Best Practices

### **Cost Optimization**

1. **Use dry-run mode** for testing configurations:
   ```bash
   npx ts-node src/cli.ts gpt-4 math-basic --dry-run --max-samples 100
   ```

2. **Start with smaller models** for development:
   ```bash
   # Development phase
   npx ts-node src/cli.ts ollama/llama2 math-basic --max-samples 10  # Free
   
   # Production validation
   npx ts-node src/cli.ts gpt-4 math-basic --max-samples 100         # Paid
   ```

3. **Use cost prediction** before large evaluations:
   ```bash
   npx ts-node src/cli.ts costs predict gpt-4 math-basic 1000 --days 7
   ```

### **Budget Management**

1. **Set conservative budgets** initially:
   ```bash
   npx ts-node src/cli.ts costs budget math-basic 10.00  # Start small
   ```

2. **Monitor budget health** regularly:
   ```bash
   npx ts-node src/cli.ts costs budget math-basic  # Check status
   ```

3. **Use efficiency metrics** for model selection:
   ```bash
   npx ts-node src/cli.ts tokens efficiency --eval math-basic --days 30
   ```

### **Performance Monitoring**

1. **Track trends** over time:
   ```bash
   npx ts-node src/cli.ts tokens trends math-basic 30
   ```

2. **Compare models** statistically:
   ```bash
   npx ts-node src/cli.ts tokens efficiency gpt-3.5-turbo gpt-4 claude-3-sonnet
   ```

3. **Use the dashboard** for ongoing monitoring:
   ```bash
   npx ts-node src/cli.ts dashboard 3000
   ```

---

## 🔍 Troubleshooting

### **Common Issues**

**Q: Token usage not showing**
```bash
# Make sure you're using a supported model
npx ts-node src/cli.ts gpt-3.5-turbo math-basic --verbose

# Check that API responses include usage data
npx ts-node src/cli.ts list  # Verify model support
```

**Q: Cost calculations seem wrong**
```bash
# Verify model pricing configuration
npx ts-node src/cli.ts costs estimate gpt-3.5-turbo 1 --input-length 100 --output-length 50

# Update cost configurations if needed
```

**Q: Dashboard not loading data**
```bash
# Check that evaluations have been run
npx ts-node src/cli.ts gpt-3.5-turbo math-basic --max-samples 5

# Verify dashboard endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/dashboard
```

**Q: Budget alerts not working**
```bash
# Ensure budget is set
npx ts-node src/cli.ts costs budget math-basic 5.00

# Check budget status
npx ts-node src/cli.ts costs budget math-basic
```

### **Debug Information**

Enable verbose logging for debugging:

```bash
npx ts-node src/cli.ts gpt-3.5-turbo math-basic --verbose --max-samples 5
```

Check system health:

```bash
npx ts-node src/cli.ts dashboard 3000
# Visit http://localhost:3000/api/health
```

---

## 🚀 Next Steps

1. **Run your first tracked evaluation**:
   ```bash
   npx ts-node src/cli.ts gpt-3.5-turbo math-basic --max-samples 10
   ```

2. **Set up budgets** for your evaluations:
   ```bash
   npx ts-node src/cli.ts costs budget math-basic 25.00
   ```

3. **Start the dashboard** for ongoing monitoring:
   ```bash
   npx ts-node src/cli.ts dashboard 3000
   ```

4. **Compare models** to optimize costs:
   ```bash
   npx ts-node src/cli.ts tokens efficiency gpt-3.5-turbo gpt-4 ollama/llama2
   ```

For more advanced features, see:
- [FRAMEWORK_EXPLAINED.md](../FRAMEWORK_EXPLAINED.md) - Complete framework guide
- [README.md](../README.md) - Quick start and overview
- [GLOSSARY.md](../GLOSSARY.md) - Technical terminology

---

**Happy cost-optimized evaluating! 🎯💰**
