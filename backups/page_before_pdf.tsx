'use client'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { metrics, categoriesConfig, CategoryConfig, Metric } from '@/lib/metrics-data'
import { calculateCategoryResults, calculateFinalResult } from '@/lib/calculator'
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

    // --- 狀態管理 ---
    const [loading, setLoading] = useState(false)
    const [saveLoading, setSaveLoading] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [activeTab, setActiveTab] = useState<string>('info')
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

    // AI 分析結果存儲
    const [aiResult, setAiResult] = useState<any>(null)

    // --- 初始化加載 ---
    useEffect(() => {
        if (editId) {
            loadEvaluation(editId)
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
            // 合併數值
            const newValues = { ...values }
            ev.metric_values.forEach((mv: any) => {
                newValues[mv.metric_id] = mv.value
            })
            setValues(newValues)
            if (ev.deep_analysis) setAiResult(ev.deep_analysis)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // --- 實時計算 ---
    const results = useMemo(() => {
        const inputMetrics = metrics.map(m => ({
            ...m,
            value: values[m.id] || 0
        }))
        const catResults = calculateCategoryResults(inputMetrics)
        const final = calculateFinalResult(catResults)
        return { categories: catResults, final }
    }, [values])

    // --- 雷達圖數據 ---
    const radarData = useMemo(() => {
        return {
            labels: results.categories.map(c => c.name),
            datasets: [
                {
                    label: '維度得分',
                    data: results.categories.map(c => c.totalPoints),
                    backgroundColor: 'rgba(37, 99, 235, 0.2)',
                    borderColor: 'rgba(37, 99, 235, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(37, 99, 235, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(37, 99, 235, 1)',
                },
            ],
        }
    }, [results.categories])

    const radarOptions = {
        scales: {
            r: {
                angleLines: { display: true },
                suggestedMin: 0,
                suggestedMax: 100,
                ticks: { stepSize: 20 }
            }
        },
        plugins: {
            legend: { display: false }
        }
    }

    // --- 事件處理 ---
    const handleValueChange = (id: string, val: number) => {
        setValues(prev => ({ ...prev, [id]: val }))
    }

    async function handleSave() {
        setError(''); setSuccess(''); setSaveLoading(true)
        try {
            const res = await fetch('/api/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editId || undefined,
                    companyInfo,
                    metrics: metrics.map(m => ({ id: m.id, value: values[m.id] }))
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
        if (!editId) {
            setError('請先保存評估報告，再進行 AI 深度分析')
            return
        }
        setError(''); setAiLoading(true)
        try {
            const res = await fetch('/api/ai-analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editId })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setAiResult(data.analysis)
            setSuccess('✅ AI 深度分析完成')
            setActiveTab('analysis')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setAiLoading(false)
        }
    }

    // --- 渲染組件 ---
    if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><span className="spinner spinner-dark" /> 加載數據中...</div>

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: '24px', alignItems: 'start' }}>
            {/* 左側：編輯區 */}
            <div>
                <div className="card" style={{ marginBottom: '24px', padding: '0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    {/* 分簽導航 (滾動容器) */}
                    <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid var(--border)', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`btn`}
                            style={{
                                borderRadius: '0', padding: '16px 24px', borderBottom: activeTab === 'info' ? '3px solid var(--primary)' : 'none',
                                background: activeTab === 'info' ? '#fff' : 'transparent', color: activeTab === 'info' ? 'var(--primary)' : 'var(--text-mid)',
                                fontWeight: activeTab === 'info' ? '700' : '400', whiteSpace: 'nowrap'
                            }}
                        >
                            🏢 基本信息
                        </button>
                        {categoriesConfig.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveTab(cat.id)}
                                className={`btn`}
                                style={{
                                    borderRadius: '0', padding: '16px 20px', borderBottom: activeTab === cat.id ? '3px solid var(--primary)' : 'none',
                                    background: activeTab === cat.id ? '#fff' : 'transparent', color: activeTab === cat.id ? 'var(--primary)' : 'var(--text-mid)',
                                    fontWeight: activeTab === cat.id ? '700' : '400', whiteSpace: 'nowrap', fontSize: '14px'
                                }}
                            >
                                {cat.icon} {cat.name.length > 4 ? cat.name.slice(0, 4) : cat.name}
                            </button>
                        ))}
                        {aiResult && (
                            <button
                                onClick={() => setActiveTab('analysis')}
                                className={`btn`}
                                style={{
                                    borderRadius: '0', padding: '16px 24px', borderBottom: activeTab === 'analysis' ? '3px solid #7c3aed' : 'none',
                                    background: activeTab === 'analysis' ? '#fff' : 'transparent', color: activeTab === 'analysis' ? '#7c3aed' : 'var(--text-mid)',
                                    fontWeight: activeTab === 'analysis' ? '700' : '400', whiteSpace: 'nowrap'
                                }}
                            >
                                🤖 AI 深度報告
                            </button>
                        )}
                    </div>

                    <div style={{ padding: '32px' }}>
                        {error && <div className="alert alert-error" style={{ marginBottom: '24px' }}>{error}</div>}
                        {success && <div className="alert alert-success" style={{ marginBottom: '24px' }}>{success}</div>}

                        {/* 1. 基本信息面板 */}
                        {activeTab === 'info' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">企業名稱</label>
                                    <input type="text" className="form-input" value={companyInfo.companyName}
                                        onChange={e => setCompanyInfo({ ...companyInfo, companyName: e.target.value })} placeholder="請輸入欲評估的公司全稱" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">所屬行業</label>
                                    <select className="form-select" value={companyInfo.industry}
                                        onChange={e => setCompanyInfo({ ...companyInfo, industry: e.target.value })}>
                                        <option value="tech">科技/互聯網/AI</option>
                                        <option value="robot">機器人/智能硬件</option>
                                        <option value="healthcare">生物醫藥/醫療健康</option>
                                        <option value="finance">金融科技/保險</option>
                                        <option value="manufacturing">高端製造/新材料</option>
                                        <option value="consumer">消費零售/電子商務</option>
                                        <option value="energy">新能源/環保</option>
                                        <option value="other">其他領域</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">發展/融資階段</label>
                                    <select className="form-select" value={companyInfo.fundingStage}
                                        onChange={e => setCompanyInfo({ ...companyInfo, fundingStage: e.target.value })}>
                                        <option value="seed">種子輪 (Seed)</option>
                                        <option value="angel">天使輪 (Angel)</option>
                                        <option value="preA">Pre-A輪</option>
                                        <option value="A">A輪</option>
                                        <option value="B">B輪</option>
                                        <option value="C">C輪及以後</option>
                                        <option value="preIPO">Pre-IPO</option>
                                        <option value="listed">已上市 (Public)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">數據基準日期</label>
                                    <input type="date" className="form-input" value={companyInfo.evaluationDate}
                                        onChange={e => setCompanyInfo({ ...companyInfo, evaluationDate: e.target.value })} />
                                </div>
                            </div>
                        )}

                        {/* 2. 指標輸入面板 */}
                        {categoriesConfig.map(cat => activeTab === cat.id && (
                            <div key={cat.id}>
                                <div style={{ marginBottom: '28px', padding: '20px', background: 'var(--primary-light)', borderRadius: '12px', border: '1px solid rgba(37,99,235,0.1)' }}>
                                    <h3 style={{ color: 'var(--primary)', marginBottom: '6px', fontSize: '1.25rem' }}>{cat.icon} {cat.name}</h3>
                                    <p style={{ color: 'var(--text-mid)', fontSize: '14px', lineHeight: '1.6' }}>{cat.description}</p>
                                </div>
                                <div style={{ display: 'grid', gap: '28px' }}>
                                    {metrics.filter(m => m.category === cat.id).map(m => (
                                        <div key={m.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                <div style={{ flex: 1, paddingRight: '20px' }}>
                                                    <span style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '15px' }}>{m.name}</span>
                                                    <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>{m.description}</p>
                                                </div>
                                                <div style={{ textAlign: 'right', minWidth: '120px' }}>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        style={{ width: '85px', textAlign: 'center', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                                                        value={values[m.id]}
                                                        onChange={e => handleValueChange(m.id, parseFloat(e.target.value) || 0)}
                                                    />
                                                    <span style={{ marginLeft: '8px', fontSize: '13px', color: 'var(--text-mid)', fontWeight: 500 }}>{m.unit}</span>
                                                </div>
                                            </div>
                                            <div style={{ padding: '0 4px' }}>
                                                <input
                                                    type="range"
                                                    min={m.minValue}
                                                    max={m.maxValue}
                                                    step={(m.maxValue - m.minValue) / 100 || 0.1}
                                                    value={values[m.id]}
                                                    onChange={e => handleValueChange(m.id, parseFloat(e.target.value))}
                                                    style={{ width: '100%', height: '6px', cursor: 'pointer', appearance: 'none', background: '#e2e8f0', borderRadius: '10px' }}
                                                />
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', color: '#94a3b8', fontSize: '10px' }}>
                                                    <span>{m.minValue}</span>
                                                    <span>{m.maxValue}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* 3. AI 分析展示 */}
                        {activeTab === 'analysis' && aiResult && (
                            <div style={{ animation: 'fadeIn 0.5s ease' }}>
                                <div className="alert alert-info" style={{ marginBottom: '24px', background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
                                    🤖 <strong>DeepSeek AI 已基於 108 個維度生成深度見解</strong> ({new Date().toLocaleDateString('zh-CN')})
                                </div>

                                <div style={{ display: 'grid', gap: '24px' }}>
                                    <div style={{ background: '#f0fdf4', padding: '24px', borderRadius: '16px', border: '1px solid #bbf7d0', boxShadow: '0 2px 8px rgba(22,101,52,0.05)' }}>
                                        <h4 style={{ color: '#166534', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '1.5rem' }}>🏆</span> 企業核心優勢分析
                                        </h4>
                                        <ul style={{ paddingLeft: '24px', color: '#1a4731' }}>
                                            {aiResult.strengths?.map((s: string, i: number) => (
                                                <li key={i} style={{ marginBottom: '10px', lineHeight: '1.6' }}>{s}</li>
                                            ) || <li>暫無數據</li>)}
                                        </ul>
                                    </div>

                                    <div style={{ background: '#fef2f2', padding: '24px', borderRadius: '16px', border: '1px solid #fecaca', boxShadow: '0 2px 8px rgba(153,27,27,0.05)' }}>
                                        <h4 style={{ color: '#991b1b', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '1.5rem' }}>⚠️</span> 主要短板與潛在風險
                                        </h4>
                                        <ul style={{ paddingLeft: '24px', color: '#450a0a' }}>
                                            {aiResult.weaknesses?.map((w: string, i: number) => (
                                                <li key={i} style={{ marginBottom: '10px', lineHeight: '1.6' }}>{w}</li>
                                            ) || <li>暫無數據</li>)}
                                        </ul>
                                    </div>

                                    <div className="card" style={{ border: '1px solid #e2e8f0', background: '#fff', padding: '24px', borderRadius: '16px' }}>
                                        <h4 style={{ marginBottom: '16px', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '1.5rem' }}>💡</span> 投資價值評估與修正建議
                                        </h4>
                                        <div style={{ color: 'var(--text-mid)', lineHeight: 1.8, fontSize: '15px', whiteSpace: 'pre-wrap' }}>
                                            {aiResult.investmentSummary}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 右側：側邊欄結果展示 & 控制 */}
            <div style={{ position: 'sticky', top: '90px' }}>
                {/* 總分卡片 */}
                <div className="card" style={{
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                    color: '#fff',
                    marginBottom: '20px',
                    boxShadow: '0 10px 30px rgba(37,99,235,0.2)',
                    padding: '30px'
                }}>
                    <div style={{ fontSize: '14px', opacity: 0.9, letterSpacing: '1px' }}>綜合評估得分 / OVERALL</div>
                    <div style={{ fontSize: '5rem', fontWeight: 900, margin: '10px 0', lineHeight: 1 }}>{results.final.finalScore}</div>
                    <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: '20px', fontSize: '15px', fontWeight: 700 }}>
                        評級：{results.final.scoreGrade}
                    </div>
                    <p style={{ fontSize: '13px', marginTop: '20px', opacity: 0.9, lineHeight: 1.5, minHeight: '40px' }}>
                        {results.final.stageRecommendation}
                    </p>
                </div>

                {/* 雷達圖卡片 */}
                <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
                    <h4 style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>📊 多維度競爭力</span>
                        <span style={{ fontSize: '12px', fontWeight: 400, color: '#94a3b8' }}>100分制</span>
                    </h4>
                    <div style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Radar data={radarData} options={radarOptions} />
                    </div>
                </div>

                {/* 維度列表卡片 */}
                <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
                    <div style={{ display: 'grid', gap: '14px' }}>
                        {results.categories.map(cat => (
                            <div key={cat.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                                    <span style={{ color: 'var(--text-mid)' }}>{cat.name}</span>
                                    <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{cat.totalPoints}</span>
                                </div>
                                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        background: cat.totalPoints > 80 ? '#22c55e' : cat.totalPoints > 60 ? 'var(--primary)' : '#f59e0b',
                                        width: `${cat.totalPoints}%`,
                                        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 控制按鈕區 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <button onClick={handleSave} className="btn btn-primary btn-lg" disabled={saveLoading} style={{ boxShadow: '0 4px 12px rgba(37,99,235,0.15)' }}>
                        {saveLoading ? <span className="spinner" /> : '💾 保存評估報告'}
                    </button>

                    <button onClick={handleAiAnalyze} className="btn btn-lg" style={{ background: '#7c3aed', color: '#fff', boxShadow: '0 4px 12px rgba(124,58,237,0.15)' }} disabled={aiLoading || !editId}>
                        {aiLoading ? <span className="spinner" /> : '🤖 AI 深度分析 (DeepSeek)'}
                    </button>

                    <button onClick={() => router.push('/app/history')} className="btn btn-ghost" style={{ background: '#fff' }}>
                        📁 返回歷史記錄
                    </button>
                </div>

                {!editId && (
                    <div style={{ padding: '16px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', marginTop: '16px' }}>
                        <p style={{ color: '#92400e', fontSize: '12px', textAlign: 'center' }}>
                            ℹ️ 請先<strong>保存報告</strong>獲取 ID 後，<br />即可啟動 AI 深度分析功能
                        </p>
                    </div>
                )}
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
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
      `}</style>
        </div>
    )
}

// 主入口組件，包裹 Suspense 以支持 useSearchParams
export default function EvaluatePage() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px' }}><span className="spinner spinner-dark" /> 加載中...</div>}>
            <div className="container" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
                <EvaluateContent />
            </div>
        </Suspense>
    )
}
