'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface EvaluationSummary {
    id: string
    company_name: string
    industry: string
    funding_stage: string
    evaluation_date: string
    created_at: string
    results: {
        finalResult: {
            finalScore: number
            scoreGrade: string
        }
    }
}

export default function HistoryPage() {
    const router = useRouter()
    const [evaluations, setEvaluations] = useState<EvaluationSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchHistory()
    }, [])

    async function fetchHistory() {
        try {
            const res = await fetch('/api/evaluate')
            if (!res.ok) throw new Error('獲取歷史記錄失敗')
            const data = await res.json()
            setEvaluations(data.evaluations || [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!confirm('確定要刪除這份評估報告嗎？此操作不可恢復。')) return

        try {
            const res = await fetch(`/api/evaluate?id=${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('刪除失敗')
            setEvaluations(prev => prev.filter(ev => ev.id !== id))
        } catch (err: any) {
            alert(err.message)
        }
    }

    const getIndustryName = (key: string) => {
        const industries: Record<string, string> = {
            tech: '科技/互聯網',
            robot: '機器人/智能硬件',
            healthcare: '醫療健康',
            finance: '金融服務',
            manufacturing: '高端製造',
            consumer: '消費零售',
            energy: '能源環保',
            other: '其他'
        }
        return industries[key] || key
    }

    if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><span className="spinner spinner-dark" /> 加載歷史記錄中...</div>

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-dark)' }}>歷史評估記錄</h1>
                    <p style={{ color: 'var(--text-mid)', marginTop: '4px' }}>查看、分析與管理您已保存的所有企業評估報告</p>
                </div>
                <Link href="/app/evaluate" className="btn btn-primary">
                    ➕ 新建評估報告
                </Link>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '24px' }}>{error}</div>}

            {evaluations.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '80px 20px', background: '#f8fafc', border: '2px dashed #e2e8f0' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📁</div>
                    <h3 style={{ color: 'var(--text-dark)' }}>暫無歷史評估記錄</h3>
                    <p style={{ color: 'var(--text-mid)', marginBottom: '24px' }}>您還沒有創建過任何評估報告，立即開始您的第一次專業評估吧！</p>
                    <Link href="/app/evaluate" className="btn btn-primary btn-lg">立即開始評估</Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {evaluations.map(ev => (
                        <Link
                            key={ev.id}
                            href={`/app/evaluate?id=${ev.id}`}
                            className="card"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 150px 100px 120px 100px',
                                alignItems: 'center',
                                padding: '20px 32px',
                                textDecoration: 'none',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                border: '1px solid transparent'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--primary-light)'
                                e.currentTarget.style.boxShadow = '0 10px 25px rgba(37,99,235,0.08)'
                                e.currentTarget.style.transform = 'translateY(-2px)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'transparent'
                                e.currentTarget.style.boxShadow = 'var(--shadow)'
                                e.currentTarget.style.transform = 'translateY(0)'
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-dark)' }}>{ev.company_name}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '4px' }}>ID: {ev.id.slice(0, 8)}...</div>
                            </div>

                            <div style={{ color: 'var(--text-mid)', fontSize: '14px' }}>
                                {getIndustryName(ev.industry)}
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <span style={{
                                    background: 'var(--primary-light)',
                                    color: 'var(--primary)',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 700
                                }}>
                                    {ev.results?.finalResult?.scoreGrade || 'N/A'}
                                </span>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>
                                    {ev.results?.finalResult?.finalScore || 0}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '-4px' }}>綜合得分</div>
                            </div>

                            <div style={{ textAlign: 'right', color: 'var(--text-light)', fontSize: '12px' }}>
                                {new Date(ev.evaluation_date).toLocaleDateString()}
                                <div style={{ marginTop: '8px' }}>
                                    <button
                                        onClick={(e) => handleDelete(ev.id, e)}
                                        className="btn-trash"
                                        style={{
                                            background: 'none', border: 'none', color: '#ef4444',
                                            cursor: 'pointer', padding: '5px', borderRadius: '4px',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                        title="刪除"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <style jsx>{`
        .btn-trash:hover {
          color: #dc2626;
        }
      `}</style>
        </div>
    )
}
