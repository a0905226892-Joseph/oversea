'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const router = useRouter()
    const [step, setStep] = useState<'email' | 'otp'>('email')
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // 第一步：发送验证码
    async function handleSendOtp(e: React.FormEvent) {
        e.preventDefault()
        setError(''); setLoading(true)
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        })
        const data = await res.json()
        setLoading(false)
        if (!res.ok) { setError(data.error); return }
        setSuccess('验证码已发送，请查看邮箱（可能在垃圾邮件中）')
        setStep('otp')
    }

    // 第二步：验证 OTP
    async function handleVerifyOtp(e: React.FormEvent) {
        e.preventDefault()
        setError(''); setLoading(true)
        const res = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, token: otp, type: 'email' }),
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
                    <p style={{ color: 'var(--text-mid)', marginTop: '8px' }}>登录到您的账号</p>
                </div>

                <div className="card">
                    {error && <div className="alert alert-error">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    {step === 'email' ? (
                        <form onSubmit={handleSendOtp}>
                            <div className="form-group">
                                <label className="form-label">邮箱地址</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="请输入注册邮箱"
                                    required
                                    autoFocus
                                />
                                <div className="form-hint">系统将向您的邮箱发送6位验证码</div>
                            </div>
                            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                                {loading ? <><span className="spinner" /> 发送中...</> : '发送验证码'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp}>
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <div style={{ fontSize: '40px', marginBottom: '8px' }}>📧</div>
                                <p style={{ color: 'var(--text-mid)' }}>验证码已发送至</p>
                                <p style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{email}</p>
                            </div>
                            <div className="form-group">
                                <label className="form-label">输入6位验证码</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                    autoFocus
                                    style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading || otp.length !== 6}>
                                {loading ? <><span className="spinner" /> 验证中...</> : '确认登录'}
                            </button>
                            <button type="button" onClick={() => { setStep('email'); setError(''); setSuccess('') }}
                                style={{ width: '100%', marginTop: '12px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '14px' }}>
                                ← 重新输入邮箱
                            </button>
                        </form>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)', fontSize: '14px', color: 'var(--text-mid)' }}>
                        还没有账号？<Link href="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>立即注册</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
