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

    if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><span className="spinner spinner-dark" /> 加載數據中...</div>

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: '#fff', padding: '20px 32px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>
                        {companyInfo.companyName || '企業評估中...'}
                    </h1>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                        <span>行业: {companyInfo.industry}</span>
                        <span>阶段: {companyInfo.fundingStage}</span>
                        <span>日期: {companyInfo.evaluationDate}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={handleCalculate} className="btn" style={{ background: '#f1f5f9', color: '#475569' }}>
                        🔄 重新計算得分
                    </button>
                    <button onClick={handleSave} className="btn btn-primary" disabled={saveLoading || isReadOnly}>
                        {saveLoading ? <span className="spinner" /> : isReadOnly ? '🔒 示例不可修改' : '💾 保存評估'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '24px', alignItems: 'start' }}>
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', marginBottom: '24px' }}>
                        {categoriesConfig.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                    padding: '16px 8px', borderRadius: '12px', transition: 'all 0.2s',
                                    background: activeCategory === cat.id ? 'var(--primary)' : '#fff',
                                    color: activeCategory === cat.id ? '#fff' : '#475569',
                                    boxShadow: activeCategory === cat.id ? '0 10px 20px rgba(37,99,235,0.2)' : '0 4px 6px rgba(0,0,0,0.02)',
                                    border: activeCategory === cat.id ? 'none' : '1px solid #e2e8f0',
                                    cursor: 'pointer'
                                }}
                            >
                                <span style={{ fontSize: '24px' }}>{cat.icon}</span>
                                <span style={{ fontSize: '12px', fontWeight: 700, textAlign: 'center' }}>{cat.name.slice(0, 4)}</span>
                            </button>
                        ))}
                    </div>

                    <div className="card" style={{ padding: '32px', minHeight: '600px' }}>
                        {error && <div className="alert alert-error" style={{ marginBottom: '24px' }}>{error}</div>}
                        {success && <div className="alert alert-success" style={{ marginBottom: '24px' }}>{success}</div>}

                        {categoriesConfig.map(cat => activeCategory === cat.id && (
                            <div key={cat.id} style={{ animation: 'fadeIn 0.3s ease' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #f1f5f9' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{cat.icon}</div>
                                    <div>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{cat.name}</h2>
                                        <p style={{ color: '#64748b', fontSize: '14px' }}>{cat.description}</p>
                                    </div>
                                </div>

                                <div className="metrics-table-container" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead style={{ background: '#f8fafc' }}>
                                            <tr>
                                                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#475569' }}>評估指標</th>
                                                <th style={{ padding: '16px', textAlign: 'center', width: '200px', fontSize: '13px', color: '#475569' }}>當前數值</th>
                                                <th style={{ padding: '16px', textAlign: 'center', width: '100px', fontSize: '13px', color: '#475569' }}>原始得分</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {metrics.filter(m => m.category === cat.id).map(m => (
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
                        ))}
                    </div>
                </div>

                <div style={{ position: 'sticky', top: '24px' }}>
                    <div className="card" style={{
                        textAlign: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', color: '#fff', marginBottom: '24px', padding: '40px 24px', borderRadius: '24px', border: 'none'
                    }}>
                        <div style={{ fontSize: '14px', opacity: 0.8, letterSpacing: '2px' }}>企業綜合投資評分</div>
                        <div style={{ fontSize: '6rem', fontWeight: 900, margin: '10px 0', textShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                            {assessmentResult?.totalScore || 0}
                        </div>
                        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', padding: '8px 24px', borderRadius: '30px', fontWeight: 700, backdropFilter: 'blur(5px)' }}>
                            評級：{assessmentResult?.grade || '待計算'}
                        </div>
                    </div>

                    <div className="card" style={{ marginBottom: '24px', padding: '24px', borderRadius: '20px' }}>
                        <h4 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 800, borderLeft: '4px solid var(--primary)', paddingLeft: '12px' }}>競爭力維度分布</h4>
                        <div style={{ height: '280px' }}>
                            <Radar data={radarData} options={radarOptions} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '12px' }}>
                        <button onClick={handleAiAnalyze} className="btn btn-lg" style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7)', color: '#fff', border: 'none', boxShadow: '0 10px 20px rgba(124,58,237,0.3)' }} disabled={aiLoading}>
                            {aiLoading ? <span className="spinner" /> : '🤖 AI 深度分析 (PESTEL/4P)'}
                        </button>
                        <button onClick={handleExportPdf} className="btn btn-lg" style={{ background: '#10b981', color: '#fff', border: 'none' }} disabled={exportLoading}>
                            {exportLoading ? <span className="spinner" /> : '📄 導出 PDF 專業報告'}
                        </button>
                    </div>
                </div>
            </div>

            {aiResult && (
                <div id="ai-report-section" className="card" style={{ marginTop: '24px', padding: '40px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '24px' }}>
                    <h2 style={{ color: '#7c3aed', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span>🤖</span> AI 算法实验室 - 專家深度洞察報告
                    </h2>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 2, color: '#4b5563', fontSize: '16px' }}>
                        {aiResult.content}
                    </div>
                </div>
            )}

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
