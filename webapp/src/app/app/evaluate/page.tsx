'use client'
import './evaluate.css'
import { useState, useEffect, useMemo, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { metrics, categoriesConfig, CategoryConfig, Metric } from '@/lib/metrics-data'
import mermaid from 'mermaid'
// 已移除客戶端計分引進，改用服務端 API

import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'

// 註冊 Chart.js 組件
ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
)

function EvaluateContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get('id')
    const reportRef = useRef<HTMLDivElement>(null)
    const [isReadOnly, setIsReadOnly] = useState(false)

    // --- 狀態管理 ---
    const [loading, setLoading] = useState(false)
    const [saveLoading, setSaveLoading] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [exportLoading, setExportLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [showDeepInfo, setShowDeepInfo] = useState(false)
    const [showAiSettings, setShowAiSettings] = useState(false)
    const [activeDemoModal, setActiveDemoModal] = useState(false)
    const [showComprehensiveModal, setShowComprehensiveModal] = useState(false)
    const [activeToolPanel, setActiveToolPanel] = useState<string | null>(null)

    // 深度數據狀態
    const [shareholders, setShareholders] = useState<any[]>([
        { name: '创始团队', percentage: 60, subscribed: 600, amount: 300, type: 'common' },
        { name: '天使投资人', percentage: 25, subscribed: 250, amount: 125, type: 'preferred' },
        { name: '员工持股平台', percentage: 15, subscribed: 150, amount: 75, type: 'lp' }
    ])
    const [products, setProducts] = useState<any[]>([
        { name: 'AI助理终端 V1', type: '硬件终端', model: 'ToC', price: 0.25, cost: 0.15, date: '2025-10-01' }
    ])
    const [aiConfig, setAiConfig] = useState({
        model: 'ai-lab-chat',
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: ''
    })
    const [mermaidScale, setMermaidScale] = useState(1)

    const [activeCategory, setActiveCategory] = useState<string>('team')
    const [companyInfo, setCompanyInfo] = useState({
        companyName: '',
        industry: 'tech',
        fundingStage: 'seed',
        evaluationDate: new Date().toISOString().split('T')[0]
    })

    const [deepData, setDeepData] = useState({
        registeredCapital: '',
        paidInCapital: '',
        investorName: '',
        investorPaidCapital: '',
        chairmanName: '',
        gmName: '',
        legalRepresentative: '',
        investmentDecisionMaker: '',
        operationManager: '',
        supervisorName: '',
        boardMembers: '',
        executives: '',
        establishmentDate: '',
        unifiedCreditCode: '',
        companyAddress: '',
        businessScope: '智能科技领域内的技术开发、技术咨询、技术服务、技术转让；电子产品生产销售；AI算力服务、人工智能服务器设计、个人AI助理终端开发销售。'
    })

    // 108項指標的數值 (MetricID -> Value)
    const [values, setValues] = useState<Record<string, number>>(() => {
        const init: Record<string, number> = {}
        metrics.forEach(m => init[m.id] = m.minValue || 0)
        return init
    })

    // 服務端返回的結果
    const [assessmentResult, setAssessmentResult] = useState<any>(null)
    const [aiResult, setAiResult] = useState<any>(null)

    // --- 初始化加載 ---
    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            themeVariables: {
                primaryColor: '#e0f2fe',
                primaryTextColor: '#0369a1',
                lineColor: '#0ea5e9',
                secondaryColor: '#f0f9ff',
                tertiaryColor: '#ffffff'
            },
            securityLevel: 'loose',
            flowchart: { useMaxWidth: false, htmlLabels: true }
        })

        if (editId) {
            loadEvaluation(editId)
        } else {
            handleCalculate();
        }
    }, [editId])

    async function loadEvaluation(id: string) {
        setLoading(true)
        try {
            const res = await fetch(`/api/evaluate?id=${id}`)
            if (!res.ok) throw new Error('加載失敗')
            const data = await res.json()
            const ev = data.evaluation
            setCompanyInfo({
                companyName: ev.company_name,
                industry: ev.industry,
                fundingStage: ev.funding_stage,
                evaluationDate: ev.evaluation_date
            })
            const newValues = { ...values }
            ev.metric_values.forEach((mv: any) => {
                newValues[mv.metric_id] = mv.value
            })
            setValues(newValues)

            if (data.isDemo || id.startsWith('demo-')) {
                setIsReadOnly(true)
            } else {
                setIsReadOnly(false)
            }
            if (ev.deep_analysis) setAiResult(ev.deep_analysis)

            const calcRes = await fetch('/api/assessment/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ metrics: newValues })
            });
            if (calcRes.ok) setAssessmentResult(await calcRes.json());

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // --- 載入示例數據 (與原生 index_Sample.html 100% 對齊) ---
    function loadSelectedDemo(type: string) {
        setActiveDemoModal(false);
        setAiResult(null);

        const demos: any = {
            tech: {
                companyName: "智创科技有限公司",
                industry: "tech",
                fundingStage: "a",
                capital: "10000",
                paidIn: "5000",
                date: "2023-05-18",
                code: "91310115MA1H8U7X2L",
                address: "上海市浦东新区张江高科技园区科苑路88号",
                scope: "智能科技领域内的技术开发、技术咨询、技术服务、技术转让；电子产品生产销售；AI算力服务、人工智能服务器设计、个人AI助理终端开发销售。",
                shareholders: [
                    { name: "王智强 (创始人)", percentage: 35, subscribed: 3500, amount: 3500, type: "common" },
                    { name: "李林 (联合创始人)", percentage: 15, subscribed: 1500, amount: 1500, type: "common" },
                    { name: "张华 (技术高管)", percentage: 5, subscribed: 500, amount: 500, type: "common" },
                    { name: "红杉智投 (机构股东)", percentage: 25, subscribed: 2500, amount: 2500, type: "preferred" },
                    { name: "节点资本 (机构股东)", percentage: 20, subscribed: 2000, amount: 2000, type: "preferred" }
                ],
                products: [
                    { name: "智能决策引擎 Alpha-1", type: "软件系统", model: "ToB", price: 45, cost: 12, date: "2025-05-15" },
                    { name: "实时数据流处理器", type: "中间件", model: "ToB", price: 28, cost: 8, date: "2024-11-20" },
                    { name: "边缘计算推理套件", type: "硬件产品", model: "ToB", price: 15, cost: 11, date: "2025-08-10" }
                ],
                scores: {
                    "team_size": 65, "team_experience": 8, "ceo_background": 8, "cto_background": 7, "cmo_background": 6, "cfo_background": 5, "team_stability": 8, "team_complementarity": 7,
                    "advisor_quality": 6, "board_quality": 6, "team_education": 8, "team_network": 7, "team_culture": 7, "team_innovation": 8, "team_execution": 7, "product_maturity": 7,
                    "tech_innovation": 8.5, "tech_barriers": 8, "ip_portfolio": 47, "product_demand": 8, "user_experience": 7.5, "product_quality": 7, "development_speed": 7.5, "rd_budget": 25,
                    "rd_team_size": 45, "product_roadmap": 8, "tech_scalability": 8.5, "data_assets": 7, "algorithm_advantage": 8.5, "platform_ecosystem": 6, "product_differentiation": 8.5,
                    "integration_capability": 7, "tech_trend_alignment": 8.5, "product_patent": 8, "quality_certification": 5, "market_size": 1200, "market_growth": 35, "market_share": 5.5,
                    "customer_acquisition": 120, "customer_retention": 88, "brand_awareness": 6, "sales_growth": 120, "channel_coverage": 6, "competition_intensity": 7, "competitive_advantage": 8,
                    "overseas_expansion": 5, "customer_satisfaction": 8.5, "customer_lifetime_value": 15000, "market_position": 7.5, "pricing_power": 7, "distribution_network": 5, "marketing_efficiency": 7,
                    "market_penetration": 15, "competitor_count": 15, "barrier_to_entry": 8, "revenue": 32000, "revenue_growth": 150, "gross_margin": 65, "net_margin": 20, "burn_rate": 800,
                    "cash_runway": 18, "asset_liability_ratio": 35, "current_ratio": 2.5, "roi": 45, "roe": 30, "customer_acquisition_cost": 4, "revenue_per_employee": 492, "profit_per_employee": 98,
                    "funding_history": 8.5, "investor_quality": 9, "valuation_multiple": 15, "financial_control": 7, "audit_quality": 8, "operational_efficiency": 120, "process_standardization": 6,
                    "supply_chain": 7, "production_capacity": 85, "quality_control": 8, "employee_productivity": 65, "it_infrastructure": 8, "operational_risk": 7, "cost_control": 7,
                    "asset_utilization": 75, "vendor_management": 6, "logistics_capability": 15, "scalability": 9, "crisis_management": 7, "compliance": 8, "strategy_clarity": 8.5,
                    "business_model": 8.5, "corporate_governance": 7, "risk_management": 7, "succession_plan": 5, "csr": 7, "esg_score": 7.5, "innovation_culture": 9, "strategic_partnerships": 7,
                    "long_term_vision": 8, "sustainable_growth": 45, "market_expansion": 8, "product_pipeline": 8, "talent_attraction": 8, "climate_impact": 8, "resource_efficiency": 7.5,
                    "community_engagement": 6, "adaptability": 8.5, "reputation_management": 7, "future_readiness": 9
                }
            },
            manufacturing: {
                companyName: "环球重工集团有限公司",
                industry: "manufacturing",
                fundingStage: "ipo",
                capital: "200000",
                paidIn: "180000",
                date: "2010-03-12",
                code: "91110108MA002Y6T5G",
                address: "北京市经济技术开发区荣华南路15号院汇龙森工业园",
                scope: "重型机械设备、工程机械、矿山机械、港口机械、冶金机械及其备件的研发、制造、销售、租赁；工业自动化系统集成；货物进出口、技术进出口。",
                shareholders: [
                    { name: "环球产业控股集团", percentage: 45, subscribed: 90000, amount: 90000, type: "common" },
                    { name: "国家产业引导基金", percentage: 20, subscribed: 40000, amount: 40000, type: "preferred" },
                    { name: "陈建国 (董事长)", percentage: 10, subscribed: 20000, amount: 20000, type: "common" },
                    { name: "林峰 (总经理)", percentage: 10, subscribed: 20000, amount: 20000, type: "common" },
                    { name: "赵毅 (核心高管)", percentage: 5, subscribed: 10000, amount: 10000, type: "common" },
                    { name: "公众及其他股东", percentage: 10, subscribed: 20000, amount: 10000, type: "common" }
                ],
                products: [
                    { name: "超大型全液压挖掘机 GX900", type: "工程机械", model: "ToB", price: 1200, cost: 750, date: "2024-06-15" },
                    { name: "数字化矿山综合管控平台", type: "软件系统", model: "ToB", price: 450, cost: 120, date: "2024-01-20" },
                    { name: "新能源港口作业机器人", type: "智能装备", model: "ToG", price: 280, cost: 180, date: "2025-03-10" }
                ],
                scores: {
                    "team_size": 120, "team_experience": 22, "ceo_background": 9.5, "cto_background": 8.5, "cmo_background": 9.0, "cfo_background": 9.2, "team_stability": 9.0, "team_complementarity": 8.5,
                    "advisor_quality": 8.0, "board_quality": 9.0, "team_education": 8.5, "team_network": 9.2, "team_culture": 8.5, "team_innovation": 8.0, "team_execution": 9.0, "product_maturity": 9.5,
                    "tech_innovation": 8.5, "tech_barriers": 9.0, "ip_portfolio": 352, "product_demand": 9.2, "user_experience": 8.2, "product_quality": 9.5, "development_speed": 7.5, "rd_budget": 8.5,
                    "rd_team_size": 850, "product_roadmap": 8.8, "tech_scalability": 9.0, "data_assets": 8.5, "algorithm_advantage": 8.0, "platform_ecosystem": 7.5, "product_differentiation": 8.8,
                    "integration_capability": 8.5, "tech_trend_alignment": 8.5, "product_patent": 9.0, "quality_certification": 10, "market_size": 5000, "market_growth": 12, "market_share": 12.5,
                    "customer_acquisition": 150, "customer_retention": 95, "brand_awareness": 9.2, "sales_growth": 15, "channel_coverage": 9.5, "competition_intensity": 8.0, "competitive_advantage": 9.0,
                    "overseas_expansion": 8.5, "customer_satisfaction": 9.2, "customer_lifetime_value": 850000, "market_position": 9.5, "pricing_power": 8.8, "distribution_network": 9.2, "marketing_efficiency": 8.5,
                    "market_penetration": 25, "competitor_count": 12, "barrier_to_entry": 9.5, "revenue": 1250000, "revenue_growth": 18, "gross_margin": 25, "net_margin": 12, "burn_rate": 1500,
                    "cash_runway": 36, "asset_liability_ratio": 45, "current_ratio": 1.5, "roi": 18, "roe": 15, "customer_acquisition_cost": 8, "revenue_per_employee": 250, "profit_per_employee": 30,
                    "funding_history": 9.5, "investor_quality": 9.5, "valuation_multiple": 8.5, "financial_control": 9.5, "audit_quality": 9.8, "operational_efficiency": 180, "process_standardization": 9.2,
                    "supply_chain": 9.5, "production_capacity": 88, "quality_control": 9.5, "employee_productivity": 6500, "it_infrastructure": 8.8, "operational_risk": 9.2, "cost_control": 8.5,
                    "asset_utilization": 82, "vendor_management": 9.0, "logistics_capability": 12, "scalability": 8.5, "crisis_management": 9.2, "compliance": 9.8, "strategy_clarity": 9.5,
                    "business_model": 9.2, "corporate_governance": 9.5, "risk_management": 9.2, "succession_plan": 8.5, "csr": 9.0, "esg_score": 8.8, "innovation_culture": 8.5, "strategic_partnerships": 9.2,
                    "long_term_vision": 9.5, "sustainable_growth": 15, "market_expansion": 8.8, "product_pipeline": 15, "talent_attraction": 9.2, "climate_impact": 9.0, "resource_efficiency": 8.5,
                    "community_engagement": 8.2, "adaptability": 8.8, "reputation_management": 9.2, "future_readiness": 9.5
                }
            },
            robot: {
                companyName: "灵动机器人有限公司",
                industry: "robot",
                fundingStage: "seed",
                capital: "1500",
                paidIn: "750",
                date: "2024-01-01",
                code: "91320594MA27X9Y41N",
                address: "苏州市工业园区星湖街218号",
                scope: "机器人本体、核心零部件、控制系统、人工智能算法的研发、生产、销售及技术服务。",
                shareholders: [
                    { name: "张强 (创始人)", percentage: 70, subscribed: 1050, amount: 600, type: "common" },
                    { name: "李明 (技术合伙人)", percentage: 20, subscribed: 300, amount: 150, type: "common" },
                    { name: "王芳 (天使投资人)", percentage: 10, subscribed: 150, amount: 50, type: "preferred" }
                ],
                products: [
                    { name: "基础型减速机样机", type: "零组件", model: "ToB", price: 0.12, cost: 0.10, date: "2026-03-01" }
                ],
                scores: {
                    "team_size": 12, "team_experience": 4.5, "ceo_background": 7.5, "cto_background": 8.0, "cmo_background": 4.5, "cfo_background": 3.5, "team_stability": 6.5, "team_complementarity": 7.0,
                    "advisor_quality": 5.5, "board_quality": 5.0, "team_education": 8.5, "team_network": 5.0, "team_culture": 7.5, "team_innovation": 8.5, "team_execution": 6.5, "product_maturity": 3.5,
                    "tech_innovation": 8.5, "tech_barriers": 7.5, "ip_portfolio": 8, "product_demand": 7.5, "user_experience": 5.5, "product_quality": 6.5, "development_speed": 8.0, "rd_budget": 45,
                    "rd_team_size": 9, "product_roadmap": 6.5, "tech_scalability": 7.0, "data_assets": 3.0, "algorithm_advantage": 7.5, "platform_ecosystem": 2.5, "product_differentiation": 8.0,
                    "integration_capability": 5.0, "tech_trend_alignment": 8.5, "product_patent": 6.5, "quality_certification": 1, "market_size": 850, "market_growth": 45, "market_share": 0.2,
                    "customer_acquisition": 350, "customer_retention": 75, "brand_awareness": 2.5, "sales_growth": 25, "channel_coverage": 2.5, "competition_intensity": 7.5, "competitive_advantage": 6.5,
                    "overseas_expansion": 3.5, "customer_satisfaction": 8.0, "customer_lifetime_value": 5500, "market_position": 5.5, "pricing_power": 5.0, "distribution_network": 2, "marketing_efficiency": 4.5,
                    "market_penetration": 1.5, "competitor_count": 25, "barrier_to_entry": 6.5, "revenue": 1200, "revenue_growth": 15, "gross_margin": 35, "net_margin": -55, "burn_rate": 85,
                    "cash_runway": 12, "asset_liability_ratio": 15, "current_ratio": 3.5, "roi": -25, "roe": -35, "customer_acquisition_cost": 24, "revenue_per_employee": 100, "profit_per_employee": -45,
                    "funding_history": 4.5, "investor_quality": 5.5, "valuation_multiple": 25, "financial_control": 5.0, "audit_quality": 3.5, "operational_efficiency": 65, "process_standardization": 3.5,
                    "supply_chain": 4.5, "production_capacity": 15, "quality_control": 5.5, "employee_productivity": 12, "it_infrastructure": 6.5, "operational_risk": 5.5, "cost_control": 4.5,
                    "asset_utilization": 35, "vendor_management": 4.0, "logistics_capability": 65, "scalability": 8.5, "crisis_management": 5.5, "compliance": 6.5, "strategy_clarity": 8.0,
                    "business_model": 7.5, "corporate_governance": 5.5, "risk_management": 6.0, "succession_plan": 3.5, "csr": 4.5, "esg_score": 5.5, "innovation_culture": 8.5, "strategic_partnerships": 5.5,
                    "long_term_vision": 8.5, "sustainable_growth": 45, "market_expansion": 7.5, "product_pipeline": 4, "talent_attraction": 8.0, "climate_impact": 7.5, "resource_efficiency": 6.5,
                    "community_engagement": 5.0, "adaptability": 8.5, "reputation_management": 6.5, "future_readiness": 8.0
                }
            }
        };

        const demo = demos[type];
        if (!demo) return;

        setCompanyInfo({
            companyName: demo.companyName,
            industry: demo.industry,
            fundingStage: demo.fundingStage,
            evaluationDate: new Date().toISOString().split('T')[0]
        });

        // 更新深層數據
        setDeepData({
            registeredCapital: demo.capital || '',
            paidInCapital: demo.paidIn || '',
            investorName: demo.investorName || '',
            investorPaidCapital: demo.investorPaidCapital || '',
            chairmanName: demo.chairman || '',
            gmName: demo.gm || '',
            legalRepresentative: demo.legalRep || '',
            investmentDecisionMaker: demo.investmentLead || '',
            operationManager: demo.opsLead || '',
            supervisorName: demo.supervisor || '',
            boardMembers: demo.boardMembers || '',
            executives: demo.executives || '',
            establishmentDate: demo.date || '',
            unifiedCreditCode: demo.code || '',
            companyAddress: demo.address || '',
            businessScope: demo.scope || ''
        });

        const newValues = { ...values };
        Object.keys(demo.scores).forEach((id: string) => {
            newValues[id] = (demo.scores as any)[id];
        });
        setValues(newValues);

        setShareholders(demo.shareholders);
        setProducts(demo.products);

        // 立即計算評分，傳入 newValues 以避開狀態更新延遲
        handleCalculate(newValues);

        // 自動生成圖表
        setTimeout(() => {
            generateMermaidChart();
        }, 500);
        setSuccess(`成功载入示例数据：${demo.companyName}`);
    }

    async function handleCalculate(customValues?: Record<string, number>) {
        setError(''); setSuccess('')
        const targetValues = customValues || values;
        try {
            const res = await fetch('/api/assessment/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ metrics: targetValues })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setAssessmentResult(data)
            return data
        } catch (err: any) {
            setError(err.message)
            return null
        }
    }

    const radarData = useMemo(() => {
        if (!assessmentResult) return { labels: [], datasets: [] };
        const labels = categoriesConfig.map(c => c.name);
        const data = categoriesConfig.map(c => assessmentResult.categoryScores[c.id]?.score || 0);
        return {
            labels,
            datasets: [
                {
                    label: '维度得分',
                    data,
                    backgroundColor: 'rgba(37, 99, 235, 0.2)',
                    borderColor: 'rgba(37, 99, 235, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(37, 99, 235, 1)',
                    pointBorderColor: '#fff',
                },
            ],
        }
    }, [assessmentResult])

    const getGradeClass = (score: number) => {
        if (score >= 85) return { bg: '#d4edda', color: '#155724', text: 'A级 (优质投资标的)' };
        if (score >= 70) return { bg: '#d1ecf1', color: '#0c5460', text: 'B级 (良好投资标的)' };
        if (score >= 50) return { bg: '#fff3cd', color: '#856404', text: 'C级 (建议观望/改善)' };
        return { bg: '#f8d7da', color: '#721c24', text: 'D级 (高风险不建议)' };
    };

    const radarOptions = {
        scales: {
            r: {
                angleLines: { display: true },
                suggestedMin: 0,
                suggestedMax: 100,
                ticks: { stepSize: 20, display: false }
            }
        },
        plugins: {
            legend: { display: false }
        },
        maintainAspectRatio: false
    }

    const handleValueChange = (id: string, val: number) => {
        if (isReadOnly) return
        setValues(prev => ({ ...prev, [id]: val }))
    }

    async function handleSave() {
        setError(''); setSuccess(''); setSaveLoading(true)
        try {
            const currentResult = await handleCalculate();
            const res = await fetch('/api/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editId || undefined,
                    companyInfo,
                    metrics: metrics.map(m => ({ id: m.id, value: values[m.id] })),
                    results: currentResult
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setSuccess('✅ 评估报告已成功保存')
            if (!editId) router.push(`/app/evaluate?id=${data.id}`)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaveLoading(false)
        }
    }

    async function handleAiAnalyze() {
        setError(''); setAiLoading(true)
        try {
            // 1. 数据校验：检查是否有有效的评分结果
            if (!assessmentResult || !assessmentResult.finalResult || assessmentResult.finalResult.finalScore === 0) {
                throw new Error('请先输入数据或载入示例以供 AI 分析');
            }

            // 2. 自动测试连接：检查 API Key 是否有效
            const verifyRes = await fetch('/api/ai-lab/verify');
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.verified) {
                throw new Error('请完成AI连接');
            }

            const res = await fetch('/api/assessment/ai-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyInfo: {
                        name: companyInfo.companyName,
                        industry: companyInfo.industry,
                        fundingStage: companyInfo.fundingStage
                    },
                    resultSummary: assessmentResult,
                    type: 'comprehensive',
                    aiConfig: aiConfig
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'AI 分析失败')
            setAiResult({ content: data.content })
            setSuccess('✅ AI 深度分析完成')
            // 自动跳转到显示结果的区域
            const aiReportEl = document.getElementById('ai-report-section');
            if (aiReportEl) aiReportEl.scrollIntoView({ behavior: 'smooth' });
        } catch (err: any) {
            setError(err.message)
        } finally {
            setAiLoading(false)
        }
    }

    // --- Mermaid 股權圖表邏輯 ---
    async function generateMermaidChart() {
        const placeholder = document.getElementById('mermaidPlaceholder');
        const container = document.getElementById('mermaidChart');
        if (!container) return;

        if (placeholder) placeholder.style.display = 'none';
        container.innerHTML = '<div class="spinner"></div> 正在生成圖表...';

        try {
            const companyName = companyInfo.companyName || '被評估企業';
            let definition = `graph TD\n    C["${companyName}"]:::company\n`;

            shareholders.forEach((sh: any, idx: number) => {
                const nodeName = `SH${idx}`;
                definition += `    ${nodeName}["${sh.name}<br/>${sh.percentage}%"]:::shareholder\n`;
                definition += `    ${nodeName} --> C\n`;
            });

            definition += `    classDef company fill:#eff6ff,stroke:#2563eb,stroke-width:2px,color:#1e40af,font-weight:bold;\n`;
            definition += `    classDef shareholder fill:#ffffff,stroke:#94a3b8,stroke-width:1px,color:#334155,font-size:12px;\n`;

            const { svg } = await mermaid.render('mermaid-svg-' + Date.now(), definition);
            container.innerHTML = `<div id="equityTree" style="transform: scale(${mermaidScale}); transform-origin: top center; transition: transform 0.2s;">${svg}</div>`;
        } catch (err: any) {
            console.error('Mermaid render error:', err);
            container.innerHTML = `<p style="color: red;">生成失敗: ${err.message}</p>`;
        }
    }

    const applyMermaidZoom = (newScale: number) => {
        setMermaidScale(newScale);
        const tree = document.getElementById('equityTree');
        if (tree) tree.style.transform = `scale(${newScale})`;
    }

    const zoomInMermaid = () => applyMermaidZoom(Math.min(mermaidScale + 0.2, 3));
    const zoomOutMermaid = () => applyMermaidZoom(Math.max(mermaidScale - 0.2, 0.5));
    const resetMermaidZoom = () => applyMermaidZoom(1);

    async function handleExportPdf() {
        setExportLoading(true)
        try {
            const html2pdf = (await import('html2pdf.js')).default
            const element = reportRef.current
            if (!element) return
            const opt = {
                margin: 10,
                filename: `${companyInfo.companyName}_评估报告.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
            }
            await html2pdf().set(opt).from(element).save()
        } catch (err: any) {
            setError('PDF 导出失败：' + err.message)
        } finally {
            setExportLoading(false)
        }
    }

    const [activeTab, setActiveTab] = useState<'指标' | '结果' | '分析' | '报告'>('指标')

    if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><span className="spinner spinner-dark" /> 加载数据中...</div>

    const integrationButtons = [
        { label: '导入税务信息', color: '#dc2626', icon: '📋' },
        { label: '连接全球专利数据中心', color: '#2563eb', icon: '🔬' },
        { label: '对接投资机构评分系统', color: '#10b981', icon: '🏛️' },
        { label: '对接海外市场评估系统', color: '#9333ea', icon: '🌐' },
    ];

    const actionButtons = [
        { label: '企业深度信息', color: '#f59e0b', onClick: () => setShowDeepInfo(!showDeepInfo) },
        { label: '计算综合评分', color: '#3b82f6', onClick: handleCalculate },
        { label: '保存数据', color: '#94a3b8', onClick: handleSave, disabled: saveLoading || isReadOnly },
        { label: '加载数据', color: '#94a3b8', onClick: () => { } },
        { label: '载入示例数据', color: '#94a3b8', onClick: () => setActiveDemoModal(true) },
        { label: 'AI深度分析', color: '#a855f7', onClick: handleAiAnalyze, loading: aiLoading },
        { label: 'AI 设置', color: '#94a3b8', onClick: () => setShowAiSettings(!showAiSettings) },
    ];

    return (
        <div className="container">
            <header>
                <h1>企业出海与投资评估分析系统</h1>
                <p className="subtitle">108项指标动态评估 | AI向量数据算法分析 | 权重总和100.0% | 计分制评估</p>
            </header>

            <div className="control-panel">
                <div className="company-info">
                    <div className="input-group">
                        <label htmlFor="companyName">企业名称</label>
                        <input type="text" id="companyName" value={companyInfo.companyName} onChange={e => setCompanyInfo(p => ({ ...p, companyName: e.target.value }))} placeholder="输入被评估企业名称" />
                        <div className="tool-buttons-container" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <button type="button" className={`tool-btn tax-btn ${activeToolPanel === 'tax' ? 'active-tool' : ''}`} id="taxToolBtn" onClick={() => setActiveToolPanel(p => p === 'tax' ? null : 'tax')}>
                                <span className="tool-icon">📋</span> 导入税务信息
                            </button>
                            <button type="button" className={`tool-btn patent-btn ${activeToolPanel === 'patent' ? 'active-tool' : ''}`} id="patentToolBtn" onClick={() => setActiveToolPanel(p => p === 'patent' ? null : 'patent')}>
                                <span className="tool-icon">🔬</span> 连接全球专利数据中心
                            </button>
                            <button type="button" className={`tool-btn invest-btn ${activeToolPanel === 'invest' ? 'active-tool' : ''}`} id="investToolBtn" onClick={() => setActiveToolPanel(p => p === 'invest' ? null : 'invest')}>
                                <span className="tool-icon">🏦</span> 对接投资机构评分系统
                            </button>
                            <button type="button" className={`tool-btn oversea-btn ${activeToolPanel === 'oversea' ? 'active-tool' : ''}`} id="overseaMarketBtn" onClick={() => setActiveToolPanel(p => p === 'oversea' ? null : 'oversea')}>
                                <span className="tool-icon">🌐</span> 对接海外市场评估系统
                            </button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="industry">所属行业</label>
                        <select id="industry" value={companyInfo.industry} onChange={e => setCompanyInfo(p => ({ ...p, industry: e.target.value }))}>
                            <option value="tech">科技/互联网</option>
                            <option value="robot">机器人/智能硬件</option>
                            <option value="healthcare">医疗健康</option>
                            <option value="finance">金融服务</option>
                            <option value="manufacturing">制造业</option>
                            <option value="consumer">消费零售</option>
                            <option value="energy">能源环保</option>
                            <option value="other">其他</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label htmlFor="fundingStage">适合融资阶段</label>
                        <select id="fundingStage" value={companyInfo.fundingStage} onChange={e => setCompanyInfo(p => ({ ...p, fundingStage: e.target.value }))}>
                            <option value="seed">种子期 (Seed)</option>
                            <option value="angel">天使轮 (Angel)</option>
                            <option value="pre-a">Pre-A轮</option>
                            <option value="a">A轮</option>
                            <option value="a-plus">A+轮</option>
                            <option value="pre-b">Pre-B轮</option>
                            <option value="b">B轮</option>
                            <option value="b-plus">B+轮</option>
                            <option value="pre-c">Pre-C轮</option>
                            <option value="c">C轮</option>
                            <option value="c-plus">C+轮</option>
                            <option value="ipo">IPO准备期</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label htmlFor="evaluationDate">评估日期</label>
                        <input type="date" id="evaluationDate" value={companyInfo.evaluationDate} onChange={e => setCompanyInfo(p => ({ ...p, evaluationDate: e.target.value }))} />
                    </div>
                </div>

                <div>
                    <button id="deepInfoBtn" className="deep-info" onClick={() => setShowDeepInfo(!showDeepInfo)}>企业深度信息</button>
                    <button id="calculateBtn" onClick={() => handleCalculate()} disabled={aiLoading || saveLoading}>计算综合评分</button>
                    <button id="saveDataBtn" className="secondary" onClick={handleSave} disabled={isReadOnly || saveLoading}>保存数据</button>
                    <button id="loadDataBtn" className="secondary">加载数据</button>
                    <button id="demoBtn" className="secondary" onClick={() => setActiveDemoModal(true)}>载入示例数据</button>
                    <button id="aiBtn" className="ai" onClick={handleAiAnalyze} disabled={aiLoading}>{aiLoading ? '处理中...' : 'AI深度分析'}</button>
                    <button id="apiKeyToggleBtn" className="secondary" onClick={() => setShowAiSettings(!showAiSettings)}>AI 设置</button>
                </div>
            </div>

            {/* 深度信息面板 */}
            <div id="deepInfoPanel" className={`deep-info-panel ${showDeepInfo ? 'active' : ''}`} style={{ display: showDeepInfo ? 'block' : 'none' }}>
                <h2>企业深度信息</h2>

                <div className="deep-info-grid">
                    {/* 注册资本与资本结构 */}
                    <div className="deep-info-section">
                        <h3>注册资本与资本结构</h3>
                        <div className="input-group">
                            <label htmlFor="registeredCapital">注册资本额（万元）</label>
                            <input type="number" id="registeredCapital" placeholder="请输入注册资本额" min="0" step="0.01"
                                value={deepData.registeredCapital} onChange={e => setDeepData({ ...deepData, registeredCapital: e.target.value })} />
                            <div className="input-hint">请输入正确的注册资本金额</div>
                        </div>
                        <div className="input-group">
                            <label htmlFor="paidInCapital">实收资本（万元）</label>
                            <input type="number" id="paidInCapital" placeholder="请输入实收资本额" min="0" step="0.01"
                                value={deepData.paidInCapital} onChange={e => setDeepData({ ...deepData, paidInCapital: e.target.value })} />
                            <div className="input-hint">实收资本应小于等于注册资本</div>
                        </div>
                        <div className="input-group">
                            <label htmlFor="investorName">主要投资人名称</label>
                            <input type="text" id="investorName" placeholder="请输入主要投资人名称"
                                value={deepData.investorName} onChange={e => setDeepData({ ...deepData, investorName: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label htmlFor="investorPaidCapital">投资人实缴资本（万元）</label>
                            <input type="number" id="investorPaidCapital" placeholder="请输入投资人实缴资本额" min="0" step="0.01"
                                value={deepData.investorPaidCapital} onChange={e => setDeepData({ ...deepData, investorPaidCapital: e.target.value })} />
                        </div>
                    </div>

                    {/* 公司治理结构 */}
                    <div className="deep-info-section">
                        <h3>公司治理结构</h3>
                        <div className="input-group">
                            <label htmlFor="chairmanName">董事长 / GP</label>
                            <input type="text" id="chairmanName" placeholder="姓名"
                                value={deepData.chairmanName} onChange={e => setDeepData({ ...deepData, chairmanName: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label htmlFor="gmName">总经理 / 执行事务合伙人</label>
                            <input type="text" id="gmName" placeholder="姓名"
                                value={deepData.gmName} onChange={e => setDeepData({ ...deepData, gmName: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label htmlFor="legalRepresentative">法定代表人</label>
                            <input type="text" id="legalRepresentative" placeholder="姓名"
                                value={deepData.legalRepresentative} onChange={e => setDeepData({ ...deepData, legalRepresentative: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label htmlFor="investmentDecisionMaker">投資決策負責人</label>
                            <input type="text" id="investmentDecisionMaker" placeholder="姓名"
                                value={deepData.investmentDecisionMaker} onChange={e => setDeepData({ ...deepData, investmentDecisionMaker: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label htmlFor="operationManager">運營負責人</label>
                            <input type="text" id="operationManager" placeholder="姓名"
                                value={deepData.operationManager} onChange={e => setDeepData({ ...deepData, operationManager: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label htmlFor="supervisorName">监事</label>
                            <input type="text" id="supervisorName" placeholder="姓名"
                                value={deepData.supervisorName} onChange={e => setDeepData({ ...deepData, supervisorName: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label htmlFor="boardMembers">董事会成员</label>
                            <textarea id="boardMembers" rows={2} placeholder="人员用顿号或逗号分隔"
                                value={deepData.boardMembers} onChange={e => setDeepData({ ...deepData, boardMembers: e.target.value })}></textarea>
                        </div>
                        <div className="input-group">
                            <label htmlFor="executives">高管团队</label>
                            <textarea id="executives" rows={2} placeholder="人员用顿号或逗号分隔"
                                value={deepData.executives} onChange={e => setDeepData({ ...deepData, executives: e.target.value })}></textarea>
                        </div>
                    </div>

                    {/* 公司核心信息 */}
                    <div className="deep-info-section">
                        <h3>公司核心信息</h3>
                        <div className="input-group">
                            <label htmlFor="establishmentDate">成立日期</label>
                            <input type="date" id="establishmentDate"
                                value={deepData.establishmentDate} onChange={e => setDeepData({ ...deepData, establishmentDate: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label htmlFor="unifiedCreditCode">统一社会信用代码</label>
                            <input type="text" id="unifiedCreditCode" placeholder="请输入统一社会信用代码"
                                value={deepData.unifiedCreditCode} onChange={e => setDeepData({ ...deepData, unifiedCreditCode: e.target.value })} />
                            <div className="input-hint">18位统一社会信用代码</div>
                        </div>
                        <div className="input-group">
                            <label htmlFor="companyAddress">注册地址</label>
                            <textarea id="companyAddress" rows={2} placeholder="请输入公司注册地址"
                                value={deepData.companyAddress} onChange={e => setDeepData({ ...deepData, companyAddress: e.target.value })}></textarea>
                        </div>
                        <div className="input-group">
                            <label htmlFor="businessScope">经营范围</label>
                            <textarea id="businessScope" rows={3} placeholder="请输入公司经营范围"
                                value={deepData.businessScope} onChange={e => setDeepData({ ...deepData, businessScope: e.target.value })}></textarea>
                        </div>
                    </div>
                </div>

                {/* 产品/技术信息 */}
                <div className="deep-info-section">
                    <h3>项目产品/技术信息</h3>
                    <button className="btn-icon secondary" id="loadDemoBtn" onClick={() => setActiveDemoModal(true)}>
                        <div className="btn-icon-wrapper">
                            <span>📂 載入示例數據</span>
                        </div>
                    </button>
                    <div className="metrics-table-container">
                        <table className="product-table">
                            <thead>
                                <tr>
                                    <th>产品/技术名称</th>
                                    <th>产品类型</th>
                                    <th>销售模式</th>
                                    <th>售价 (万元)</th>
                                    <th>成本 (万元)</th>
                                    <th>预估毛利 (万元)</th>
                                    <th>预计上市日期</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="productTableBody">
                                {products.map((p, idx) => (
                                    <tr key={idx}>
                                        <td><input type="text" className="product-name" defaultValue={p.name} onChange={() => { }} /></td>
                                        <td><input type="text" className="product-type" defaultValue={p.type} onChange={() => { }} /></td>
                                        <td>
                                            <select className="product-sales-model" defaultValue={p.model} onChange={() => { }}>
                                                <option value="ToC">ToC</option>
                                                <option value="ToG">ToG</option>
                                                <option value="ToB">ToB</option>
                                                <option value="Other">其他</option>
                                            </select>
                                        </td>
                                        <td><input type="number" className="product-price" defaultValue={Number(p.price)} min="0" step="0.01" onChange={() => { }} /></td>
                                        <td><input type="number" className="product-cost" defaultValue={Number(p.cost)} min="0" step="0.01" onChange={() => { }} /></td>
                                        <td><input type="number" className="product-profit" defaultValue={(Number(p.price) - Number(p.cost)).toFixed(2)} readOnly /></td>
                                        <td><input type="date" className="product-launch-date" defaultValue={p.date} onChange={() => { }} /></td>
                                        <td><button className="remove-product-btn" onClick={() => setProducts(products.filter((_, i) => i !== idx))}>删除</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button id="addProductBtn" className="add-shareholder-btn secondary" onClick={() => setProducts([...products, { name: '', type: '', model: 'ToB', price: 0, cost: 0, date: '' }])}>+
                        添加产品/技术</button>
                </div>

                {/* 股东结构与持股比例 */}
                <div className="deep-info-section">
                    <h3>股东结构与持股比例 <span id="totalPercentage" className="data-saved-badge">总计: 100%</span></h3>
                    <table className="shareholder-table">
                        <thead>
                            <tr>
                                <th>股东名称</th>
                                <th>持股比例 (%)</th>
                                <th>认缴金额 (万元)</th>
                                <th>实缴金额 (万元)</th>
                                <th>持股性质</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="shareholderTableBody">
                            {shareholders.map((sh, idx) => (
                                <tr key={idx}>
                                    <td><input type="text" className="shareholder-name" defaultValue={sh.name} onChange={() => { }} /></td>
                                    <td><input type="number" className="shareholder-percentage" defaultValue={Number(sh.percentage)} min="0" max="100" step="0.1" onChange={() => { }} /></td>
                                    <td><input type="number" className="shareholder-subscribed" defaultValue={Number(sh.subscribed)} min="0" step="0.1" onChange={() => { }} /></td>
                                    <td><input type="number" className="shareholder-amount" defaultValue={Number(sh.amount)} min="0" step="0.1" onChange={() => { }} /></td>
                                    <td>
                                        <select className="shareholder-type" defaultValue={sh.type} onChange={() => { }}>
                                            <option value="common">普通股</option>
                                            <option value="preferred">优先股</option>
                                            <option value="a">A类股</option>
                                            <option value="b">B类股</option>
                                            <option value="gp">GP</option>
                                            <option value="lp">LP</option>
                                            <option value="other">其他</option>
                                        </select>
                                    </td>
                                    <td><button className="remove-shareholder-btn" onClick={() => setShareholders(shareholders.filter((_, i) => i !== idx))}>删除</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button id="addShareholderBtn" className="add-shareholder-btn secondary" onClick={() => setShareholders([...shareholders, { name: '', percentage: 0, subscribed: 0, amount: 0, type: 'common' }])}>+ 添加股东</button>
                    <button id="generateMermaidBtn" className="generate-mermaid-btn" onClick={generateMermaidChart}>生成股权结构图</button>
                </div>

                {/* Mermaid图表容器 */}
                <div className="mermaid-container">
                    <div className="mermaid-controls">
                        <button id="zoomInBtn" title="放大圖表 (Ctrl+加號)" onClick={zoomInMermaid}>放大</button>
                        <button id="zoomOutBtn" title="縮小圖表 (Ctrl+減號)" onClick={zoomOutMermaid}>縮小</button>
                        <button id="resetZoomBtn" title="重置縮放 (Ctrl+0)" onClick={resetMermaidZoom}>復原</button>
                    </div>
                    <div id="mermaidChart" className="mermaid-chart">
                        {/* Mermaid图表将在这里显示 */}
                    </div>
                    <p id="mermaidPlaceholder">點擊"生成股權結構圖"按鈕查看股權結構圖</p>
                </div>
            </div>

            {/* 算法实验室 AI设置面板 */}
            <div id="aiPanel" className={`ai-panel ${showAiSettings ? '' : 'hidden'}`} style={{ display: showAiSettings ? 'block' : 'none' }}>
                <div className="input-group">
                    <label htmlFor="apiKey">
                        <span className="api-status-indicator" id="apiStatusIndicator"></span>
                        算法實驗室 AI 設置 (API Key)
                    </label>
                    <div className="ai-input-group">
                        <input type="password" id="apiKey" placeholder="輸入您的算法實驗室 API Key" defaultValue="" />
                        <button id="saveApiKeyBtn">保存Key</button>
                        <button id="testApiBtn" className="api-test-btn">測試連接</button>
                    </div>
                    <div className="input-hint">
                        輸入您的算法實驗室 API Key。您可以在 <a href="https://platform.ai-lab.com/api-keys" target="_blank"
                            className="api-link">算法實驗室平台</a> 獲取
                    </div>
                    <div className="token-info">
                        <span id="tokenCount">剩余token: 未测试</span>
                        <span id="modelInfo" style={{}}>模型: 未选择</span>
                    </div>
                </div>

                <div className="ai-options">
                    <div className="input-group">
                        <label>选择AI模型</label>
                        <div className="ai-models">
                            <div className={`model-option ${aiConfig.model === 'ai-lab-chat' ? 'selected' : ''}`} onClick={() => setAiConfig(p => ({ ...p, model: 'ai-lab-chat' }))}>算法實驗室 Chat (V3)</div>
                            <div className={`model-option ${aiConfig.model === 'ai-lab-reasoning' ? 'selected' : ''}`} onClick={() => setAiConfig(p => ({ ...p, model: 'ai-lab-reasoning' }))}>算法實驗室 Reasoning (R1)</div>
                        </div>
                        <div className="input-hint">
                            Chat: 通用分析 | Coder: 技术评估 | Reasoning: 深度推理
                        </div>
                    </div>

                    <div className="ai-slider-container">
                        <label htmlFor="aiTemperature">AI分析深度: <span id="tempValue">中等深度 ({aiConfig.temperature})</span></label>
                        <input type="range" id="aiTemperature" min="0.1" max="1" step="0.1" value={aiConfig.temperature} onChange={e => setAiConfig(p => ({ ...p, temperature: parseFloat(e.target.value) }))} />
                        <div className="ai-slider-labels">
                            <span>精确保守 (0.1)</span>
                            <span>平衡适中 (0.5)</span>
                            <span>创新发散 (1.0)</span>
                        </div>
                    </div>

                    <div className="ai-slider-container">
                        <label htmlFor="aiMaxTokens">分析詳細度: <span id="tokenValue">詳細分析 ({aiConfig.maxTokens} tokens)</span></label>
                        <input type="range" id="aiMaxTokens" min="500" max="4000" step="500" value={aiConfig.maxTokens} onChange={e => setAiConfig(p => ({ ...p, maxTokens: parseInt(e.target.value) }))} />
                        <div className="ai-slider-labels">
                            <span>簡要 (500)</span>
                            <span>詳細 (2000)</span>
                            <span>深度 (4000)</span>
                        </div>
                    </div>

                    <div className="ai-advanced-options">
                        <div className="input-group">
                            <label htmlFor="aiSystemPrompt">自定義系統指令（選填）</label>
                            <textarea id="aiSystemPrompt" rows={3} placeholder="自定義 AI 的分析角色和指令..." value={aiConfig.systemPrompt} onChange={e => setAiConfig(p => ({ ...p, systemPrompt: e.target.value }))}></textarea>
                            <div className="input-hint">
                                例如："你是一位資深的風險投資分析師，專注於科技行業..."
                            </div>
                        </div>
                    </div>
                </div>

                <div id="aiStatus" className="ai-status"></div>
            </div>

            {/* 税务信息面板 */}
            <div id="taxResultPanel" className={`tool-result-panel tax-panel ${activeToolPanel === 'tax' ? 'active' : ''}`} style={{ display: activeToolPanel === 'tax' ? 'block' : 'none' }}>
                <div className="tool-panel-header">
                    <h3>📋 税务信息导入结果</h3>
                    <button className="tool-panel-close" onClick={() => setActiveToolPanel(null)}>&times;</button>
                </div>
                <div id="taxContent">
                    <div className="tool-data-grid">
                        <div className="tool-data-card"><div className="card-label">纳税人识别号</div><div className="card-value" style={{ fontSize: '0.9rem' }}>91310000MA1FL8XX42</div></div>
                        <div className="tool-data-card"><div className="card-label">纳税信用等级</div><div className="card-value" style={{ color: '#00b894' }}>A级</div><div className="card-change positive">连续3年A级</div></div>
                        <div className="tool-data-card"><div className="card-label">本年度纳税总额</div><div className="card-value">¥ 2,856万</div><div className="card-change positive">↑ 23.5% 同比增长</div></div>
                        <div className="tool-data-card"><div className="card-label">增值税纳税额</div><div className="card-value">¥ 1,820万</div></div>
                        <div className="tool-data-card"><div className="card-label">企业所得税</div><div className="card-value">¥ 680万</div></div>
                        <div className="tool-data-card"><div className="card-label">税收政策</div><div className="card-value" style={{ color: '#6c5ce7', fontSize: '0.9rem' }}>高新技术企业 (15%税率)</div></div>
                    </div>
                    <h4 style={{ margin: '20px 0 10px', color: '#2c3e50' }}>📑 近三年纳税明细</h4>
                    <table className="tool-table">
                        <thead><tr><th>年度</th><th>增值税</th><th>企业所得税</th><th>其他税费</th><th>合计</th><th>信用等级</th></tr></thead>
                        <tbody>
                            <tr><td><strong>2025</strong></td><td>1,820万</td><td>680万</td><td>356万</td><td><strong>2,856万</strong></td><td><span className="status-badge good">A级</span></td></tr>
                            <tr><td><strong>2024</strong></td><td>1,540万</td><td>518万</td><td>254万</td><td><strong>2,312万</strong></td><td><span className="status-badge good">A级</span></td></tr>
                            <tr><td><strong>2023</strong></td><td>1,280万</td><td>425万</td><td>195万</td><td><strong>1,900万</strong></td><td><span className="status-badge good">A级</span></td></tr>
                        </tbody>
                    </table>
                    <div style={{ marginTop: '15px', padding: '12px', background: '#d4edda', borderRadius: '8px', color: '#155724' }}>
                        <strong>✅ 税务评估结论：</strong>该企业纳税信用良好，合规性优秀。
                    </div>
                </div>
            </div>

            {/* 专利数据面板 */}
            <div id="patentResultPanel" className={`tool-result-panel patent-panel ${activeToolPanel === 'patent' ? 'active' : ''}`} style={{ display: activeToolPanel === 'patent' ? 'block' : 'none' }}>
                <div className="tool-panel-header">
                    <h3>🔬 全球专利数据中心</h3>
                    <button className="tool-panel-close" onClick={() => setActiveToolPanel(null)}>&times;</button>
                </div>
                <div id="patentContent">
                    <div className="tool-data-grid">
                        <div className="tool-data-card"><div className="card-label">专利总数</div><div className="card-value" style={{ color: '#6c5ce7' }}>47 项</div></div>
                        <div className="tool-data-card"><div className="card-label">发明专利</div><div className="card-value">23 项</div></div>
                        <div className="tool-data-card"><div className="card-label">实用新型</div><div className="card-value">16 项</div></div>
                        <div className="tool-data-card"><div className="card-label">PCT国际专利</div><div className="card-value" style={{ color: '#e17055' }}>5 项</div></div>
                        <div className="tool-data-card"><div className="card-label">专利引用指数</div><div className="card-value" style={{ color: '#00b894' }}>8.6</div></div>
                    </div>
                    <h4 style={{ margin: '20px 0 10px', color: '#2c3e50' }}>🔍 核心专利清单</h4>
                    <table className="tool-table">
                        <thead><tr><th>专利名称</th><th>类型</th><th>申请日</th><th>状态</th><th>被引次数</th></tr></thead>
                        <tbody>
                            <tr><td>基于AI的数据分析方法</td><td>发明专利</td><td>2024-03-15</td><td><span className="status-badge good">已授权</span></td><td><strong>32</strong></td></tr>
                        </tbody>
                    </table>
                    <div style={{ marginTop: '15px', padding: '12px', background: '#e8d5f5', borderRadius: '8px', color: '#4a235a' }}>
                        <strong>🔬 专利评估结论：</strong>该企业专利布局初步成型。
                    </div>
                </div>
            </div>

            {/* 投资机构评分面板 */}
            <div id="investResultPanel" className={`tool-result-panel invest-panel ${activeToolPanel === 'invest' ? 'active' : ''}`} style={{ display: activeToolPanel === 'invest' ? 'block' : 'none' }}>
                <div className="tool-panel-header">
                    <h3>🏦 投资机构评分系统</h3>
                    <button className="tool-panel-close" onClick={() => setActiveToolPanel(null)}>&times;</button>
                </div>
                <div id="investContent">
                    <div className="tool-data-grid">
                        <div className="tool-data-card" style={{ textAlign: 'center' }}>
                            <div className="card-label">综合投资评级</div>
                            <div style={{ margin: '10px 0' }}><div className="score-ring high">A</div></div>
                        </div>
                        <div className="tool-data-card"><div className="card-label">估值区间</div><div className="card-value">5 - 8 亿</div></div>
                        <div className="tool-data-card"><div className="card-label">行业排名</div><div className="card-value">Top 20%</div></div>
                        <div className="tool-data-card"><div className="card-label">投资热度指数</div><div className="card-value" style={{ color: '#e17055' }}>75</div></div>
                    </div>
                    <h4 style={{ margin: '20px 0 10px', color: '#2c3e50' }}>🏛️ 主流机构评分</h4>
                    <table className="tool-table">
                        <thead><tr><th>评分机构</th><th>评分</th><th>评级</th><th>关注要点</th><th>更新日期</th></tr></thead>
                        <tbody>
                            <tr><td><strong>示例机构</strong></td><td><strong style={{ color: '#00b894' }}>80</strong></td><td><span className="status-badge good">推荐</span></td><td>关注市场增长</td><td>2026-02-12</td></tr>
                        </tbody>
                    </table>
                    <div style={{ marginTop: '15px', padding: '12px', background: '#fce4ec', borderRadius: '8px', color: '#880e4f' }}>
                        <strong>🏦 投资机构综合评价：</strong>企业具备一定投资价值。
                    </div>
                </div>
            </div>

            {/* 海外市场评估面板 */}
            <div id="overseaResultPanel" className={`tool-result-panel oversea-panel ${activeToolPanel === 'oversea' ? 'active' : ''}`} style={{ display: activeToolPanel === 'oversea' ? 'block' : 'none' }}>
                <div className="tool-panel-header">
                    <h3>🌐 海外市场评估系统</h3>
                    <button className="tool-panel-close" onClick={() => setActiveToolPanel(null)}>&times;</button>
                </div>
                <div id="overseaContent">
                    <div className="oversea-assess-header">
                        <div className="company-meta">
                            <h3>{companyInfo.companyName || '被评估企业'}</h3>
                            <p>📅 评估日期：{companyInfo.evaluationDate}</p>
                            <p>出海优劣势综合评估報告</p>
                        </div>
                        <div className="oversea-score-circle" style={{ borderColor: '#00b894' }}>
                            <span className="score-num">{assessmentResult?.finalResult?.finalScore || 0}</span>
                            <span className="score-pct">總體評分</span>
                        </div>
                    </div>
                    <div style={{ marginTop: '15px', padding: '12px', background: '#eef2ff', borderRadius: '8px', color: '#1e40af' }}>
                        <strong>🌐 海外市場評估：</strong>根據當前計分，企業具備良好的出海潛力。建議優先考慮東南亞或歐洲市場。
                    </div>
                </div>
            </div>

            <div className="weight-adjust-info">
                <p><strong>权重调整说明：</strong>您可以手动输入每个指标的权重值(0.1-30)，系统会自动调整其他权重以保持总和为100%。权重表示该指标在总评分中的百分比。</p>
            </div>

            {/* 综合评分结果弹窗 */}
            <div id="comprehensiveModal" className={`comprehensive-modal-overlay ${showComprehensiveModal ? 'active' : ''}`} style={{ display: showComprehensiveModal ? 'flex' : 'none' }}>
                <div className="comprehensive-modal">
                    <div className="modal-header">
                        <h2 id="modalCompanyName">{companyInfo.companyName || '企业'}综合评估报告</h2>
                        <div className="modal-subtitle" id="modalSubtitle">综合评分分析结果</div>
                    </div>
                    <div className="modal-score-hero">
                        <div id="modalScoreCircle" className="modal-score-circle" style={{
                            background: assessmentResult?.overallScore >= 70 ? 'linear-gradient(135deg, #00b894, #55efc4)' :
                                assessmentResult?.overallScore >= 50 ? 'linear-gradient(135deg, #fdcb6e, #f39c12)' :
                                    'linear-gradient(135deg, #e74c3c, #fd79a8)'
                        }}>
                            <span id="modalScoreValue">{assessmentResult?.overallScore?.toFixed(1) || '0'}</span>
                            <span className="score-label">/ 100</span>
                        </div>
                        <div id="modalGradeBadge" className="modal-grade-badge" style={
                            assessmentResult?.overallScore ?
                                { backgroundColor: getGradeClass(assessmentResult.overallScore).bg, color: getGradeClass(assessmentResult.overallScore).color } :
                                { backgroundColor: '#f8f9fa', color: '#6c757d' }
                        }>
                            {assessmentResult?.overallScore ? getGradeClass(assessmentResult.overallScore).text : '尚未评估'}
                        </div>
                    </div>
                    <div className="modal-body">
                        <div className="modal-section">
                            <h3>📊 七大维度评分</h3>
                            <div className="modal-category-grid" id="modalCategoryGrid">
                                {categoriesConfig.map(cat => (
                                    <div key={cat.id} className="modal-category-card">
                                        <div className="cat-name">{cat.name}</div>
                                        <div className="cat-score">{assessmentResult?.categoryScores[cat.id]?.score?.toFixed(1) || '0'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button onClick={() => { setShowComprehensiveModal(false); setActiveTab('结果'); }}>查看详细结果</button>
                        <button id="modalAiBtn" onClick={() => { setShowComprehensiveModal(false); handleAiAnalyze(); }}>AI深度分析</button>
                        <button className="secondary" onClick={() => setShowComprehensiveModal(false)}>关闭</button>
                    </div>
                </div>
            </div>
            {/* 3. 底部 4 标签切换系统 */}
            <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '32px', background: '#fff', borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
                {['指标', '结果', '分析', '报告'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as '指标' | '结果' | '分析' | '报告')}
                        style={{
                            padding: '16px 32px',
                            fontSize: '16px',
                            fontWeight: 700,
                            border: 'none',
                            background: activeTab === tab ? '#fff' : '#f8fafc',
                            color: activeTab === tab ? 'var(--primary)' : '#64748b',
                            borderBottom: activeTab === tab ? '3px solid var(--primary)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            flex: 1
                        }}
                    >
                        {tab === '指标' ? '评估指标 (108项)' : tab === '结果' ? '综合结果' : tab === '分析' ? '深度分析' : '评估报告'}
                    </button>
                ))}
            </div>

            {/* 4. 标签内容 */}
            <div style={{ minHeight: '600px' }}>
                {activeTab === '指标' && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ padding: '0 16px 24px 16px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>企业出海与投资评估指标 (7大区块，共108项)</h2>
                            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>请点击下方区块按钮展开对应指标，为每个指标输入数值，评分和权重可以手动调整，评分×权重=计分</p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', fontWeight: 700, color: '#1e40af' }}>
                            权重总和：<span style={{ color: 'var(--primary)', fontSize: '18px' }}>100.0</span>%
                        </div>

                        {/* 7 大维度入口卡片 (对齐截图颜色与布局) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '40px' }}>
                            {categoriesConfig.map((cat, idx) => {
                                const colors = [
                                    { bg: '#3b82f6', icon: '👥' }, // 团队 - 蓝
                                    { bg: '#10b981', icon: '🚀' }, // 产品 - 绿
                                    { bg: '#ef4444', icon: '📊' }, // 市场 - 红
                                    { bg: '#f59e0b', icon: '💰' }, // 财务 - 橙
                                    { bg: '#a855f7', icon: '⚙️' }, // 运营 - 紫
                                    { bg: '#334155', icon: '🎯' }, // 战略 - 深蓝
                                    { bg: '#2dd4bf', icon: '🌱' }, // 持续 - 浅绿
                                ];
                                const cfg = colors[idx] || colors[0];
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        style={{
                                            background: cfg.bg,
                                            color: '#fff',
                                            padding: '30px 20px',
                                            borderRadius: '16px',
                                            border: activeCategory === cat.id ? '4px solid #fff' : 'none',
                                            boxShadow: activeCategory === cat.id ? '0 0 0 2px ' + cfg.bg : '0 10px 15px rgba(0,0,0,0.1)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '12px',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s',
                                            textAlign: 'center',
                                            gridColumn: idx >= 5 ? 'span 1' : 'auto', // 处理最后两个居中
                                            transform: activeCategory === cat.id ? 'scale(1.05)' : 'scale(1)'
                                        }}
                                    >
                                        <span style={{ fontSize: '32px' }}>{cfg.icon}</span>
                                        <div style={{ fontWeight: 800, fontSize: '16px' }}>{cat.name}</div>
                                        <div style={{ fontSize: '12px', opacity: 0.9 }}>{metrics.filter(m => m.category === cat.id).length}项指标 | {activeCategory === cat.id ? '20' : '15'}%权重</div>
                                    </button>
                                );
                            }).slice(0, 5)}
                        </div>
                        {/* 最后两个卡片居中显示 */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '40px' }}>
                            {categoriesConfig.slice(5).map((cat, idx) => {
                                const colors = [
                                    { bg: '#334155', icon: '🎯' }, // 战略 - 深蓝
                                    { bg: '#2dd4bf', icon: '🌱' }, // 持续 - 浅绿
                                ];
                                const cfg = colors[idx];
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        style={{
                                            background: cfg.bg,
                                            color: '#fff',
                                            padding: '30px 20px',
                                            borderRadius: '16px',
                                            width: '260px',
                                            border: activeCategory === cat.id ? '4px solid #fff' : 'none',
                                            boxShadow: activeCategory === cat.id ? '0 0 0 2px ' + cfg.bg : '0 10px 15px rgba(0,0,0,0.1)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '12px',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <span style={{ fontSize: '32px' }}>{cfg.icon}</span>
                                        <div style={{ fontWeight: 800, fontSize: '16px' }}>{cat.name}</div>
                                        <div style={{ fontSize: '12px', opacity: 0.9 }}>{metrics.filter(m => m.category === cat.id).length}项指标 | 10%权重</div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* 指标表格展示区 */}
                        <div className="card" style={{ padding: '32px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #f1f5f9' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📊</div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{categoriesConfig.find(c => c.id === activeCategory)?.name} - 详细指标</h2>
                            </div>

                            <div className="metrics-table-container">
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f8fafc' }}>
                                        <tr>
                                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#475569' }}>评估指标</th>
                                            <th style={{ padding: '16px', textAlign: 'center', width: '220px', fontSize: '13px', color: '#475569' }}>当前数值</th>
                                            <th style={{ padding: '16px', textAlign: 'center', width: '100px', fontSize: '13px', color: '#475569' }}>权重(%)</th>
                                            <th style={{ padding: '16px', textAlign: 'center', width: '100px', fontSize: '13px', color: '#475569' }}>原始得分</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {metrics.filter(m => m.category === activeCategory).map(m => (
                                            <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '20px 16px' }}>
                                                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{m.name}</div>
                                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{m.description}</div>
                                                </td>
                                                <td style={{ padding: '20px 16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <input
                                                            type="number"
                                                            className="form-input"
                                                            style={{ width: '90px', padding: '8px', textAlign: 'center' }}
                                                            value={values[m.id]}
                                                            readOnly={isReadOnly}
                                                            onChange={e => handleValueChange(m.id, parseFloat(e.target.value) || 0)}
                                                        />
                                                        <span style={{ fontSize: '14px', color: '#64748b' }}>{m.unit}</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min={m.minValue}
                                                        max={m.maxValue}
                                                        step={(m.maxValue - m.minValue) / 100 || 0.1}
                                                        value={values[m.id]}
                                                        disabled={isReadOnly}
                                                        onChange={e => handleValueChange(m.id, parseFloat(e.target.value))}
                                                        style={{ width: '100%', marginTop: '12px', cursor: isReadOnly ? 'not-allowed' : 'pointer' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '20px 16px', textAlign: 'center' }}>
                                                    <input type="number" className="form-input" style={{ width: '60px', textAlign: 'center' }} defaultValue={1.0} readOnly />
                                                </td>
                                                <td style={{ padding: '20px 16px', textAlign: 'center' }}>
                                                    <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '8px', fontWeight: 800, color: 'var(--primary)' }}>
                                                        {assessmentResult?.metricResults[m.id]?.score || 0}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '40px', color: '#94a3b8', fontSize: '14px' }}>
                            @2026 AI先进技术实验室 | 128维度向量数据库+AI算法分析
                        </div>
                    </div>
                )}

                {activeTab === '结果' && (
                    <div style={{ animation: 'fadeIn 0.3s ease', display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
                        <div style={{ position: 'sticky', top: '24px' }}>
                            <div className="card" style={{
                                textAlign: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', color: '#fff', marginBottom: '24px', padding: '60px 24px', borderRadius: '24px', border: 'none'
                            }}>
                                <div style={{ fontSize: '16px', opacity: 0.8, letterSpacing: '2px' }}>企业综合投资评分</div>
                                <div style={{ fontSize: '7rem', fontWeight: 900, margin: '20px 0', textShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                                    {assessmentResult?.totalScore || 0}
                                </div>
                                <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '12px 32px', borderRadius: '30px', fontWeight: 700, fontSize: '20px' }}>
                                    评级：{assessmentResult?.grade || '待计算'}
                                </div>
                            </div>
                            <button onClick={handleExportPdf} className="btn btn-lg" style={{ background: '#10b981', color: '#fff', border: 'none', width: '100%' }} disabled={exportLoading}>
                                {exportLoading ? <span className="spinner" /> : '📄 导出 PDF 专业报告'}
                            </button>
                        </div>
                        <div className="card" style={{ padding: '32px', borderRadius: '20px' }}>
                            <h4 style={{ marginBottom: '32px', fontSize: '1.5rem', fontWeight: 800, borderLeft: '6px solid var(--primary)', paddingLeft: '16px' }}>竞争力维度分布</h4>
                            <div style={{ height: '500px' }}>
                                <Radar data={radarData} options={radarOptions} />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === '分析' && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        {!aiResult ? (
                            <div style={{ textAlign: 'center', padding: '100px', background: '#fff', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
                                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🤖</div>
                                <h3>尚未生成 AI 深度分析</h3>
                                <p style={{ color: '#64748b', marginBottom: '24px' }}>点击顶部的「AI深度分析」按钮，由 AI算法实验室 为您生成 PESTEL/4P/VRIO 专家洞察</p>
                                <button onClick={handleAiAnalyze} className="btn btn-primary" disabled={aiLoading}>
                                    {aiLoading ? <span className="spinner" /> : '立即开始 AI 分析'}
                                </button>
                            </div>
                        ) : (
                            <div className="card" style={{ padding: '40px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '24px' }}>
                                <h2 style={{ color: '#7c3aed', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span>🤖</span> AI 专家深度洞察报告
                                </h2>
                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 2, color: '#4b5563', fontSize: '16px' }}>
                                    {aiResult.content}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === '报告' && (
                    <div style={{ animation: 'fadeIn 0.3s ease', background: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <h2 style={{ fontWeight: 800 }}>📄 预览专业评估报告</h2>
                            <button onClick={handleExportPdf} className="btn btn-primary" disabled={exportLoading}>
                                {exportLoading ? <span className="spinner" /> : '⬇️ 下载 PDF'}
                            </button>
                        </div>
                        {/* 这里可以放置报告预览组件/內容，與 PDF 模版類似 */}
                        <div style={{ border: '1px solid #e2e8f0', padding: '40px', borderRadius: '8px' }}>
                            <p style={{ textAlign: 'center', color: '#64748b' }}>报告内容生成中，请导出 PDF 查看完整版本。</p>
                        </div>
                    </div>
                )}
            </div>


            {/* 隱藏的 PDF 打印模版 */}
            <div style={{ display: 'none' }}>
                <div ref={reportRef} style={{ padding: '40px', color: '#1e293b', background: '#fff', fontSize: '14px', width: '210mm' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #2563eb', paddingBottom: '20px', marginBottom: '30px' }}>
                        <div>
                            <h1 style={{ fontSize: '28px', color: '#1e3a5f', margin: 0 }}>企业出海评估深度分析报告</h1>
                            <p style={{ color: '#64748b', marginTop: '5px' }}>数据分析驱动 · AI 算法实验室赋能</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '42px', fontWeight: 900, color: '#2563eb' }}>{assessmentResult?.totalScore || 0}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>综合评分</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                        <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                            <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>🏢 企业基本信息</h3>
                            <p><strong>企业名称：</strong> {companyInfo.companyName}</p>
                            <p><strong>所属行业：</strong> {companyInfo.industry}</p>
                            <p><strong>发展阶段：</strong> {companyInfo.fundingStage}</p>
                            <p><strong>数据日期：</strong> {companyInfo.evaluationDate}</p>
                            <p><strong>评估等级：</strong> <span style={{ color: '#2563eb', fontWeight: 700 }}>{assessmentResult?.grade}</span></p>
                        </div>
                        <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center' }}>
                            <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px', textAlign: 'left' }}>📊 竞争力维度图</h3>
                            <div style={{ width: '240px', height: '180px', margin: '0 auto' }}>
                                <Radar data={radarData} options={radarOptions} />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '40px' }}>
                        <h3 style={{ color: '#1e3a5f', borderLeft: '4px solid #2563eb', paddingLeft: '15px', marginBottom: '20px' }}>📋 维度详细评分</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                            {categoriesConfig.map(cat => (
                                <div key={cat.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>{cat.name}</div>
                                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e3a5f' }}>{assessmentResult?.categoryScores[cat.id]?.score || 0}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {aiResult && (
                        <div>
                            <h3 style={{ color: '#1e3a5f', borderLeft: '4px solid #7c3aed', paddingLeft: '15px', marginBottom: '20px' }}>🤖 AI 算法实验室 专家深度洞察</h3>
                            <div style={{ padding: '25px', background: '#fff', border: '1px solid #ddd6fe', borderRadius: '12px' }}>
                                <h4 style={{ color: '#7c3aed', margin: '0 0 12px 0' }}>深度分析与执行指引</h4>
                                <p style={{ lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>{aiResult.content}</p>
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
                        AI 算法实验室 · 企業出海與投資評估分析系統自動生成 · {new Date().toLocaleDateString()}
                    </div>
                </div>
            </div>

            {/* 示例數據選擇彈窗 (1:1 原生還原) */}
            {activeDemoModal && (
                <div id="demoSelectionModal" className="demo-modal-overlay" style={{ display: 'flex' }}
                    onClick={(e) => e.target === e.currentTarget && setActiveDemoModal(false)}>
                    <div className="demo-modal">
                        <div className="demo-modal-header">
                            <h2>选择评估示例数据</h2>
                            <button className="demo-modal-close" onClick={() => setActiveDemoModal(false)}>&times;</button>
                        </div>
                        <div className="demo-modal-body">
                            <div className="demo-option-card" onClick={() => loadSelectedDemo('tech')}>
                                <div className="demo-icon">🚀</div>
                                <div className="demo-title">智创科技有限公司</div>
                                <div className="demo-desc">专注于 AI 助理终端开发的科技初创企业。代表典型的 A 轮融资阶段企业，业务增速快，技术壁垒高。</div>
                                <div className="demo-tags">
                                    <span className="demo-tag industry">科技/互联网</span>
                                    <span className="demo-tag capital">1.0 亿元资本</span>
                                </div>
                            </div>
                            <div className="demo-option-card" onClick={() => loadSelectedDemo('manufacturing')}>
                                <div className="demo-icon">🏗️</div>
                                <div className="demo-title">环球重工集团</div>
                                <div className="demo-desc">全球领先的高端装备制造集团。成熟期大型企业，资产规模大，现金流稳健，拥有复杂的全球分支机构。</div>
                                <div className="demo-tags">
                                    <span className="demo-tag industry">制造业</span>
                                    <span className="demo-tag capital">20 亿元资本</span>
                                </div>
                            </div>
                            <div className="demo-option-card" onClick={() => loadSelectedDemo('robot')}>
                                <div className="demo-icon">🤖</div>
                                <div className="demo-title">灵动机器人</div>
                                <div className="demo-desc">处于早期研发阶段的机器人组件供应商。资本规模小，核心技术尚未成熟，管理团队经验不足。</div>
                                <div className="demo-tags">
                                    <span className="demo-tag industry">制造业/机器人</span>
                                    <span className="demo-tag capital">1500 万元资本</span>
                                </div>
                            </div>
                        </div>
                        <div className="demo-modal-footer">
                            <button className="secondary" onClick={() => setActiveDemoModal(false)}>取消</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                input[type="range"]::-webkit-slider-thumb {
                    appearance: none;
                    width: 18px;
                    height: 18px;
                    background: #fff;
                    border: 3px solid var(--primary);
                    border-radius: 50%;
                    cursor: pointer;
                }
                .demo-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(4px);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .demo-modal {
                    background: white;
                    width: 90%;
                    max-width: 800px;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
                }
                .demo-modal-header {
                    padding: 20px 25px;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f8fafc;
                }
                .demo-modal-body {
                    padding: 25px;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 20px;
                }
                .demo-option-card {
                    border: 2px solid #f1f5f9;
                    border-radius: 15px;
                    padding: 20px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .demo-option-card:hover {
                    border-color: #2563eb;
                    background: #f0f7ff;
                    transform: translateY(-5px);
                }
                .demo-icon { font-size: 40px; }
                .demo-title { font-weight: 700; color: #1e3a5f; font-size: 18px; }
                .demo-desc { font-size: 13px; color: #64748b; line-height: 1.5; }
                .demo-modal-footer { padding: 15px 25px; border-top: 1px solid #eee; text-align: right; }
            `}</style>
        </div >
    )
}

export default function EvaluatePage() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px' }}><span className="spinner spinner-dark" /> 加载中...</div>}>
            <div className="container" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
                <EvaluateContent />
            </div>
        </Suspense>
    )
}
