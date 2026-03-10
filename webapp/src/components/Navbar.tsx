'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UsageInfo {
    tier: string
    subscriptionExpiresAt: string | null
    isExpired: boolean
    used: number
    limit: number | null
    remaining: number | null
    hasApiKey: boolean
    apiKeyVerified: boolean
}

interface NavbarProps {
    userEmail?: string
}

export default function Navbar({ userEmail }: NavbarProps) {
    const router = useRouter()
    const [dropOpen, setDropOpen] = useState(false)
    const [usage, setUsage] = useState<UsageInfo | null>(null)
    const [showApiModal, setShowApiModal] = useState(false)
    const [showRedeemModal, setShowRedeemModal] = useState(false)
    const [apiKey, setApiKey] = useState('')
    const [redeemCode, setRedeemCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState('')
    const dropRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchUsage()
        // 点击外部关闭下拉
        const handler = (e: MouseEvent) => {
            if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    async function fetchUsage() {
        const res = await fetch('/api/usage')
        if (res.ok) setUsage(await res.json())
    }

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
        router.refresh()
    }

    async function handleSaveApiKey(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true); setMsg('')
        const res = await fetch('/api/deepseek/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey }),
        })
        const data = await res.json()
        setLoading(false)
        if (res.ok) {
            setMsg('✅ ' + data.message)
            fetchUsage()
            setTimeout(() => setShowApiModal(false), 1500)
        } else {
            setMsg('❌ ' + data.error)
        }
    }

    async function handleRedeem(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true); setMsg('')
        const res = await fetch('/api/subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: redeemCode }),
        })
        const data = await res.json()
        setLoading(false)
        if (res.ok) {
            setMsg('✅ ' + data.message)
            fetchUsage()
            setTimeout(() => { setShowRedeemModal(false); setRedeemCode('') }, 2000)
        } else {
            setMsg('❌ ' + data.error)
        }
    }

    const tierLabel: Record<string, string> = { free: '免费会员', standard: '标准会员', premium: '高级会员' }
    const tierClass: Record<string, string> = { free: 'badge-free', standard: 'badge-standard', premium: 'badge-premium' }

    return (
        <>
            <nav className="navbar">
                <div className="navbar-inner">
                    <Link href="/app" className="navbar-brand">
                        🚀 <span>企业出海评估系统</span>
                    </Link>
                    <div className="navbar-nav">
                        <Link href="/app/demo" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                            示例报告
                        </Link>
                        <Link href="/pricing" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                            升级订阅
                        </Link>
                        <div className="user-dropdown" ref={dropRef}>
                            <button className="user-btn" onClick={() => setDropOpen(!dropOpen)}>
                                👤 {userEmail?.split('@')[0] || '账号'}
                                {usage && <span className={`badge ${tierClass[usage.tier]}`} style={{ fontSize: '11px', marginLeft: '4px' }}>{tierLabel[usage.tier]}</span>}
                                <span style={{ fontSize: '10px', opacity: 0.7 }}>▼</span>
                            </button>
                            <div className={`user-dropdown-menu ${dropOpen ? 'open' : ''}`}>
                                <div className="udm-email">📧 {userEmail}</div>
                                {usage && (
                                    <>
                                        <div className="udm-row">
                                            <span className="udm-label">会员等级</span>
                                            <span className={`badge ${tierClass[usage.tier]}`}>{tierLabel[usage.tier]}</span>
                                        </div>
                                        {usage.subscriptionExpiresAt && (
                                            <div className="udm-row">
                                                <span className="udm-label">到期日</span>
                                                <span className="udm-value" style={{ color: usage.isExpired ? 'var(--danger)' : 'var(--success)' }}>
                                                    {new Date(usage.subscriptionExpiresAt).toLocaleDateString('zh-CN')}
                                                    {usage.isExpired && ' (已过期)'}
                                                </span>
                                            </div>
                                        )}
                                        {usage.tier === 'standard' && (
                                            <div className="udm-row">
                                                <span className="udm-label">本年剩余次数</span>
                                                <span className="udm-value" style={{ color: (usage.remaining || 0) < 10 ? 'var(--warning)' : 'var(--success)' }}>
                                                    {usage.remaining}/100 次
                                                </span>
                                            </div>
                                        )}
                                        {usage.tier === 'premium' && (
                                            <div className="udm-row">
                                                <span className="udm-label">使用次数</span>
                                                <span className="udm-value" style={{ color: 'var(--success)' }}>无限次</span>
                                            </div>
                                        )}
                                        <div className="udm-row">
                                            <span className="udm-label">DeepSeek API Key</span>
                                            <span className="udm-value" style={{ color: usage.hasApiKey && usage.apiKeyVerified ? 'var(--success)' : 'var(--danger)' }}>
                                                {usage.hasApiKey && usage.apiKeyVerified ? '✅ 已绑定' : '❌ 未绑定'}
                                            </span>
                                        </div>
                                    </>
                                )}
                                <div className="udm-actions">
                                    <button onClick={() => { setShowApiModal(true); setDropOpen(false); setMsg('') }}
                                        className="btn btn-sm" style={{ background: '#7c3aed', color: '#fff' }}>
                                        🔑 {usage?.hasApiKey ? '修改 API Key' : '设置 API Key'}
                                    </button>
                                    <button onClick={() => { setShowRedeemModal(true); setDropOpen(false); setMsg('') }}
                                        className="btn btn-sm btn-primary">
                                        🎫 输入付款码升级
                                    </button>
                                    <button onClick={handleLogout} className="btn btn-sm" style={{ background: '#f1f5f9', color: 'var(--text-mid)' }}>
                                        退出登录
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* DeepSeek API Key 设置弹窗 */}
            {showApiModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowApiModal(false)}>
                    <div className="modal-box">
                        <h3 style={{ marginBottom: '8px' }}>🔑 设置 DeepSeek API Key</h3>
                        <p style={{ color: 'var(--text-mid)', fontSize: '13px', marginBottom: '20px' }}>
                            API Key 首次使用后加密保存，后续无需重新输入。
                            请前往 <a href="https://platform.deepseek.com" target="_blank" rel="noopener" style={{ color: 'var(--primary)' }}>platform.deepseek.com</a> 获取 Key。
                        </p>
                        {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}
                        <form onSubmit={handleSaveApiKey}>
                            <div className="form-group">
                                <label className="form-label">DeepSeek API Key</label>
                                <input type="password" className="form-input" value={apiKey}
                                    onChange={e => setApiKey(e.target.value)} placeholder="sk-xxxxxxxxxxxxxxxx" required />
                                <div className="form-hint">必须以 sk- 开头</div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                                    {loading ? <><span className="spinner" /> 验证中...</> : '验证并保存'}
                                </button>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowApiModal(false)}>取消</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 付款码兑换弹窗 */}
            {showRedeemModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowRedeemModal(false)}>
                    <div className="modal-box">
                        <h3 style={{ marginBottom: '8px' }}>🎫 输入付款码升级订阅</h3>
                        <p style={{ color: 'var(--text-mid)', fontSize: '13px', marginBottom: '20px' }}>
                            付款后请联系管理员获取付款码，输入后即可自动升级会员。
                        </p>
                        {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}
                        <form onSubmit={handleRedeem}>
                            <div className="form-group">
                                <label className="form-label">付款码</label>
                                <input type="text" className="form-input" value={redeemCode}
                                    onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                                    placeholder="如：ABCD1234EFGH" required
                                    style={{ textAlign: 'center', letterSpacing: '2px', fontWeight: 700 }} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                                    {loading ? <><span className="spinner" /> 兑换中...</> : '立即兑换'}
                                </button>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowRedeemModal(false)}>取消</button>
                            </div>
                        </form>
                        <div style={{ marginTop: '16px', padding: '12px', background: 'var(--primary-light)', borderRadius: '8px', fontSize: '13px', color: '#1e40af' }}>
                            📋 订阅方案：标准会员 ¥888/年（100次），高级会员 ¥1,688/年（无限次）
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
