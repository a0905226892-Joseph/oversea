import { NextRequest, NextResponse } from 'next/server'

// 三个免费示例数据
const DEMO_DATA = [
    {
        id: '1',
        name: '科技独角兽示例',
        description: '专注于AI+SaaS平台的科技企业，处于A轮融资阶段',
        icon: '🤖',
        companyInfo: {
            companyName: '算法科技（示例）',
            industry: 'tech',
            fundingStage: 'a',
            evaluationDate: '2026-01-15',
        },
        results: {
            finalScore: 82,
            scoreGrade: '卓越投资标的',
            stageRecommendation: '企业综合计分82分，表现优秀，适合进入A轮或更后期融资阶段',
            teamScore: 22, teamWeight: '25.0',
            productScore: 18, productWeight: '20.0',
            marketScore: 16, marketWeight: '20.0',
            financeScore: 11, financeWeight: '15.0',
            operationsScore: 7, operationsWeight: '10.0',
            strategyScore: 8, strategyWeight: '10.0',
            sustainabilityScore: 8, sustainabilityWeight: '10.0',
        },
        deepAnalysis: {
            pestel: [72, 80, 75, 90, 65, 70],
            fourP: [85, 78, 72, 80],
            vrio: [88, 82, 85, 76],
            strengths: [
                '顶级AI算法团队，拥有多项核心专利',
                '产品PMF明确，月活用户增长35%',
                '与头部客户建立深度战略合作',
                '技术壁垒高，竞争对手难以复制',
                '融资历史清晰，投资机构背景优质',
            ],
            weaknesses: [
                '国际化经验不足，海外市场开拓较慢',
                '销售体系尚不完善，依赖创始人资源',
                '现金流压力较大，需要尽快完成融资',
                '核心团队规模偏小，扩张压力大',
                '部分产品模块仍需打磨',
            ],
            opportunities: [
                'AI市场年增长率超过35%，赛道前景广阔',
                '政策大力支持AI产业发展',
                '企业数字化转型需求持续旺盛',
                '海外市场准入门槛降低',
                '上下游产业链整合机会显著',
            ],
            threats: [
                '大厂入局加剧竞争态势',
                '技术迭代速度快，存在被颠覆风险',
                '数据安全监管趋严',
                '高端AI人才争夺激烈',
                '宏观经济不确定性影响客户预算',
            ],
            pestelAnalysis: 'PESTEL分析显示，政策环境对AI产业整体友好，经济层面企业数字化预算持续增长，技术层面大模型快速迭代带来机遇与挑战并存。',
            fourPAnalysis: '4P策略上，产品差异化明显，定价策略合理，渠道以直销为主需拓展合作伙伴，推广需加强品牌声量建设。',
            vrioAnalysis: 'VRIO分析证实核心AI算法具备价值性和稀缺性，技术护城河预计可维持18-24个月，需持续加大研发投入。',
            investmentSummary: '该企业综合评分达到82分，属于卓越投资标的。团队能力突出，产品技术领先，市场份额稳步提升。建议本轮融资完成后重点加强销售体系和国际化布局。',
            keyFindings: '核心亮点：AI算法专利布局完整，B端客户留存率92%；主要风险：现金流压力需在6个月内通过融资缓解。',
            riskAssessment: '风险评估等级：低风险。主要风险集中在市场竞争加剧和人才招聘压力，商业模式和技术壁垒健康。',
            investmentRecommendation: '强烈推荐投资。团队、产品、市场三要素均表现优秀，建议积极参与本轮A轮融资，推荐占股5%-10%。',
        },
    },
    {
        id: '2',
        name: '智能制造示例',
        description: '工业机器人与智能产线解决方案提供商，Pre-B轮阶段',
        icon: '🏭',
        companyInfo: {
            companyName: '智造机器人（示例）',
            industry: 'robot',
            fundingStage: 'pre-b',
            evaluationDate: '2026-01-15',
        },
        results: {
            finalScore: 71,
            scoreGrade: '优质投资标的',
            stageRecommendation: '企业综合计分71分，表现良好，适合Pre-B轮融资',
            teamScore: 18, teamWeight: '25.0',
            productScore: 15, productWeight: '20.0',
            marketScore: 13, marketWeight: '20.0',
            financeScore: 10, financeWeight: '15.0',
            operationsScore: 7, operationsWeight: '10.0',
            strategyScore: 7, strategyWeight: '10.0',
            sustainabilityScore: 6, sustainabilityWeight: '10.0',
        },
        deepAnalysis: {
            pestel: [68, 72, 65, 78, 70, 65],
            fourP: [76, 70, 68, 65],
            vrio: [78, 70, 72, 68],
            strengths: ['核心工程师团队积累15年行业经验', '产品在头部制造企业经过验证', '供应链整合能力强', '订单转化率高达68%', '技术专利布局完整'],
            weaknesses: ['品牌知名度有限', '销售覆盖区域集中', '资金周转压力较大', '海外认证尚未完成', '产品线较为单一'],
            opportunities: ['智能制造政策补贴力度加大', '传统工厂升级改造需求旺盛', '东南亚制造业转移带来出海机会', '工业互联网平台整合机会', '政府采购订单增加'],
            threats: ['原材料价格波动风险', '大型自动化企业下沉竞争', '客户定制需求带来研发压力', '汇率风险影响出口利润', '核心工程师留存挑战'],
            pestelAnalysis: '政策层面"制造强国"战略持续推进，补贴政策助力企业研发；经济层面人工成本上升加速自动化替代需求；技术层面协作机器人技术快速成熟。',
            fourPAnalysis: '产品针对中型制造企业定制化能力强；定价相比进口品牌低30-40%，具备价格竞争力；渠道需加快全国代理商网络建设；推广应聚焦行业展会和案例营销。',
            vrioAnalysis: '核心制造工艺具备一定稀缺性，但行业内竞争对手在快速追赶，建议加快产品迭代速度以维持技术领先。',
            investmentSummary: '企业综合评分71分，属于优质投资标的。在智能制造领域积累深厚，产品经市场验证，主要成长瓶颈在于品牌和渠道建设。',
            keyFindings: '核心亮点：头部客户背书强，毛利率稳健；主要挑战：品牌建设滞后，区域覆盖不足。',
            riskAssessment: '风险评估等级：中等风险。原材料成本波动和大厂竞争是主要风险，但订单储备健康可缓解短期压力。',
            investmentRecommendation: '推荐投资，建议在完成尽调后参与本轮融资，重点关注海外市场拓展和品牌建设进展。',
        },
    },
    {
        id: '3',
        name: '消费品牌示例',
        description: '新消费品牌，专注于国潮健康食品，天使轮阶段',
        icon: '🛍️',
        companyInfo: {
            companyName: '国潮健康（示例）',
            industry: 'consumer',
            fundingStage: 'angel',
            evaluationDate: '2026-01-15',
        },
        results: {
            finalScore: 58,
            scoreGrade: '良好投资标的',
            stageRecommendation: '企业综合计分58分，处于成长早期，建议完善核心团队后考虑天使轮融资',
            teamScore: 14, teamWeight: '25.0',
            productScore: 11, productWeight: '20.0',
            marketScore: 12, marketWeight: '20.0',
            financeScore: 8, financeWeight: '15.0',
            operationsScore: 5, operationsWeight: '10.0',
            strategyScore: 5, strategyWeight: '10.0',
            sustainabilityScore: 6, sustainabilityWeight: '10.0',
        },
        deepAnalysis: {
            pestel: [60, 65, 72, 55, 62, 60],
            fourP: [72, 65, 60, 70],
            vrio: [65, 60, 55, 58],
            strengths: ['品牌定位差异化，国潮文化契合消费趋势', '创始人有消费品领域经验', '核心产品复购率较高', '社交媒体运营能力强', '供应链初步建立'],
            weaknesses: ['团队规模小，职能不完整', '产品线单薄，SKU有限', '线下渠道几乎空白', '品牌知名度仍处早期', '财务体系不完善'],
            opportunities: ['国潮消费持续升温', '健康食品赛道增速明显', '直播电商红利尚存', '私域流量运营机会大', '大卖场品牌联合营销机会'],
            threats: ['消费行业竞争极为激烈', '流量成本持续上升', '消费者品牌忠诚度低', '供应链稳定性风险', '食品安全监管要求高'],
            pestelAnalysis: '社会层面健康消费意识提升为产品背书；技术层面直播电商和私域流量工具成熟；法规层面食品安全要求趋严需提前布局认证。',
            fourPAnalysis: '产品定位清晰，围绕健康+国潮双标签；定价中高端符合目标客群；渠道以线上为主需择机开拓线下；推广依托KOL种草效果显著。',
            vrioAnalysis: '目前核心竞争力相对有限，品牌资产处于积累阶段，建议加快产品专利申请和品牌商标保护。',
            investmentSummary: '企业处于早期阶段，综合评分58分，团队和产品具备潜力，但商业模式成熟度和财务体系尚需完善，属于高风险高回报的早期标的。',
            keyFindings: '核心亮点：社媒运营强，复购率表现好；主要风险：团队不完整，渠道过于依赖单一平台。',
            riskAssessment: '风险评估等级：较高风险。早期品牌项目，建议投资者做好长周期准备，重点关注团队补充进展。',
            investmentRecommendation: '谨慎投资，适合有消费品行业经验的早期投资机构，建议小额进入并深度赋能，重点帮助团队补充运营和供应链人才。',
        },
    },
]

// GET /api/demo/:id
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const demo = DEMO_DATA.find(d => d.id === id)

    if (!demo) {
        return NextResponse.json({ error: '示例不存在' }, { status: 404 })
    }

    return NextResponse.json({ demo })
}
