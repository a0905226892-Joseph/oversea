'use client'
import { useState, useEffect, useMemo, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { metrics, categoriesConfig, CategoryConfig, Metric } from '@/lib/metrics-data'
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

    const [activeCategory, setActiveCategory] = useState<string>('team')
    const [companyInfo, setCompanyInfo] = useState({
        companyName: '',
        industry: 'tech',
        fundingStage: 'seed',
        evaluationDate: new Date().toISOString().split('T')[0]
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

    async function handleCalculate() {
        try {
            const res = await fetch('/api/assessment/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ metrics: values })
            });
            if (!res.ok) throw new Error('計算失敗');
            const data = await res.json();
            setAssessmentResult(data);
            return data;
        } catch (err: any) {
            setError('計算分數失敗: ' + err.message);
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
                    label: '維度得分',
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
            setSuccess('✅ 評估報告已成功保存')
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
                    type: 'comprehensive'
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setAiResult({ content: data.content })
            setSuccess('✅ AI 深度分析完成')
            // 自動跳轉到顯示結果的區域
            const aiReportEl = document.getElementById('ai-report-section');
            if (aiReportEl) aiReportEl.scrollIntoView({ behavior: 'smooth' });
        } catch (err: any) {
            setError(err.message)
        } finally {
            setAiLoading(false)
        }
    }

    async function handleExportPdf() {
        setExportLoading(true)
        try {
            const html2pdf = (await import('html2pdf.js')).default
            const element = reportRef.current
            if (!element) return
            const opt = {
                margin: 10,
                filename: `${companyInfo.companyName}_評估報告.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
            }
            await html2pdf().set(opt).from(element).save()
        } catch (err: any) {
            setError('PDF 導出失敗：' + err.message)
        } finally {
            setExportLoading(false)
        }
    }

    const [activeTab, setActiveTab] = useState<'指標' | '結果' | '分析' | '報告'>('指標')

    if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><span className="spinner spinner-dark" /> 加載數據中...</div>

    const integrationButtons = [
        { label: '導入稅務信息', color: '#dc2626', icon: '📋' },
        { label: '連接全球專利數據中心', color: '#2563eb', icon: '🔬' },
        { label: '對接投資機構評分系統', color: '#10b981', icon: '🏛️' },
        { label: '對接海外市場評估系統', color: '#9333ea', icon: '🌐' },
    ];

    const actionButtons = [
        { label: '企業深度信息', color: '#f59e0b', onClick: () => { } },
        { label: '計算綜合評分', color: '#3b82f6', onClick: handleCalculate },
        { label: '保存數據', color: '#94a3b8', onClick: handleSave, disabled: saveLoading || isReadOnly },
        { label: '加載數據', color: '#94a3b8', onClick: () => { } },
        { label: '載入示例數據', color: '#94a3b8', onClick: () => loadEvaluation('demo-sample') },
        { label: 'AI深度分析', color: '#a855f7', onClick: handleAiAnalyze, loading: aiLoading },
        { label: 'AI 設置', color: '#94a3b8', onClick: () => { } },
    ];

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', background: '#f8fafc', paddingBottom: '40px' }}>
            {/* 1. 頂部藍色橫幅 */}
            <div style={{
                background: 'linear-gradient(90deg, #1e40af 0%, #3b82f6 100%)',
                color: '#fff',
                padding: '40px 32px',
                borderRadius: '12px 12px 0 0',
                marginBottom: '24px'
            }}>
                <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '12px' }}>企業出海與投資評估分析系統</h1>
                <div style={{ fontSize: '15px', opacity: 0.9 }}>
                    108項指標動態評估 | AI向量數據算法分析 | 權重總和100.0% | 計分制評估
                </div>
            </div>

            {/* 2. 企業資訊輸入與集成按鈕 */}
            <div className="card" style={{ padding: '32px', marginBottom: '24px', borderRadius: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '24px' }}>
                    <div className="form-group">
                        <label className="form-label">企業名稱</label>
                        <input
                            type="text"
                            className="form-input"
                            value={companyInfo.companyName}
                            onChange={e => setCompanyInfo(p => ({ ...p, companyName: e.target.value }))}
                            placeholder="請輸入公司完整名稱"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">所屬行業</label>
                        <select
                            className="form-input"
                            value={companyInfo.industry}
                            onChange={e => setCompanyInfo(p => ({ ...p, industry: e.target.value }))}
                        >
                            <option value="tech">科技/互聯網</option>
                            <option value="manufacturing">先進製造</option>
                            <option value="consumer">大消費/品牌</option>
                            <option value="energy">新能源/環保</option>
                            <option value="biotech">生物科技/醫療</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">適合融資階段</label>
                        <select
                            className="form-input"
                            value={companyInfo.fundingStage}
                            onChange={e => setCompanyInfo(p => ({ ...p, fundingStage: e.target.value }))}
                        >
                            <option value="seed">種子/天使輪</option>
                            <option value="A輪">A輪</option>
                            <option value="B輪">B輪</option>
                            <option value="C輪+">C輪及以上</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">評估日期</label>
                        <input
                            type="date"
                            className="form-input"
                            value={companyInfo.evaluationDate}
                            onChange={e => setCompanyInfo(p => ({ ...p, evaluationDate: e.target.value }))}
                        />
                    </div>
                </div>

                {/* 四個彩色集成按鈕 */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                    {integrationButtons.map(btn => (
                        <button key={btn.label} className="btn" style={{
                            background: btn.color, color: '#fff', border: 'none',
                            padding: '12px 20px', borderRadius: '8px', fontSize: '14px',
                            display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600
                        }}>
                            <span style={{ fontSize: '18px' }}>{btn.icon}</span>
                            {btn.label}
                        </button>
                    ))}
                </div>

                {/* 核心操作按鈕組 */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {actionButtons.map(btn => (
                        <button key={btn.label} onClick={btn.onClick} disabled={btn.disabled || btn.loading}
                            className={`btn ${btn.label === '計算綜合評分' ? '' : 'btn-ghost'}`}
                            style={{
                                background: btn.label === '計算綜合評分' ? '#3b82f6' : btn.color,
                                color: '#fff',
                                padding: '10px 24px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 700,
                                border: 'none',
                                opacity: btn.disabled ? 0.6 : 1
                            }}>
                            {btn.loading ? <span className="spinner" /> : btn.label}
                        </button>
                    ))}
                </div>
                <div style={{ marginTop: '16px', fontSize: '13px', color: '#64748b', padding: '12px', background: '#f8fafc', borderRadius: '6px' }}>
                    權重調整說明：您可以手動輸入每個指標的權重值(0.1-30)，系統會自動調整其他權重以保持總和為100%。權重表示該指標在總評分中的百分比。
                </div>
            </div>

            {/* 3. 底部 4 標籤切換系統 */}
            <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '32px', background: '#fff', borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
                {['指標', '結果', '分析', '報告'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
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
                        {tab === '指標' ? '評估指標 (108項)' : tab === '結果' ? '綜合結果' : tab === '分析' ? '深度分析' : '評估報告'}
                    </button>
                ))}
            </div>

            {/* 4. 標籤內容 */}
            <div style={{ minHeight: '600px' }}>
                {activeTab === '指標' && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ padding: '0 16px 24px 16px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>企業出海與投資評估指標 (7大區塊，共108項)</h2>
                            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>請點擊下方區塊按鈕展開對應指標，為每個指標輸入數值，評分和權重可以手動調整，評分×權重=計分</p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', fontWeight: 700, color: '#1e40af' }}>
                            權重總和：<span style={{ color: 'var(--primary)', fontSize: '18px' }}>100.0</span>%
                        </div>

                        {/* 7 大維度入口卡片 (對齊截圖顏色與佈局) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '40px' }}>
                            {categoriesConfig.map((cat, idx) => {
                                const colors = [
                                    { bg: '#3b82f6', icon: '👥' }, // 團隊 - 藍
                                    { bg: '#10b981', icon: '🚀' }, // 產品 - 綠
                                    { bg: '#ef4444', icon: '📊' }, // 市場 - 紅
                                    { bg: '#f59e0b', icon: '💰' }, // 財務 - 橙
                                    { bg: '#a855f7', icon: '⚙️' }, // 運營 - 紫
                                    { bg: '#334155', icon: '🎯' }, // 戰略 - 深藍
                                    { bg: '#2dd4bf', icon: '🌱' }, // 持續 - 淺綠
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
                                            gridColumn: idx >= 5 ? 'span 1' : 'auto', // 處理最後兩個居中
                                            transform: activeCategory === cat.id ? 'scale(1.05)' : 'scale(1)'
                                        }}
                                    >
                                        <span style={{ fontSize: '32px' }}>{cfg.icon}</span>
                                        <div style={{ fontWeight: 800, fontSize: '16px' }}>{cat.name}</div>
                                        <div style={{ fontSize: '12px', opacity: 0.9 }}>{metrics.filter(m => m.category === cat.id).length}項指標 | {activeCategory === cat.id ? '20' : '15'}%權重</div>
                                    </button>
                                );
                            }).slice(0, 5)}
                        </div>
                        {/* 最後兩個卡片居中顯示 */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '40px' }}>
                            {categoriesConfig.slice(5).map((cat, idx) => {
                                const colors = [
                                    { bg: '#334155', icon: '🎯' }, // 戰略 - 深藍
                                    { bg: '#2dd4bf', icon: '🌱' }, // 持續 - 淺綠
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
                                        <div style={{ fontSize: '12px', opacity: 0.9 }}>{metrics.filter(m => m.category === cat.id).length}項指標 | 10%權重</div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* 指標表格展示區 */}
                        <div className="card" style={{ padding: '32px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #f1f5f9' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📊</div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{categoriesConfig.find(c => c.id === activeCategory)?.name} - 詳細指標</h2>
                            </div>

                            <div className="metrics-table-container">
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f8fafc' }}>
                                        <tr>
                                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#475569' }}>評估指標</th>
                                            <th style={{ padding: '16px', textAlign: 'center', width: '220px', fontSize: '13px', color: '#475569' }}>當前數值</th>
                                            <th style={{ padding: '16px', textAlign: 'center', width: '100px', fontSize: '13px', color: '#475569' }}>權重(%)</th>
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
                            @2026 AI先進技術實驗室 | 128維度向量數據庫+AI算法分析
                        </div>
                    </div>
                )}

                {activeTab === '結果' && (
                    <div style={{ animation: 'fadeIn 0.3s ease', display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
                        <div style={{ position: 'sticky', top: '24px' }}>
                            <div className="card" style={{
                                textAlign: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', color: '#fff', marginBottom: '24px', padding: '60px 24px', borderRadius: '24px', border: 'none'
                            }}>
                                <div style={{ fontSize: '16px', opacity: 0.8, letterSpacing: '2px' }}>企業綜合投資評分</div>
                                <div style={{ fontSize: '7rem', fontWeight: 900, margin: '20px 0', textShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                                    {assessmentResult?.totalScore || 0}
                                </div>
                                <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '12px 32px', borderRadius: '30px', fontWeight: 700, fontSize: '20px' }}>
                                    評級：{assessmentResult?.grade || '待計算'}
                                </div>
                            </div>
                            <button onClick={handleExportPdf} className="btn btn-lg" style={{ background: '#10b981', color: '#fff', border: 'none', width: '100%' }} disabled={exportLoading}>
                                {exportLoading ? <span className="spinner" /> : '📄 導出 PDF 專業報告'}
                            </button>
                        </div>
                        <div className="card" style={{ padding: '32px', borderRadius: '20px' }}>
                            <h4 style={{ marginBottom: '32px', fontSize: '1.5rem', fontWeight: 800, borderLeft: '6px solid var(--primary)', paddingLeft: '16px' }}>競爭力維度分布</h4>
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
                                <p style={{ color: '#64748b', marginBottom: '24px' }}>點擊頂部的「AI深度分析」按鈕，由 AI算法實驗室 為您生成 PESTEL/4P/VRIO 專家洞察</p>
                                <button onClick={handleAiAnalyze} className="btn btn-primary" disabled={aiLoading}>
                                    {aiLoading ? <span className="spinner" /> : '立即開始 AI 分析'}
                                </button>
                            </div>
                        ) : (
                            <div className="card" style={{ padding: '40px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '24px' }}>
                                <h2 style={{ color: '#7c3aed', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span>🤖</span> AI 專家深度洞察報告
                                </h2>
                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 2, color: '#4b5563', fontSize: '16px' }}>
                                    {aiResult.content}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === '報告' && (
                    <div style={{ animation: 'fadeIn 0.3s ease', background: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <h2 style={{ fontWeight: 800 }}>📄 預覽專業評估報告</h2>
                            <button onClick={handleExportPdf} className="btn btn-primary" disabled={exportLoading}>
                                {exportLoading ? <span className="spinner" /> : '⬇️ 下載 PDF'}
                            </button>
                        </div>
                        {/* 這裡可以放置報告預覽組件/內容，與 PDF 模版類似 */}
                        <div style={{ border: '1px solid #e2e8f0', padding: '40px', borderRadius: '8px' }}>
                            <p style={{ textAlign: 'center', color: '#64748b' }}>報告內容生成中，請導出 PDF 查看完整版本。</p>
                        </div>
                    </div>
                )}
            </div>


            {/* 隱藏的 PDF 打印模版 */}
            <div style={{ display: 'none' }}>
                <div ref={reportRef} style={{ padding: '40px', color: '#1e293b', background: '#fff', fontSize: '14px', width: '210mm' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #2563eb', paddingBottom: '20px', marginBottom: '30px' }}>
                        <div>
                            <h1 style={{ fontSize: '28px', color: '#1e3a5f', margin: 0 }}>企業出海評估深度分析報告</h1>
                            <p style={{ color: '#64748b', marginTop: '5px' }}>數據分析驅動 · AI 算法实验室賦能</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '42px', fontWeight: 900, color: '#2563eb' }}>{assessmentResult?.totalScore || 0}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>綜合評分</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                        <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                            <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>🏢 企業基本資訊</h3>
                            <p><strong>企業名稱：</strong> {companyInfo.companyName}</p>
                            <p><strong>所屬行業：</strong> {companyInfo.industry}</p>
                            <p><strong>發展階段：</strong> {companyInfo.fundingStage}</p>
                            <p><strong>數據日期：</strong> {companyInfo.evaluationDate}</p>
                            <p><strong>評估等級：</strong> <span style={{ color: '#2563eb', fontWeight: 700 }}>{assessmentResult?.grade}</span></p>
                        </div>
                        <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center' }}>
                            <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px', textAlign: 'left' }}>📊 競爭力維度圖</h3>
                            <div style={{ width: '240px', height: '180px', margin: '0 auto' }}>
                                <Radar data={radarData} options={radarOptions} />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '40px' }}>
                        <h3 style={{ color: '#1e3a5f', borderLeft: '4px solid #2563eb', paddingLeft: '15px', marginBottom: '20px' }}>📋 維度詳細評分</h3>
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
                            <h3 style={{ color: '#1e3a5f', borderLeft: '4px solid #7c3aed', paddingLeft: '15px', marginBottom: '20px' }}>🤖 AI 算法实验室 專家深度洞察</h3>
                            <div style={{ padding: '25px', background: '#fff', border: '1px solid #ddd6fe', borderRadius: '12px' }}>
                                <h4 style={{ color: '#7c3aed', margin: '0 0 12px 0' }}>深度分析與執行指引</h4>
                                <p style={{ lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>{aiResult.content}</p>
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
                        AI 算法实验室 · 企業出海與投資評估分析系統自動生成 · {new Date().toLocaleDateString()}
                    </div>
                </div>
            </div>

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
            `}</style>
        </div>
    )
}

export default function EvaluatePage() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px' }}><span className="spinner spinner-dark" /> 加載中...</div>}>
            <div className="container" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
                <EvaluateContent />
            </div>
        </Suspense>
    )
}
