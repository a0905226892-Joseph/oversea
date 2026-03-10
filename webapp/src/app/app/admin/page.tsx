'use client'
import { useState, useEffect } from 'react'

interface PaymentCode {
    id: string
    code: string
    subscription_tier: string
    duration_months: number
    is_used: boolean
    used_by: string | null
    used_at: string | null
    created_at: string
}

export default function AdminPage() {
    const [codes, setCodes] = useState<PaymentCode[]>([])
    const [loading, setLoading] = useState(true)
    const [genLoading, setGenLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // 生成表單狀態
    const [tier, setTier] = useState('standard')
    const [duration, setDuration] = useState(12)
    const [count, setCount] = useState(1)

    useEffect(() => {
        fetchCodes()
    }, [])

    async function fetchCodes() {
        try {
            const res = await fetch('/api/admin/payment-codes')
            if (!res.ok) throw new Error('獲取數據失敗')
            const data = await res.json()
            setCodes(data.codes || [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleGenerate(e: React.FormEvent) {
        e.preventDefault()
        setError(''); setSuccess(''); setGenLoading(true)
        try {
            const res = await fetch('/api/admin/payment-codes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier, duration, count })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setSuccess(`成功生成 ${count} 個付款碼`)
            fetchCodes()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setGenLoading(false)
        }
    }

    const getTierBadge = (tier: string) => {
        const styles: Record<string, any> = {
            standard: { bg: '#dcfce7', color: '#166534', label: '標準會員 (¥888)' },
            premium: { bg: '#fef9c3', color: '#854d0e', label: '高級會員 (¥1688)' },
            free: { bg: '#f1f5f9', color: '#475569', label: '免費' }
        }
        const s = styles[tier] || styles.free
        return <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>{s.label}</span>
    }

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>管理員控制台</h1>
                <p style={{ color: 'var(--text-mid)' }}>生成與管理系統訂閱付款碼 (Payment Codes)</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '32px', alignItems: 'start' }}>
                {/* 左側：生成表單 */}
                <div className="card" style={{ position: 'sticky', top: '100px' }}>
                    <h3 style={{ marginBottom: '20px' }}>🛠️ 生成新付款碼</h3>
                    <form onSubmit={handleGenerate}>
                        <div className="form-group">
                            <label className="form-label">訂閱等級</label>
                            <select className="form-select" value={tier} onChange={e => setTier(e.target.value)}>
                                <option value="standard">標準會員 (Standard)</option>
                                <option value="premium">高級會員 (Premium)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">有效時長 (月)</label>
                            <input type="number" className="form-input" value={duration} onChange={e => setDuration(parseInt(e.target.value))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">生成數量</label>
                            <input type="number" className="form-input" value={count} onChange={e => setCount(parseInt(e.target.value))} min="1" max="50" />
                        </div>
                        <button type="submit" className="btn btn-primary btn-block" disabled={genLoading}>
                            {genLoading ? <span className="spinner" /> : '立即批量生成'}
                        </button>
                    </form>

                    {error && <div className="alert alert-error" style={{ marginTop: '20px' }}>{error}</div>}
                    {success && <div className="alert alert-success" style={{ marginTop: '20px' }}>{success}</div>}
                </div>

                {/* 右側：列表展示 */}
                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0 }}>📋 付款碼列表</h3>
                        <button onClick={fetchCodes} className="btn btn-ghost btn-sm">刷新數據</button>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc', color: 'var(--text-mid)', fontSize: '13px', textAlign: 'left' }}>
                                <tr>
                                    <th style={{ padding: '16px 24px' }}>付款碼</th>
                                    <th style={{ padding: '16px' }}>等級 / 時長</th>
                                    <th style={{ padding: '16px' }}>狀態</th>
                                    <th style={{ padding: '16px' }}>使用者</th>
                                    <th style={{ padding: '16px 24px' }}>生成時間</th>
                                </tr>
                            </thead>
                            <tbody style={{ fontSize: '14px' }}>
                                {codes.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>暫無數據</td>
                                    </tr>
                                ) : (
                                    codes.map(c => (
                                        <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '16px 24px' }}>
                                                <code style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontWeight: 700, color: 'var(--primary)' }}>{c.code}</code>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                {getTierBadge(c.subscription_tier)}
                                                <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>{c.duration_months} 個月</div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                {c.is_used ?
                                                    <span style={{ color: '#ef4444', fontWeight: 600 }}>🔴 已使用</span> :
                                                    <span style={{ color: '#22c55e', fontWeight: 600 }}>🟢 未使用</span>
                                                }
                                            </td>
                                            <td style={{ padding: '16px', fontSize: '12px', color: 'var(--text-mid)' }}>
                                                {c.used_by || '-'}
                                                {c.used_at && <div style={{ fontSize: '10px', color: 'var(--text-light)' }}>於 {new Date(c.used_at).toLocaleDateString()}</div>}
                                            </td>
                                            <td style={{ padding: '16px 24px', color: 'var(--text-light)', fontSize: '12px' }}>
                                                {new Date(c.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
