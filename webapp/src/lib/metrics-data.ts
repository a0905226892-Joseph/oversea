export interface Metric {
    id: string
    name: string
    category: string
    weight: number
    description: string
    minValue: number
    maxValue: number
    unit: string
    formula: string
    formulaType: string
}

export interface CategoryConfig {
    id: string
    name: string
    description: string
    icon: string
    count: number
    totalWeight: number
    buttonIcon: string
}

export const categoriesConfig: CategoryConfig[] = [
    {
        id: "team",
        name: "团队能力与组织建设",
        description: "评估企业核心团队、高管能力、组织结构与文化",
        icon: "👥",
        count: 15,
        totalWeight: 15,
        buttonIcon: "👥"
    },
    {
        id: "product",
        name: "产品技术与创新研发",
        description: "评估产品成熟度、技术壁垒、研发投入与创新能力",
        icon: "🚀",
        count: 20,
        totalWeight: 20,
        buttonIcon: "🚀"
    },
    {
        id: "market",
        name: "市场竞争力与营销能力",
        description: "评估市场规模、市场份额、品牌营销与客户关系",
        icon: "📊",
        count: 20,
        totalWeight: 20,
        buttonIcon: "📊"
    },
    {
        id: "finance",
        name: "财务健康与资本结构",
        description: "评估营收利润、现金流、资本结构与投资回报",
        icon: "💰",
        count: 18,
        totalWeight: 15,
        buttonIcon: "💰"
    },
    {
        id: "operations",
        name: "运营效率与执行能力",
        description: "评估生产效率、成本控制、供应链与合规管理",
        icon: "⚙️",
        count: 15,
        totalWeight: 10,
        buttonIcon: "⚙️"
    },
    {
        id: "strategy",
        name: "战略规划与公司治理",
        description: "评估战略规划、治理结构、风险管理与ESG",
        icon: "🎯",
        count: 10,
        totalWeight: 10,
        buttonIcon: "🎯"
    },
    {
        id: "sustainability",
        name: "可持续发展与成长潜力",
        description: "评估增长潜力、人才吸引、环境适应与长期发展",
        icon: "🌱",
        count: 10,
        totalWeight: 10,
        buttonIcon: "🌱"
    }
];

export const metrics: Metric[] = [
    {
        id: "team_size", name: "核心团队人数", category: "team", weight: 1.03,
        description: "核心团队成员数量", minValue: 0, maxValue: 20, unit: "人",
        formula: "score = Math.min(100, value × 6)", formulaType: "S型增长"
    },
    {
        id: "team_experience", name: "团队平均行业经验", category: "team", weight: 1.36,
        description: "核心团队平均行业从业年限", minValue: 0, maxValue: 20, unit: "年",
        formula: "score = Math.min(100, 30 + value × 4)", formulaType: "基础分+线性"
    },
    {
        id: "ceo_background", name: "CEO背景评分", category: "team", weight: 1.7,
        description: "CEO的教育背景、工作经历和领导能力", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "cto_background", name: "CTO/技术负责人评分", category: "team", weight: 1.36,
        description: "技术负责人的技术背景和管理能力", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "cmo_background", name: "CMO/市场负责人评分", category: "team", weight: 1.03,
        description: "市场负责人的市场经验和营销能力", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 11", formulaType: "加权线性"
    },
    {
        id: "cfo_background", name: "CFO/财务负责人评分", category: "team", weight: 1.03,
        description: "财务负责人的财务专业能力和经验", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 11", formulaType: "加权线性"
    },
    {
        id: "team_stability", name: "核心团队稳定性", category: "team", weight: 1.03,
        description: "核心团队成员的留存率和稳定性", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = 20 + value × 8", formulaType: "基础分+线性"
    },
    {
        id: "team_complementarity", name: "团队成员互补性", category: "team", weight: 0.68,
        description: "团队成员技能和背景的互补程度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 10", formulaType: "标准线性"
    },
    {
        id: "advisor_quality", name: "合作方质量", category: "team", weight: 0.68,
        description: "外部顾问和合作伙伴的质量", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 10", formulaType: "标准线性"
    },
    {
        id: "board_quality", name: "董事会质量", category: "team", weight: 0.68,
        description: "董事会成员的资历和参与度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 10", formulaType: "标准线性"
    },
    {
        id: "team_education", name: "团队教育背景", category: "team", weight: 0.54,
        description: "团队成员的教育背景水平", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = 30 + value × 7", formulaType: "基础分+线性"
    },
    {
        id: "team_network", name: "团队行业人脉资源", category: "team", weight: 0.82,
        description: "团队的行业关系和资源网络", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "team_culture", name: "团队文化与价值观", category: "team", weight: 0.68,
        description: "团队文化和价值观的契合度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = 20 + value × 8", formulaType: "基础分+线性"
    },
    {
        id: "team_innovation", name: "团队创新能力", category: "team", weight: 1.03,
        description: "团队的创新思维和执行能力", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "team_execution", name: "团队执行力", category: "team", weight: 1.35,
        description: "团队的计划执行和交付能力", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "product_maturity", name: "产品成熟度", category: "product", weight: 1.56,
        description: "产品的开发完成度和稳定性", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "tech_innovation", name: "技术创新性", category: "product", weight: 1.56,
        description: "技术的创新程度和先进性", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 13", formulaType: "加权线性"
    },
    {
        id: "tech_barriers", name: "技术壁垒高度", category: "product", weight: 1.24,
        description: "技术壁垒的建立和保护程度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "ip_portfolio", name: "知识产权数量", category: "product", weight: 1.24,
        description: "拥有的专利、商标等知识产权数量", minValue: 0, maxValue: 50, unit: "项",
        formula: "score = Math.min(100, 20 + value × 6)", formulaType: "基础分+线性"
    },
    {
        id: "product_demand", name: "产品市场需求强度", category: "product", weight: 1.56,
        description: "市场对产品的需求强烈程度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "user_experience", name: "用户体验评分", category: "product", weight: 0.94,
        description: "用户对产品体验的满意度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 11", formulaType: "加权线性"
    },
    {
        id: "product_quality", name: "产品质量稳定性", category: "product", weight: 0.94,
        description: "产品质量的稳定性和可靠性", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 11", formulaType: "加权线性"
    },
    {
        id: "development_speed", name: "产品开发迭代速度", category: "product", weight: 0.63,
        description: "产品开发和迭代的快速响应能力", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 10", formulaType: "标准线性"
    },
    {
        id: "rd_budget", name: "研发投入占比", category: "product", weight: 0.94,
        description: "研发投入占总营收的比例", minValue: 0, maxValue: 50, unit: "%",
        formula: "score = Math.min(100, value × 4)", formulaType: "加权线性"
    },
    {
        id: "rd_team_size", name: "研发团队规模", category: "product", weight: 0.63,
        description: "研发团队成员数量", minValue: 0, maxValue: 100, unit: "人",
        formula: "score = Math.min(100, 20 + value × 0.8)", formulaType: "基础分+线性"
    },
    {
        id: "product_roadmap", name: "产品路线图清晰度", category: "product", weight: 0.63,
        description: "产品发展规划的明确程度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 11", formulaType: "加权线性"
    },
    {
        id: "tech_scalability", name: "技术可扩展性", category: "product", weight: 0.94,
        description: "技术架构的扩展能力", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "data_assets", name: "数据资产价值", category: "product", weight: 0.94,
        description: "数据资产的积累和价值", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "algorithm_advantage", name: "算法优势", category: "product", weight: 1.24,
        description: "核心算法的先进性和优势", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 13", formulaType: "加权线性"
    },
    {
        id: "platform_ecosystem", name: "平台生态系统建设", category: "product", weight: 0.94,
        description: "平台生态系统的完整程度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 10", formulaType: "标准线性"
    },
    {
        id: "product_differentiation", name: "产品差异化程度", category: "product", weight: 1.24,
        description: "产品与竞品的差异化优势", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 13", formulaType: "加权线性"
    },
    {
        id: "integration_capability", name: "系统集成能力", category: "product", weight: 0.63,
        description: "与其他系统集成的能力", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 10", formulaType: "标准线性"
    },
    {
        id: "tech_trend_alignment", name: "技术趋势契合度", category: "product", weight: 0.94,
        description: "技术与行业发展趋势的契合程度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "product_patent", name: "产品专利保护", category: "product", weight: 0.94,
        description: "产品相关专利的保护程度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "quality_certification", name: "质量认证数量", category: "product", weight: 0.32,
        description: "获得的质量管理体系认证数量", minValue: 0, maxValue: 10, unit: "项",
        formula: "score = Math.min(100, value × 12)", formulaType: "加权线性"
    },
    {
        id: "market_size", name: "目标市场规模", category: "market", weight: 1.51,
        description: "目标市场的总规模", minValue: 0, maxValue: 10000, unit: "亿元",
        formula: "score = Math.min(100, 30 + value/100)", formulaType: "基础分+对数"
    },
    {
        id: "market_growth", name: "市场年增长率", category: "market", weight: 1.21,
        description: "目标市场的年增长率", minValue: -20, maxValue: 100, unit: "%",
        formula: "score = Math.min(100, Math.max(0, 50 + value))", formulaType: "基础分+线性"
    },
    {
        id: "market_share", name: "当前市场份额", category: "market", weight: 1.51,
        description: "在当前市场中的占有率", minValue: 0, maxValue: 100, unit: "%",
        formula: "score = Math.min(100, value × 1.5)", formulaType: "加权线性"
    },
    {
        id: "customer_acquisition", name: "获客成本", category: "market", weight: 0.91,
        description: "获取单个客户的成本", minValue: 0, maxValue: 1000, unit: "元",
        formula: "score = Math.max(0, 100 - value/15)", formulaType: "反向评分"
    },
    {
        id: "customer_retention", name: "客户留存率", category: "market", weight: 1.21,
        description: "客户的年度留存比例", minValue: 0, maxValue: 100, unit: "%",
        formula: "score = Math.min(100, 20 + value × 0.9)", formulaType: "基础分+线性"
    },
    {
        id: "brand_awareness", name: "品牌知名度", category: "market", weight: 0.91,
        description: "品牌在目标市场的认知度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "sales_growth", name: "销售收入增长率", category: "market", weight: 1.21,
        description: "销售收入的年增长率", minValue: -50, maxValue: 500, unit: "%",
        formula: "score = Math.min(100, Math.max(0, 60 + value/4))", formulaType: "基础分+线性"
    },
    {
        id: "channel_coverage", name: "渠道覆盖率", category: "market", weight: 0.91,
        description: "销售渠道的覆盖范围", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 11", formulaType: "加权线性"
    },
    {
        id: "competition_intensity", name: "市场竞争强度", category: "market", weight: 0.91,
        description: "市场竞争的激烈程度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 10", formulaType: "标准线性"
    },
    {
        id: "competitive_advantage", name: "竞争优势可持续性", category: "market", weight: 1.21,
        description: "竞争优势的持续保持能力", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 13", formulaType: "加权线性"
    },
    {
        id: "overseas_expansion", name: "海外扩张潜力", category: "market", weight: 0.91,
        description: "向海外市场扩张的潜力", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 10", formulaType: "标准线性"
    },
    {
        id: "customer_satisfaction", name: "客户满意度", category: "market", weight: 0.91,
        description: "客户对产品和服务的满意度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 13", formulaType: "加权线性"
    },
    {
        id: "customer_lifetime_value", name: "客户生命周期价值", category: "market", weight: 1.21,
        description: "单个客户在整个生命周期内贡献的价值", minValue: 0, maxValue: 100000, unit: "元",
        formula: "score = Math.min(100, value/800)", formulaType: "线性比例"
    },
    {
        id: "market_position", name: "市场定位清晰度", category: "market", weight: 0.61,
        description: "市场定位的明确程度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "pricing_power", name: "产品定价权", category: "market", weight: 0.91,
        description: "产品定价的能力和空间", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 13", formulaType: "加权线性"
    },
    {
        id: "distribution_network", name: "分销网络强度", category: "market", weight: 0.61,
        description: "分销网络的覆盖和质量", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 10", formulaType: "标准线性"
    },
    {
        id: "marketing_efficiency", name: "营销效率", category: "market", weight: 0.61,
        description: "营销投入的产出效率", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 11", formulaType: "加权线性"
    },
    {
        id: "market_penetration", name: "市场渗透率", category: "market", weight: 0.91,
        description: "产品在目标市场的渗透程度", minValue: 0, maxValue: 100, unit: "%",
        formula: "score = Math.min(100, 40 + value × 0.7)", formulaType: "基础分+线性"
    },
    {
        id: "competitor_count", name: "主要竞争对手数量", category: "market", weight: 0.61,
        description: "主要竞争对手的数量", minValue: 0, maxValue: 20, unit: "家",
        formula: "score = Math.max(0, 100 - value × 3)", formulaType: "反向评分"
    },
    {
        id: "barrier_to_entry", name: "新进入者壁垒", category: "market", weight: 1.21,
        description: "阻止新竞争者进入的壁垒高度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 13", formulaType: "加权线性"
    },
    {
        id: "revenue", name: "年营收", category: "finance", weight: 1.31,
        description: "年度总营业收入", minValue: 0, maxValue: 1000000, unit: "万元",
        formula: "score = Math.min(100, value/10000)", formulaType: "线性比例"
    },
    {
        id: "revenue_growth", name: "营收增长率", category: "finance", weight: 1.31,
        description: "年度营收增长率", minValue: -100, maxValue: 500, unit: "%",
        formula: "score = Math.min(100, Math.max(0, 60 + value/3))", formulaType: "基础分+线性"
    },
    {
        id: "gross_margin", name: "毛利率", category: "finance", weight: 1.05,
        description: "毛利润占营收的比例", minValue: -100, maxValue: 100, unit: "%",
        formula: "score = Math.max(0, Math.min(100, 50 + value/2))", formulaType: "中心化评分"
    },
    {
        id: "net_margin", name: "净利率", category: "finance", weight: 1.05,
        description: "净利润占营收的比例", minValue: -100, maxValue: 100, unit: "%",
        formula: "score = Math.max(0, Math.min(100, 50 + value))", formulaType: "中心化评分"
    },
    {
        id: "burn_rate", name: "月现金流消耗", category: "finance", weight: 1.05,
        description: "每月现金净流出", minValue: 0, maxValue: 10000, unit: "万元",
        formula: "score = Math.max(0, 100 - value/100)", formulaType: "反向评分"
    },
    {
        id: "cash_runway", name: "现金跑道", category: "finance", weight: 1.31,
        description: "现有现金可维持的运营时间", minValue: 0, maxValue: 36, unit: "月",
        formula: "score = Math.min(100, value × 3)", formulaType: "加权线性"
    },
    {
        id: "asset_liability_ratio", name: "资产负债率", category: "finance", weight: 0.79,
        description: "负债占总资产的比例", minValue: 0, maxValue: 100, unit: "%",
        formula: "score = Math.max(0, 100 - value × 0.8)", formulaType: "反向评分"
    },
    {
        id: "current_ratio", name: "流动比率", category: "finance", weight: 0.53,
        description: "流动资产与流动负债的比率", minValue: 0, maxValue: 5, unit: "倍",
        formula: "score = Math.min(100, 50 + value × 10)", formulaType: "基础分+线性"
    },
    {
        id: "roi", name: "投资回报率", category: "finance", weight: 1.05,
        description: "投资收益率", minValue: -100, maxValue: 1000, unit: "%",
        formula: "score = Math.min(100, Math.max(0, 50 + value/5))", formulaType: "基础分+线性"
    },
    {
        id: "roe", name: "净资产收益率", category: "finance", weight: 0.79,
        description: "净利润与净资产的比率", minValue: -100, maxValue: 100, unit: "%",
        formula: "score = Math.max(0, Math.min(100, 50 + value))", formulaType: "中心化评分"
    },
    {
        id: "customer_acquisition_cost", name: "客户获取成本回收期", category: "finance", weight: 0.79,
        description: "回收客户获取成本所需时间", minValue: 0, maxValue: 36, unit: "月",
        formula: "score = Math.max(0, 100 - value × 3)", formulaType: "反向评分"
    },
    {
        id: "revenue_per_employee", name: "人均营收", category: "finance", weight: 0.53,
        description: "平均每个员工创造的营收", minValue: 0, maxValue: 500, unit: "万元",
        formula: "score = Math.min(100, value/5)", formulaType: "线性比例"
    },
    {
        id: "profit_per_employee", name: "人均利润", category: "finance", weight: 0.53,
        description: "平均每个员工创造的利润", minValue: -100, maxValue: 100, unit: "万元",
        formula: "score = Math.max(0, Math.min(100, 50 + value × 2))", formulaType: "中心化评分"
    },
    {
        id: "funding_history", name: "融资历史评分", category: "finance", weight: 0.79,
        description: "历史融资表现评分", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "investor_quality", name: "现有投资人质量", category: "finance", weight: 0.53,
        description: "现有投资人的声誉和资源", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "valuation_multiple", name: "估值倍数合理性", category: "finance", weight: 0.79,
        description: "企业估值倍数的合理程度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 11", formulaType: "加权线性"
    },
    {
        id: "financial_control", name: "财务控制体系", category: "finance", weight: 0.53,
        description: "财务管理和控制体系的完善程度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "audit_quality", name: "审计质量", category: "finance", weight: 0.27,
        description: "审计报告的准确性和可靠性", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 13", formulaType: "加权线性"
    },
    {
        id: "operational_efficiency", name: "人均产值", category: "operations", weight: 0.86,
        description: "平均每个员工创造的产值", minValue: 0, maxValue: 200, unit: "万元",
        formula: "score = Math.min(100, value × 0.5)", formulaType: "线性比例"
    },
    {
        id: "process_standardization", name: "流程标准化程度", category: "operations", weight: 0.57,
        description: "业务流程的标准化水平", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 11", formulaType: "加权线性"
    },
    {
        id: "supply_chain", name: "供应链稳定性", category: "operations", weight: 0.86,
        description: "供应链的稳定性和可靠性", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "production_capacity", name: "生产能力利用率", category: "operations", weight: 0.57,
        description: "生产能力的利用效率", minValue: 0, maxValue: 100, unit: "%",
        formula: "score = Math.min(100, value × 0.9)", formulaType: "线性比例"
    },
    {
        id: "quality_control", name: "质量控制体系", category: "operations", weight: 0.57,
        description: "质量管理体系的完善程度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "employee_productivity", name: "缴纳社保人数", category: "operations", weight: 0.57,
        description: "正式缴纳社保的员工人数", minValue: 0, maxValue: 1000, unit: "人",
        formula: "score = Math.min(100, 20 + value × 0.1)", formulaType: "基础分+线性"
    },
    {
        id: "it_infrastructure", name: "AI使用能力", category: "operations", weight: 0.57,
        description: "AI技术应用的能力和水平", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 13", formulaType: "加权线性"
    },
    {
        id: "operational_risk", name: "运营风险控制", category: "operations", weight: 0.86,
        description: "运营风险的管理和控制能力", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "cost_control", name: "成本控制能力", category: "operations", weight: 0.86,
        description: "成本管理和控制的能力", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 13", formulaType: "加权线性"
    },
    {
        id: "asset_utilization", name: "资产利用率", category: "operations", weight: 0.57,
        description: "固定资产的利用效率", minValue: 0, maxValue: 100, unit: "%",
        formula: "score = Math.min(100, value × 0.9)", formulaType: "线性比例"
    },
    {
        id: "vendor_management", name: "供应商管理", category: "operations", weight: 0.29,
        description: "供应商管理的能力 and 水平", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "logistics_capability", name: "物流成本", category: "operations", weight: 0.57,
        description: "单位物流成本控制", minValue: 0, maxValue: 100, unit: "元/单",
        formula: "score = Math.max(0, 100 - value)", formulaType: "反向评分"
    },
    {
        id: "scalability", name: "业务可扩展性", category: "operations", weight: 0.86,
        description: "业务规模扩展的能力", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 13", formulaType: "加权线性"
    },
    {
        id: "crisis_management", name: "危机管理能力", category: "operations", weight: 0.57,
        description: "应对危机事件的能力", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "compliance", name: "合规性管理", category: "operations", weight: 0.85,
        description: "合规管理的完善程度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 13", formulaType: "加权线性"
    },
    {
        id: "strategy_clarity", name: "战略清晰度", category: "strategy", weight: 1.42,
        description: "企业战略的明确程度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 13", formulaType: "加权线性"
    },
    {
        id: "business_model", name: "商业模式成熟度", category: "strategy", weight: 1.78,
        description: "商业模式的成熟和完善程度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 14", formulaType: "加权线性"
    },
    {
        id: "corporate_governance", name: "公司治理结构", category: "strategy", weight: 1.07,
        description: "公司治理结构的完善程度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 13", formulaType: "加权线性"
    },
    {
        id: "risk_management", name: "风险管理体系", category: "strategy", weight: 1.07,
        description: "风险管理体系的完善程度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 13", formulaType: "加权线性"
    },
    {
        id: "succession_plan", name: "人员替换风险控制能力", category: "strategy", weight: 0.72,
        description: "关键人员替换风险的应对能力", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "csr", name: "企业社会责任", category: "strategy", weight: 0.36,
        description: "企业社会责任的履行情况", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "esg_score", name: "ESG评分", category: "strategy", weight: 0.72,
        description: "环境、社会和治理绩效评分", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 13", formulaType: "加权线性"
    },
    {
        id: "innovation_culture", name: "创新文化", category: "strategy", weight: 1.07,
        description: "企业创新文化的建设程度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 13", formulaType: "加权线性"
    },
    {
        id: "strategic_partnerships", name: "战略合作伙伴", category: "strategy", weight: 0.72,
        description: "战略合作伙伴的质量和数量", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "long_term_vision", name: "长期愿景", category: "strategy", weight: 1.07,
        description: "企业长期发展规划的清晰度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 13", formulaType: "加权线性"
    },
    {
        id: "sustainable_growth", name: "可持续增长率", category: "sustainability", weight: 1.53,
        description: "企业可持续的内在增长率", minValue: 0, maxValue: 100, unit: "%",
        formula: "score = Math.min(100, value)", formulaType: "线性比例"
    },
    {
        id: "market_expansion", name: "市场扩张能力", category: "sustainability", weight: 1.16,
        description: "向新市场扩张的能力", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 13", formulaType: "加权线性"
    },
    {
        id: "product_pipeline", name: "产品储备数量", category: "sustainability", weight: 1.16,
        description: "在研和储备产品数量", minValue: 0, maxValue: 20, unit: "个",
        formula: "score = Math.min(100, 30 + value × 5)", formulaType: "基础分+线性"
    },
    {
        id: "talent_attraction", name: "人才吸引力", category: "sustainability", weight: 1.16,
        description: "吸引优秀人才的能力", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 13", formulaType: "加权线性"
    },
    {
        id: "climate_impact", name: "政策符合程度", category: "sustainability", weight: 0.77,
        description: "符合产业政策的程度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "resource_efficiency", name: "资源使用效率", category: "sustainability", weight: 0.77,
        description: "资源利用的效率", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "community_engagement", name: "对社会贡献度", category: "sustainability", weight: 0.39,
        description: "对社区和社会的贡献程度", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "adaptability", name: "环境适应能力", category: "sustainability", weight: 1.16,
        description: "适应环境变化的能力", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 13", formulaType: "加权线性"
    },
    {
        id: "reputation_management", name: "同业竞争管理能力", category: "sustainability", weight: 0.77,
        description: "管理同业竞争关系的能力", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 12", formulaType: "加权线性"
    },
    {
        id: "future_readiness", name: "产品、技术迭代能力", category: "sustainability", weight: 1.13,
        description: "产品和技术的持续迭代能力", minValue: 0, maxValue: 10, unit: "分",
        formula: "score = value × 14", formulaType: "加权线性"
    }
];
