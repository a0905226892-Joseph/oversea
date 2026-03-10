'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
    const router = useRouter()
    const [step, setStep] = useState<'form' | 'otp'>('form')
    const [email, setEmail] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault()
        setError(''); setLoading(true)
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, displayName }),
        })
        const data = await res.json()
        setLoading(false)
        if (!res.ok) { setError(data.error); return }
        setSuccess('验证码已发送，请查看邮箱')
        setStep('otp')
    }

    async function handleVerify(e: React.FormEvent) {
        e.preventDefault()
        setError(''); setLoading(true)
        const res = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, token: otp, type: 'signup' }),
        })
        const data = await res.json()
        setLoading(false)
        if (!res.ok) { setError(data.error); return }
        router.push('/app')
        router.refresh()
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Link href="/" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-dark)', textDecoration: 'none' }}>
                        🚀 企业出海评估系统
                    </Link>
                    <p style={{ color: 'var(--text-mid)', marginTop: '8px' }}>创建免费账号</p>
                </div>

                <div className="card">
                    {error && <div className="alert alert-error">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    {step === 'form' ? (
                        <form onSubmit={handleRegister}>
                            <div className="form-group">
                                <label className="form-label">姓名（选填）</label>
                                <input type="text" className="form-input" value={displayName}
                                    onChange={e => setDisplayName(e.target.value)} placeholder="请输入您的姓名" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">邮箱地址</label>
                                <input type="email" className="form-input" value={email}
                                    onChange={e => setEmail(e.target.value)} placeholder="请输入邮箱" required autoFocus />
                                <div className="form-hint">注册成功后可使用邮箱验证码登录，无需记住密码</div>
                            </div>
                            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                                {loading ? <><span className="spinner" /> 发送中...</> : '发送验证码注册'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerify}>
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <div style={{ fontSize: '40px', marginBottom: '8px' }}>📧</div>
                                <p style={{ color: 'var(--text-mid)' }}>验证码已发送至</p>
                                <p style={{ fontWeight: 700 }}>{email}</p>
                            </div>
                            <div className="form-group">
                                <label className="form-label">输入6位验证码</label>
                                <input type="text" className="form-input" value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000" maxLength={6} required autoFocus
                                    style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading || otp.length !== 6}>
                                {loading ? <><span className="spinner" /> 注册中...</> : '完成注册'}
                            </button>
                            <button type="button" onClick={() => { setStep('form'); setError(''); setSuccess('') }}
                                style={{ width: '100%', marginTop: '12px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '14px' }}>
                                ← 重新输入邮箱
                            </button>
                        </form>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)', fontSize: '14px', color: 'var(--text-mid)' }}>
                        已有账号？<Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>立即登录</Link>
                    </div>
                </div>

                {/* 免费功能说明 */}
                <div className="card" style={{ marginTop: '16px', background: 'var(--primary-light)', boxShadow: 'none' }}>
                    <p style={{ color: '#1e40af', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>🎁 免费账号包含：</p>
                    <ul style={{ color: '#1e40af', fontSize: '13px', paddingLeft: '18px', lineHeight: 2 }}>
                        <li>3个完整示例评估报告查看</li>
                        <li>注册即可使用，无需信用卡</li>
                        <li>随时可升级为付费会员</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
