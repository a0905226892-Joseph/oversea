'use client'
import { useState, useEffect, useMemo, Suspense, useRef } from 'react'
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
    const reportRef = useRef<HTMLDivElement>(null)
    const [isReadOnly, setIsReadOnly] = useState(false)

    // --- 狀態管理 ---
    const [loading, setLoading] = useState(false)
    const [saveLoading, setSaveLoading] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [exportLoading, setExportLoading] = useState(false)
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
            const newValues = { ...values }
            ev.metric_values.forEach((mv: any) => {
                newValues[mv.metric_id] = mv.value
            })
            setValues(newValues)
            // 判斷是否為示例數據 (Demo) - 根據 API 返回的標記或 ID
            if (data.isDemo || id.startsWith('demo-')) {
                setIsReadOnly(true)
            } else {
                setIsReadOnly(false)
            }
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
                ticks: { stepSize: 20, display: false }
            }
        },
        plugins: {
            legend: { display: false }
        },
        maintainAspectRatio: false
    }

    // --- 事件處理 ---
    const handleValueChange = (id: string, val: number) => {
        if (isReadOnly) return
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
                                🤖 AI 算法实验室報告
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
                                        readOnly={isReadOnly}
                                        onChange={e => setCompanyInfo({ ...companyInfo, companyName: e.target.value })} placeholder="請輸入欲評估的公司全稱" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">所屬行業</label>
                                    <select className="form-select" value={companyInfo.industry}
                                        disabled={isReadOnly}
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
                                        disabled={isReadOnly}
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
                                        readOnly={isReadOnly}
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
                                                        readOnly={isReadOnly}
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
                                                    disabled={isReadOnly}
                                                    onChange={e => handleValueChange(m.id, parseFloat(e.target.value))}
                                                    style={{ width: '100%', height: '6px', cursor: isReadOnly ? 'not-allowed' : 'pointer', appearance: 'none', background: '#e2e8f0', borderRadius: '10px' }}
                                                />
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
                                    🤖 <strong>AI 算法实验室 已基於 108 個維度生成深度見解</strong>
                                </div>

                                <div style={{ display: 'grid', gap: '24px' }}>
                                    <div style={{ background: '#f0fdf4', padding: '24px', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
                                        <h4 style={{ color: '#166534', marginBottom: '14px' }}>🏆 企業核心優勢</h4>
                                        <ul style={{ paddingLeft: '24px' }}>
                                            {aiResult.strengths?.map((s: string, i: number) => <li key={i} style={{ marginBottom: '10px' }}>{s}</li>)}
                                        </ul>
                                    </div>

                                    <div style={{ background: '#fef2f2', padding: '24px', borderRadius: '16px', border: '1px solid #fecaca' }}>
                                        <h4 style={{ color: '#991b1b', marginBottom: '14px' }}>⚠️ 主要短板與風險</h4>
                                        <ul style={{ paddingLeft: '24px' }}>
                                            {aiResult.weaknesses?.map((w: string, i: number) => <li key={i} style={{ marginBottom: '10px' }}>{w}</li>)}
                                        </ul>
                                    </div>

                                    <div className="card" style={{ background: '#fff', padding: '24px', borderRadius: '16px' }}>
                                        <h4 style={{ marginBottom: '16px' }}>💡 投資價值總結</h4>
                                        <div style={{ color: 'var(--text-mid)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
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
                <div className="card" style={{
                    textAlign: 'center', background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', color: '#fff', marginBottom: '20px', padding: '30px'
                }}>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>綜合評估得分</div>
                    <div style={{ fontSize: '5rem', fontWeight: 900, margin: '10px 0' }}>{results.final.finalScore}</div>
                    <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: '20px' }}>
                        評級：{results.final.scoreGrade}
                    </div>
                </div>

                <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
                    <h4 style={{ marginBottom: '15px' }}>📊 多維度競爭力</h4>
                    <div style={{ height: '240px' }}>
                        <Radar data={radarData} options={radarOptions} />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <button onClick={handleSave} className="btn btn-primary btn-lg" disabled={saveLoading || isReadOnly}>
                        {saveLoading ? <span className="spinner" /> : isReadOnly ? '🔒 示例數據不可修改' : '💾 保存評估報告'}
                    </button>

                    <button onClick={handleAiAnalyze} className="btn btn-lg" style={{ background: '#7c3aed', color: '#fff' }} disabled={aiLoading || !editId || (isReadOnly && aiResult)}>
                        {aiLoading ? <span className="spinner" /> : '🤖 AI 深度分析'}
                    </button>

                    <button onClick={handleExportPdf} className="btn btn-lg" style={{ background: '#10b981', color: '#fff' }} disabled={exportLoading || !editId}>
                        {exportLoading ? <span className="spinner" /> : '📄 導出 PDF 報表'}
                    </button>
                </div>
            </div>

            {/* 隱藏的 PDF 打印模版 */}
            <div style={{ display: 'none' }}>
                <div ref={reportRef} style={{ padding: '40px', color: '#1e293b', background: '#fff', fontSize: '14px', width: '210mm' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #2563eb', paddingBottom: '20px', marginBottom: '30px' }}>
                        <div>
                            <h1 style={{ fontSize: '28px', color: '#1e3a5f', margin: 0 }}>企業出海評估深度分析報告</h1>
                            <p style={{ color: '#64748b', marginTop: '5px' }}>數據分析驅動 · AI 深度賦能</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '42px', fontWeight: 900, color: '#2563eb' }}>{results.final.finalScore}</div>
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
                            <p><strong>評估等級：</strong> <span style={{ color: '#2563eb', fontWeight: 700 }}>{results.final.scoreGrade}</span></p>
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
                            {results.categories.map(c => (
                                <div key={c.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>{c.name}</div>
                                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e3a5f' }}>{c.totalPoints}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {aiResult && (
                        <div>
                            <h3 style={{ color: '#1e3a5f', borderLeft: '4px solid #7c3aed', paddingLeft: '15px', marginBottom: '20px' }}>🤖 AI 算法实验室 專家深度洞察</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                                <div style={{ padding: '20px', background: '#f0fdf4', borderRadius: '12px' }}>
                                    <h4 style={{ color: '#166534', margin: '0 0 10px 0' }}>優勢總結</h4>
                                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                        {aiResult.strengths?.map((s: string, i: number) => <li key={i} style={{ marginBottom: '5px' }}>{s}</li>)}
                                    </ul>
                                </div>
                                <div style={{ padding: '20px', background: '#fef2f2', borderRadius: '12px' }}>
                                    <h4 style={{ color: '#991b1b', margin: '0 0 10px 0' }}>風險預警</h4>
                                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                        {aiResult.weaknesses?.map((w: string, i: number) => <li key={i} style={{ marginBottom: '5px' }}>{w}</li>)}
                                    </ul>
                                </div>
                            </div>
                            <div style={{ padding: '25px', background: '#fff', border: '1px solid #ddd6fe', borderRadius: '12px' }}>
                                <h4 style={{ color: '#7c3aed', margin: '0 0 12px 0' }}>投資建議與執行指引</h4>
                                <p style={{ lineHeight: 1.8, margin: 0 }}>{aiResult.investmentSummary}</p>
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
                        本報告由企業出海與投資評估分析系統自動生成 · 僅供參考不作為投資依據 · {new Date().toLocaleDateString()}
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
