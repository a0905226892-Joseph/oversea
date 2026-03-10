import { metrics, Metric } from './metrics-data';

export interface AssessmentResult {
    totalScore: number;
    grade: string;
    categoryScores: Record<string, {
        score: number;
        points: number;
        totalWeight: number;
    }>;
    metricResults: Record<string, {
        value: number;
        score: number;
        points: number;
    }>;
}

/**
 * 核心計分引擎 - 封裝所有指標運算邏輯
 */
export class AssessmentEngine {
    /**
     * 計算單個指標的得分 (基於 index.html 的公式)
     */
    static calculateMetricScore(metric: Metric, value: number): number {
        let score = 0;

        try {
            // 解析並執行公式 (注意：在真實環境中應考慮更安全的解析方式，這裡模擬 index.html 的邏輯)
            // 這裡直接根據 formulaType 使用硬編碼的對應邏輯，增加安全性
            switch (metric.formulaType) {
                case "S型成長":
                    // index.html: score = Math.min(100, value * 6)
                    score = Math.min(100, value * 6);
                    break;
                case "基礎分+線性":
                    // 根據不同的指標有不同的偏移量，從 metrics-data.ts 的 formula 字符串提取
                    if (metric.id === 'team_experience') score = 30 + value * 4;
                    else if (metric.id === 'team_stability') score = 20 + value * 8;
                    else if (metric.id === 'team_education') score = 30 + value * 7;
                    else if (metric.id === 'team_culture') score = 20 + value * 8;
                    else if (metric.id === 'ip_portfolio') score = 20 + value * 6;
                    else if (metric.id === 'rd_team_size') score = 20 + value * 0.8;
                    else if (metric.id === 'market_growth') score = 50 + value;
                    else if (metric.id === 'customer_retention') score = 20 + value * 0.9;
                    else if (metric.id === 'sales_growth') score = 60 + value / 4;
                    else if (metric.id === 'market_penetration') score = 40 + value * 0.7;
                    else if (metric.id === 'current_ratio') score = 50 + value * 10;
                    else if (metric.id === 'roi') score = 50 + value / 5;
                    else if (metric.id === 'revenue_growth') score = 60 + value / 3;
                    else if (metric.id === 'employee_productivity') score = 20 + value * 0.1;
                    else if (metric.id === 'product_pipeline') score = 30 + value * 5;
                    else score = value * 10; // Fallback
                    break;
                case "加權線性":
                    if (metric.id === 'ceo_background') score = value * 12;
                    else if (metric.id === 'cto_background') score = value * 12;
                    else if (metric.id === 'tech_innovation') score = value * 13;
                    else if (metric.id === 'algorithm_advantage') score = value * 13;
                    else if (metric.id === 'product_differentiation') score = value * 13;
                    else if (metric.id === 'customer_satisfaction') score = value * 13;
                    else if (metric.id === 'pricing_power') score = value * 13;
                    else if (metric.id === 'barrier_to_entry') score = value * 13;
                    else if (metric.id === 'audit_quality') score = value * 13;
                    else if (metric.id === 'it_infrastructure') score = value * 13;
                    else if (metric.id === 'cost_control') score = value * 13;
                    else if (metric.id === 'scalability') score = value * 13;
                    else if (metric.id === 'compliance') score = value * 13;
                    else if (metric.id === 'strategy_clarity') score = value * 13;
                    else if (metric.id === 'business_model') score = value * 14;
                    else if (metric.id === 'corporate_governance') score = value * 13;
                    else if (metric.id === 'risk_management') score = value * 13;
                    else if (metric.id === 'innovation_culture') score = value * 13;
                    else if (metric.id === 'long_term_vision') score = value * 13;
                    else if (metric.id === 'market_expansion') score = value * 13;
                    else if (metric.id === 'talent_attraction') score = value * 13;
                    else if (metric.id === 'adaptability') score = value * 13;
                    else if (metric.id === 'future_readiness') score = value * 14;
                    else if (metric.id === 'esg_score') score = value * 13;
                    else score = value * 11;
                    break;
                case "標準線性":
                    score = value * 10;
                    break;
                case "基礎分+對數":
                    // index.html: score = Math.min(100, 30 + value/100) -> 這裡邏輯可能有誤，但我們遵循 index.html
                    score = Math.min(100, 30 + value / 100);
                    break;
                case "反向評分":
                    if (metric.id === 'customer_acquisition') score = 100 - value / 15;
                    else if (metric.id === 'burn_rate') score = 100 - value / 100;
                    else if (metric.id === 'asset_liability_ratio') score = 100 - value * 0.8;
                    else if (metric.id === 'customer_acquisition_cost') score = 100 - value * 3;
                    else if (metric.id === 'competitor_count') score = 100 - value * 3;
                    else if (metric.id === 'logistics_capability') score = 100 - value;
                    else score = Math.max(0, 100 - value);
                    break;
                case "中心化評分":
                    if (metric.id === 'gross_margin') score = 50 + value / 2;
                    else if (metric.id === 'net_margin') score = 50 + value;
                    else if (metric.id === 'roe') score = 50 + value;
                    else if (metric.id === 'profit_per_employee') score = 50 + value * 2;
                    else score = 50 + value;
                    break;
                case "線性比例":
                    if (metric.id === 'customer_lifetime_value') score = value / 800;
                    else if (metric.id === 'revenue') score = value / 10000;
                    else if (metric.id === 'revenue_per_employee') score = value / 5;
                    else if (metric.id === 'operational_efficiency') score = value * 0.5;
                    else if (metric.id === 'production_capacity') score = value * 0.9;
                    else if (metric.id === 'asset_utilization') score = value * 0.9;
                    else if (metric.id === 'sustainable_growth') score = value;
                    else score = value;
                    break;
                default:
                    score = value * 10;
            }
        } catch (e) {
            console.error(`計算指標 ${metric.id} 分數失敗:`, e);
            score = 0;
        }

        return Math.min(100, Math.max(0, score));
    }

    /**
     * 計算綜合評分
     */
    static runFullAssessment(inputs: Record<string, number>): AssessmentResult {
        const categoryScores: Record<string, any> = {};
        const metricResults: Record<string, any> = {};
        let totalPoints = 0;

        metrics.forEach(metric => {
            const value = inputs[metric.id] || 0;
            const score = this.calculateMetricScore(metric, value);
            const points = (score * metric.weight) / 100;

            metricResults[metric.id] = { value, score, points };

            if (!categoryScores[metric.category]) {
                categoryScores[metric.category] = { score: 0, points: 0, totalWeight: 0 };
            }

            categoryScores[metric.category].points += points;
            categoryScores[metric.category].totalWeight += metric.weight;
            totalPoints += points;
        });

        // 計算各維度的百分比得分
        Object.keys(categoryScores).forEach(catId => {
            const cat = categoryScores[catId];
            cat.score = Math.round((cat.points / cat.totalWeight) * 100);
        });

        const totalScore = Math.round(totalPoints);
        const grade = this.calculateGrade(totalScore);

        return {
            totalScore,
            grade,
            categoryScores,
            metricResults
        };
    }

    private static calculateGrade(score: number): string {
        if (score >= 80) return '🏆 卓越投資標的';
        if (score >= 70) return '⭐ 優質投資標的';
        if (score >= 60) return '👍 良好投資標的';
        if (score >= 50) return '⚠️ 一般投資標的';
        return '🚨 高風險投資標的';
    }
}
