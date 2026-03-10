'use client'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { metrics, categoriesConfig, CategoryConfig, Metric } from '@/lib/metrics-data'
import { calculateCategoryResults, calculateFinalResult } from '@/lib/calculator'

// 封裝成組件以支持 useSearchParams
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
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '24px', alignItems: 'start' }}>
            {/* 左側：編輯區 */}
            <div>
                <div className="card" style={{ marginBottom: '24px', padding: '0', overflow: 'hidden' }}>
                    {/* 分簽導航 */}
                    <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`btn`}
                            style={{
                                flex: 1, borderRadius: '0', padding: '16px', borderBottom: activeTab === 'info' ? '3px solid var(--primary)' : 'none',
                                background: activeTab === 'info' ? '#fff' : 'transparent', color: activeTab === 'info' ? 'var(--primary)' : 'var(--text-mid)',
                                fontWeight: activeTab === 'info' ? '700' : '400'
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
                                    flex: 1, borderRadius: '0', padding: '16px', borderBottom: activeTab === cat.id ? '3px solid var(--primary)' : 'none',
                                    background: activeTab === cat.id ? '#fff' : 'transparent', color: activeTab === cat.id ? 'var(--primary)' : 'var(--text-mid)',
                                    fontWeight: activeTab === cat.id ? '700' : '400', fontSize: '14px'
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
                                    flex: 1, borderRadius: '0', padding: '16px', borderBottom: activeTab === 'analysis' ? '3px solid #7c3aed' : 'none',
                                    background: activeTab === 'analysis' ? '#fff' : 'transparent', color: activeTab === 'analysis' ? '#7c3aed' : 'var(--text-mid)',
                                    fontWeight: activeTab === 'analysis' ? '700' : '400'
                                }}
                            >
                                🤖 AI分析
                            </button>
                        )}
                    </div>

                    <div style={{ padding: '32px' }}>
                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}

                        {/* 1. 基本信息面板 */}
                        {activeTab === 'info' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">企業名稱</label>
                                    <input type="text" className="form-input" value={companyInfo.companyName}
                                        onChange={e => setCompanyInfo({ ...companyInfo, companyName: e.target.value })} placeholder="請輸入完整的公司名稱" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">所屬行業</label>
                                    <select className="form-select" value={companyInfo.industry}
                                        onChange={e => setCompanyInfo({ ...companyInfo, industry: e.target.value })}>
                                        <option value="tech">科技/互聯網</option>
                                        <option value="robot">機器人/智能硬件</option>
                                        <option value="healthcare">醫療健康</option>
                                        <option value="finance">金融服務</option>
                                        <option value="manufacturing">製造業</option>
                                        <option value="consumer">消費零售</option>
                                        <option value="energy">能源環保</option>
                                        <option value="other">其他</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">融資階段</label>
                                    <select className="form-select" value={companyInfo.fundingStage}
                                        onChange={e => setCompanyInfo({ ...companyInfo, fundingStage: e.target.value })}>
                                        <option value="seed">種子輪</option>
                                        <option value="angel">天使輪</option>
                                        <option value="preA">Pre-A輪</option>
                                        <option value="A">A輪</option>
                                        <option value="B">B輪</option>
                                        <option value="C">C輪及以後</option>
                                        <option value="preIPO">Pre-IPO</option>
                                        <option value="listed">已上市</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">評估日期</label>
                                    <input type="date" className="form-input" value={companyInfo.evaluationDate}
                                        onChange={e => setCompanyInfo({ ...companyInfo, evaluationDate: e.target.value })} />
                                </div>
                            </div>
                        )}

                        {/* 2. 指標輸入面板 */}
                        {categoriesConfig.map(cat => activeTab === cat.id && (
                            <div key={cat.id}>
                                <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--primary-light)', borderRadius: '10px' }}>
                                    <h3 style={{ color: 'var(--primary)', marginBottom: '4px' }}>{cat.icon} {cat.name}</h3>
                                    <p style={{ color: 'var(--text-mid)', fontSize: '14px' }}>{cat.description}</p>
                                </div>
                                <div style={{ display: 'grid', gap: '24px' }}>
                                    {metrics.filter(m => m.category === cat.id).map(m => (
                                        <div key={m.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                <div>
                                                    <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{m.name}</span>
                                                    <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '2px' }}>{m.description}</p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        style={{ width: '100px', textAlign: 'center', padding: '6px' }}
                                                        value={values[m.id]}
                                                        onChange={e => handleValueChange(m.id, parseFloat(e.target.value) || 0)}
                                                    />
                                                    <span style={{ marginLeft: '8px', fontSize: '14px', color: 'var(--text-mid)' }}>{m.unit}</span>
                                                </div>
                                            </div>
                                            <input
                                                type="range"
                                                min={m.minValue}
                                                max={m.maxValue}
                                                step={(m.maxValue - m.minValue) / 20}
                                                value={values[m.id]}
                                                onChange={e => handleValueChange(m.id, parseFloat(e.target.value))}
                                                style={{ width: '100%', height: '6px', accentColor: 'var(--primary)' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* 3. AI 分析展示 */}
                        {activeTab === 'analysis' && aiResult && (
                            <div>
                                <div className="alert alert-info">🤖 DeepSeek AI 深度分析完成日期：{new Date().toLocaleDateString('zh-CN')}</div>
                                <div style={{ display: 'grid', gap: '20px' }}>
                                    <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                                        <h4 style={{ color: '#166534', marginBottom: '10px' }}>🏆 核心競爭力</h4>
                                        <ul style={{ paddingLeft: '20px' }}>
                                            {aiResult.strengths?.map((s: string, i: number) => <li key={i} style={{ marginBottom: '6px' }}>{s}</li>)}
                                        </ul>
                                    </div>
                                    <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                                        <h4 style={{ color: '#991b1b', marginBottom: '10px' }}>⚠️ 主要短板與風險</h4>
                                        <ul style={{ paddingLeft: '20px' }}>
                                            {aiResult.weaknesses?.map((w: string, i: number) => <li key={i} style={{ marginBottom: '6px' }}>{w}</li>)}
                                        </ul>
                                    </div>
                                    <div className="card" style={{ border: 'none', background: '#f8fafc' }}>
                                        <h4 style={{ marginBottom: '12px' }}>💡 投資建議摘要</h4>
                                        <p style={{ lineHeight: 1.8 }}>{aiResult.investmentSummary}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 右側：側邊欄結果展示 & 控制 */}
            <div style={{ position: 'sticky', top: '90px' }}>
                <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', color: '#fff', marginBottom: '20px' }}>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>綜合評估得分</div>
                    <div style={{ fontSize: '4rem', fontWeight: 800, margin: '10px 0' }}>{results.final.finalScore}</div>
                    <div style={{ fontSize: '18px', fontWeight: 700 }}>等級：{results.final.scoreGrade}</div>
                    <div style={{ fontSize: '13px', marginTop: '12px', opacity: 0.9 }}>{results.final.stageRecommendation}</div>
                </div>

                <div className="card" style={{ marginBottom: '20px' }}>
                    <h4 style={{ marginBottom: '16px' }}>📊 維度得分</h4>
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {results.categories.map(cat => (
                            <div key={cat.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                                    <span>{cat.name}</span>
                                    <span style={{ fontWeight: 700 }}>{cat.totalPoints} / 100</span>
                                </div>
                                <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', background: 'var(--primary)', width: `${cat.totalPoints}%`,
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button onClick={handleSave} className="btn btn-primary btn-lg" disabled={saveLoading}>
                        {saveLoading ? <span className="spinner" /> : '💾 保存評估報告'}
                    </button>

                    <button onClick={handleAiAnalyze} className="btn btn-lg" style={{ background: '#7c3aed', color: '#fff' }} disabled={aiLoading || !editId}>
                        {aiLoading ? <span className="spinner" /> : '🤖 AI 深度分析'}
                    </button>

                    <button onClick={() => router.push('/app/history')} className="btn btn-ghost">
                        📁 返回歷史記錄
                    </button>
                </div>

                {!editId && (
                    <p style={{ color: 'var(--text-light)', fontSize: '12px', marginTop: '12px', textAlign: 'center' }}>
                        * 首次保存後即可啟動 AI 深度分析
                    </p>
                )}
            </div>
        </div>
    )
}

// 主入口組件，包裹 Suspense 以支持 useSearchParams
export default function EvaluatePage() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px' }}><span className="spinner spinner-dark" /> 加載中...</div>}>
            <EvaluateContent />
        </Suspense>
    )
}
