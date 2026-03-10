// 108项指标计算引擎（标准版：同步前端与后端逻辑）

export interface MetricValue {
    id: string
    value: number
}

// 计算单个指标分数 (0-100)
export function calculateScore(metric: any, value: number): number {
    if (value === undefined || value === null) return 0

    const numValue = parseFloat(String(value))
    if (isNaN(numValue)) return 0

    let score = 0

    switch (metric.formulaType) {
        case 'S型增长':
            score = Math.min(100, numValue * 6)
            break
        case '基础分+线性':
            if (metric.id === 'team_experience') score = Math.min(100, 30 + numValue * 4)
            else if (metric.id === 'team_stability') score = 20 + numValue * 8
            else if (metric.id === 'team_education') score = 30 + numValue * 7
            else if (metric.id === 'team_culture') score = 20 + numValue * 8
            else if (metric.id === 'ip_portfolio') score = Math.min(100, 20 + numValue * 6)
            else if (metric.id === 'rd_team_size') score = Math.min(100, 20 + numValue * 0.8)
            else if (metric.id === 'market_growth') score = Math.min(100, Math.max(0, 50 + numValue))
            else if (metric.id === 'customer_retention') score = Math.min(100, 20 + numValue * 0.9)
            else if (metric.id === 'sales_growth') score = Math.min(100, Math.max(0, 60 + numValue / 4))
            else if (metric.id === 'market_penetration') score = Math.min(100, 40 + numValue * 0.7)
            else if (metric.id === 'revenue_growth') score = Math.min(100, Math.max(0, 60 + numValue / 3))
            else if (metric.id === 'employee_productivity') score = Math.min(100, 20 + numValue * 0.1)
            else if (metric.id === 'product_pipeline') score = Math.min(100, 30 + numValue * 5)
            break
        case '加权线性':
            if (['ceo_background', 'cto_background'].includes(metric.id)) score = numValue * 12
            else if (['cmo_background', 'cfo_background'].includes(metric.id)) score = numValue * 11
            else if (['team_network', 'team_innovation', 'team_execution'].includes(metric.id)) score = numValue * 12
            else if (['product_maturity', 'tech_barriers', 'product_demand'].includes(metric.id)) score = numValue * 12
            else if (['tech_innovation', 'algorithm_advantage', 'product_differentiation'].includes(metric.id)) score = numValue * 13
            else if (['user_experience', 'product_quality'].includes(metric.id)) score = numValue * 11
            else if (metric.id === 'rd_budget') score = Math.min(100, numValue * 4)
            else if (metric.id === 'product_roadmap') score = numValue * 11
            else if (['tech_scalability', 'data_assets', 'tech_trend_alignment', 'product_patent'].includes(metric.id)) score = numValue * 12
            else if (metric.id === 'quality_certification') score = Math.min(100, numValue * 12)
            else if (metric.id === 'brand_awareness') score = numValue * 12
            else if (metric.id === 'channel_coverage') score = numValue * 11
            else if (['competitive_advantage', 'customer_satisfaction', 'market_position', 'pricing_power', 'barrier_to_entry'].includes(metric.id)) score = numValue * 13
            else if (metric.id === 'marketing_efficiency') score = numValue * 11
            else if (['funding_history', 'investor_quality', 'financial_control'].includes(metric.id)) score = numValue * 12
            else if (metric.id === 'valuation_multiple') score = numValue * 11
            else if (metric.id === 'audit_quality') score = numValue * 13
            else if (metric.id === 'process_standardization') score = numValue * 11
            else if (['supply_chain', 'quality_control', 'operational_risk'].includes(metric.id)) score = numValue * 12
            else if (['it_infrastructure', 'cost_control', 'scalability', 'compliance'].includes(metric.id)) score = numValue * 13
            else if (['vendor_management', 'crisis_management'].includes(metric.id)) score = numValue * 12
            else if (['strategy_clarity', 'corporate_governance', 'risk_management', 'innovation_culture', 'long_term_vision'].includes(metric.id)) score = numValue * 13
            else if (metric.id === 'business_model') score = numValue * 14
            else if (['succession_plan', 'csr', 'strategic_partnerships'].includes(metric.id)) score = numValue * 12
            else if (metric.id === 'esg_score') score = numValue * 13
            else if (['market_expansion', 'talent_attraction', 'adaptability'].includes(metric.id)) score = numValue * 13
            else if (['climate_impact', 'resource_efficiency', 'community_engagement', 'reputation_management'].includes(metric.id)) score = numValue * 12
            else if (metric.id === 'future_readiness') score = numValue * 14
            break
        case '标准线性':
            score = numValue * 10
            break
        case '基础分+对数':
            if (metric.id === 'market_size') score = Math.min(100, 30 + numValue / 100)
            break
        case '反向评分':
            if (metric.id === 'customer_acquisition') score = Math.max(0, 100 - numValue / 15)
            else if (metric.id === 'competitor_count') score = Math.max(0, 100 - numValue * 3)
            else if (metric.id === 'burn_rate') score = Math.max(0, 100 - numValue / 100)
            else if (metric.id === 'asset_liability_ratio') score = Math.max(0, 100 - numValue * 0.8)
            else if (metric.id === 'customer_acquisition_cost') score = Math.max(0, 100 - numValue * 3)
            else if (metric.id === 'logistics_capability') score = Math.max(0, 100 - numValue)
            break
        case '线性比例':
            if (metric.id === 'customer_lifetime_value') score = Math.min(100, numValue / 800)
            else if (metric.id === 'revenue') score = Math.min(100, numValue / 10000)
            else if (metric.id === 'revenue_per_employee') score = Math.min(100, numValue / 5)
            else if (metric.id === 'operational_efficiency') score = Math.min(100, numValue * 0.5)
            else if (['production_capacity', 'asset_utilization'].includes(metric.id)) score = Math.min(100, numValue * 0.9)
            else if (metric.id === 'sustainable_growth') score = Math.min(100, numValue)
            break
        case '中心化评分':
            if (metric.id === 'gross_margin') score = Math.max(0, Math.min(100, 50 + numValue / 2))
            else if (['net_margin', 'roe'].includes(metric.id)) score = Math.max(0, Math.min(100, 50 + numValue))
            else if (metric.id === 'profit_per_employee') score = Math.max(0, Math.min(100, 50 + numValue * 2))
            break
        default:
            if (metric.minValue !== undefined && metric.maxValue !== undefined) {
                const normalizedValue = Math.max(0, Math.min(1, (numValue - metric.minValue) / (metric.maxValue - metric.minValue)))
                score = Math.round(normalizedValue * 100)
            } else {
                score = Math.min(100, Math.max(0, numValue * 10))
            }
    }

    return Math.max(0, Math.min(100, Math.round(score)))
}

// 计算各大类得分
export function calculateCategoryResults(inputMetrics: any[]) {
    const categories = [
        { id: 'team', name: '团队能力' },
        { id: 'product', name: '产品技术' },
        { id: 'market', name: '市场竞争' },
        { id: 'finance', name: '财务状况' },
        { id: 'operations', name: '运营效率' },
        { id: 'strategy', name: '战略治理' },
        { id: 'sustainability', name: '可持续性' }
    ]

    return categories.map(cat => {
        const catMetrics = inputMetrics.filter(m => m.category === cat.id)
        let totalPoints = 0
        let totalWeight = 0

        catMetrics.forEach(m => {
            const score = calculateScore(m, m.value)
            const weightedPoints = (score * m.weight) / 100
            totalPoints += weightedPoints
            totalWeight += m.weight
        })

        // 歸一化到 100 分制以便展示
        // 公式: (實際加權得分 / 該類總權重) * 100
        const normalizedScore = totalWeight > 0 ? (totalPoints / totalWeight) * 100 : 0

        return {
            id: cat.id,
            name: cat.name,
            totalPoints: Math.round(normalizedScore), // 展示用
            actualPoints: totalPoints, // 計算總分用
            totalWeight
        }
    })
}

// 计算最终综合得分
export function calculateFinalResult(categoryResults: any[]) {
    const totalPoints = categoryResults.reduce((sum, cat) => sum + cat.actualPoints, 0)
    const finalScore = Math.min(100, Math.round(totalPoints))

    let scoreGrade = ''
    if (finalScore >= 80) scoreGrade = 'S (卓越)'
    else if (finalScore >= 70) scoreGrade = 'A (優質)'
    else if (finalScore >= 60) scoreGrade = 'B (良好)'
    else if (finalScore >= 50) scoreGrade = 'C (一般)'
    else scoreGrade = 'D (待改進)'

    let stageRecommendation = ''
    if (finalScore >= 80) stageRecommendation = '企業實力極強，建議積極對接頂端資本。'
    else if (finalScore >= 70) stageRecommendation = '企業基礎紮實，適合進行當前階段融資。'
    else if (finalScore >= 60) stageRecommendation = '企業具備潛力，但仍需優化部分核心環節。'
    else stageRecommendation = '企業存在明顯短板，建議調整策略後再行融資。'

    return {
        finalScore,
        scoreGrade,
        stageRecommendation
    }
}
