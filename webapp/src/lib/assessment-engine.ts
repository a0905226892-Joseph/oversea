import { metrics, Metric } from './metrics-data';

export interface AssessmentResult {
    totalScore: number;
    totalWeight: number;
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
 * 核心计分引擎 - 封装所有指标运算逻辑
 * 同步自 index_Sample.html 的计算逻辑
 */
export class AssessmentEngine {
    /**
     * 计算单个指标的得分 (完全对齐 index_Sample.html)
     */
    static calculateMetricScore(metric: Metric, value: number): number {
        let score = 0;
        const numValue = Number(value) || 0;

        try {
            switch (metric.formulaType) {
                case "S型增长":
                case "S型成長":
                    score = numValue * 6;
                    break;

                case "基础分+线性":
                case "基礎分+線性":
                    if (metric.id === "team_experience") {
                        score = 30 + numValue * 4;
                    } else if (metric.id === "team_stability" || metric.id === "team_culture") {
                        score = 20 + numValue * 8;
                    } else if (metric.id === "team_education") {
                        score = 30 + numValue * 7;
                    } else if (metric.id === "ip_portfolio") {
                        score = 20 + numValue * 6;
                    } else if (metric.id === "market_growth") {
                        score = 50 + numValue;
                    } else if (metric.id === "customer_retention") {
                        score = 20 + numValue * 0.9;
                    } else if (metric.id === "sales_growth") {
                        score = 60 + numValue / 4;
                    } else if (metric.id === "market_penetration") {
                        score = 40 + numValue * 0.7;
                    } else if (metric.id === "current_ratio") {
                        score = 50 + numValue * 10;
                    } else if (metric.id === "roi") {
                        score = 50 + numValue / 5;
                    } else if (metric.id === "revenue_growth") {
                        score = 60 + numValue / 3;
                    } else if (metric.id === "employee_productivity") {
                        score = 20 + numValue * 0.1;
                    } else if (metric.id === "product_pipeline") {
                        score = 30 + numValue * 5;
                    } else if (metric.id === "rd_team_size") {
                        score = 20 + numValue * 0.8;
                    }
                    break;

                case "加权线性":
                case "加權線性":
                    if (metric.id === "ceo_background" || metric.id === "cto_background" || metric.id === "team_network" ||
                        metric.id === "team_innovation" || metric.id === "team_execution" || metric.id === "product_maturity" ||
                        metric.id === "tech_barriers" || metric.id === "product_demand" || metric.id === "tech_scalability" ||
                        metric.id === "data_assets" || metric.id === "tech_trend_alignment" || metric.id === "product_patent") {
                        score = numValue * 12;
                    } else if (metric.id === "cmo_background" || metric.id === "cfo_background" || metric.id === "user_experience" ||
                        metric.id === "product_quality" || metric.id === "product_roadmap" || metric.id === "channel_coverage" ||
                        metric.id === "market_position") {
                        score = numValue * 11;
                    } else if (metric.id === "tech_innovation" || metric.id === "algorithm_advantage" || metric.id === "product_differentiation" ||
                        metric.id === "competitive_advantage" || metric.id === "customer_satisfaction" || metric.id === "pricing_power" ||
                        metric.id === "barrier_to_entry" || metric.id === "it_infrastructure" || metric.id === "cost_control" ||
                        metric.id === "scalability" || metric.id === "compliance" || metric.id === "strategy_clarity" ||
                        metric.id === "corporate_governance" || metric.id === "risk_management" || metric.id === "innovation_culture" ||
                        metric.id === "long_term_vision" || metric.id === "market_expansion" || metric.id === "talent_attraction" ||
                        metric.id === "adaptability") {
                        score = numValue * 13;
                    } else if (metric.id === "marketing_efficiency") {
                        score = numValue * 11;
                    } else if (metric.id === "funding_history" || metric.id === "investor_quality" || metric.id === "financial_control") {
                        score = numValue * 12;
                    } else if (metric.id === "valuation_multiple") {
                        score = numValue * 11;
                    } else if (metric.id === "audit_quality") {
                        score = numValue * 13;
                    } else if (metric.id === "process_standardization") {
                        score = numValue * 11;
                    } else if (metric.id === "supply_chain" || metric.id === "quality_control" || metric.id === "operational_risk") {
                        score = numValue * 12;
                    } else if (metric.id === "vendor_management" || metric.id === "crisis_management") {
                        score = numValue * 12;
                    } else if (metric.id === "business_model") {
                        score = numValue * 14;
                    } else if (metric.id === "succession_plan" || metric.id === "csr" || metric.id === "strategic_partnerships" ||
                        metric.id === "climate_impact" || metric.id === "resource_efficiency" || metric.id === "community_engagement" ||
                        metric.id === "reputation_management") {
                        score = numValue * 12;
                    } else if (metric.id === "esg_score") {
                        score = numValue * 13;
                    } else if (metric.id === "future_readiness") {
                        score = numValue * 14;
                    } else if (metric.id === "cash_runway") {
                        score = numValue * 3;
                    } else if (metric.id === "market_share") {
                        score = numValue * 1.5;
                    } else if (metric.id === "rd_budget") {
                        score = numValue * 4;
                    } else if (metric.id === "quality_certification") {
                        score = numValue * 12;
                    } else {
                        score = numValue * 10;
                    }
                    break;

                case "标准线性":
                case "標準線性":
                    score = numValue * 10;
                    break;

                case "基础分+对数":
                case "基礎分+對數":
                    if (metric.id === "market_size") {
                        score = 30 + numValue / 100;
                    }
                    break;

                case "反向评分":
                case "反向評分":
                    if (metric.id === "customer_acquisition") {
                        score = 100 - numValue / 15;
                    } else if (metric.id === "competitor_count") {
                        score = 100 - numValue * 3;
                    } else if (metric.id === "burn_rate") {
                        score = 100 - numValue / 100;
                    } else if (metric.id === "asset_liability_ratio") {
                        score = 100 - numValue * 0.8;
                    } else if (metric.id === "customer_acquisition_cost") {
                        score = 100 - numValue * 3;
                    } else if (metric.id === "logistics_capability") {
                        score = 100 - numValue;
                    }
                    break;

                case "线性比例":
                case "線性比例":
                    if (metric.id === "customer_lifetime_value") {
                        score = numValue / 800;
                    } else if (metric.id === "revenue") {
                        score = numValue / 10000;
                    } else if (metric.id === "revenue_per_employee") {
                        score = numValue / 5;
                    } else if (metric.id === "operational_efficiency") {
                        score = numValue * 0.5;
                    } else if (metric.id === "production_capacity" || metric.id === "asset_utilization") {
                        score = numValue * 0.9;
                    } else if (metric.id === "sustainable_growth") {
                        score = numValue;
                    }
                    break;

                case "中心化评分":
                case "中心化評分":
                    if (metric.id === "gross_margin") {
                        score = 50 + numValue / 2;
                    } else if (metric.id === "net_margin" || metric.id === "roe") {
                        score = 50 + numValue;
                    } else if (metric.id === "profit_per_employee") {
                        score = 50 + numValue * 2;
                    }
                    break;

                default:
                    // 默认使用线性转换
                    if (metric.minValue !== undefined && metric.maxValue !== undefined) {
                        const normalizedValue = Math.max(0, Math.min(1,
                            (numValue - metric.minValue) / (metric.maxValue - metric.minValue)));
                        score = normalizedValue * 100;
                    } else {
                        score = numValue * 10;
                    }
                    break;
            }
        } catch (e) {
            console.error(`计算指标 ${metric.id} 分数失败:`, e);
            score = 0;
        }

        return Math.min(100, Math.max(0, Math.round(score)));
    }

    /**
     * 计算综合评分
     */
    static runFullAssessment(inputs: Record<string, number>): AssessmentResult {
        const categoryScores: Record<string, any> = {};
        const metricResults: Record<string, any> = {};
        let totalPoints = 0;
        let totalWeight = 0;

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
            totalWeight += metric.weight;
        });

        // 计算各维度的百分比得分
        Object.keys(categoryScores).forEach(catId => {
            const cat = categoryScores[catId];
            cat.score = Math.round((cat.points / cat.totalWeight) * 100);
        });

        const totalScore = Math.round(totalPoints);
        const grade = this.calculateGrade(totalScore);

        return {
            totalScore,
            totalWeight,
            grade,
            categoryScores,
            metricResults
        };
    }

    private static calculateGrade(score: number): string {
        if (score >= 80) return '🏆 卓越投资标的';
        if (score >= 70) return '⭐ 優質投資標的';
        if (score >= 60) return '👍 良好投資標的';
        if (score >= 50) return '⚠️ 一般投資標的';
        return '🚨 高風險投資標的';
    }
}
