'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'

export default function SettingsPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState({ type: '', text: '' })

    useEffect(() => {
        // 獲取當前用戶信息
        fetchUsage()
    }, [])

    async function fetchUsage() {
        const res = await fetch('/api/usage')
        if (res.ok) {
            const data = await res.json()
            // 這裡假設後台能返回 email，如果不返回我們可以從數據庫 profile 拿，目前的 API 可能需要微調
            // 但為了演示，我們先假設有登錄狀態
        }
    }

    async function handleUpdatePassword(e: React.FormEvent) {
        e.preventDefault()
        if (password !== confirmPassword) {
            setMsg({ type: 'error', text: '兩次輸入的密碼不一致' })
            return
        }

        setLoading(true); setMsg({ type: '', text: '' })
        const res = await fetch('/api/auth/update-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        })
        const data = await res.json()
        setLoading(false)

        if (res.ok) {
            setMsg({ type: 'success', text: '✅ ' + data.message })
            setPassword('')
            setConfirmPassword('')
        } else {
            setMsg({ type: 'error', text: '❌ ' + (data.error || '更新失敗') })
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
            <Navbar />
            <div className="container" style={{ paddingTop: '100px', paddingBottom: '60px', maxWidth: '600px' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '28px', color: 'var(--text-dark)', fontWeight: 800 }}>⚙️ 個人設置</h2>
                    <p style={{ color: 'var(--text-mid)', marginTop: '8px' }}>管理您的帳號安全與偏好設置</p>
                </div>

                <div className="card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                        🔑 安全設置：設置/修改密碼
                    </h3>

                    {msg.text && (
                        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '24px' }}>
                            {msg.text}
                        </div>
                    )}

                    <form onSubmit={handleUpdatePassword}>
                        <div className="form-group">
                            <label className="form-label">新密碼</label>
                            <input
                                type="password"
                                className="form-input"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="請輸入新密碼 (至少6位)"
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">確認新密碼</label>
                            <input
                                type="password"
                                className="form-input"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="請再次輸入新密碼"
                                required
                                minLength={6}
                            />
                        </div>

                        <div style={{ marginTop: '24px', padding: '16px', background: 'var(--primary-light)', borderRadius: '8px', fontSize: '14px', color: '#1e40af', marginBottom: '24px' }}>
                            💡 <strong>為什麼要設置密碼？</strong><br />
                            設置密碼後，您可以直接憑郵箱與密碼登錄，**無需每次點擊郵件驗證碼**，登錄體驗更流暢、更快捷。
                        </div>

                        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                            {loading ? <><span className="spinner" /> 保存中...</> : '保存新密碼'}
                        </button>
                    </form>
                </div>

                <div className="card" style={{ marginTop: '24px', padding: '32px' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                        📧 帳號信息
                    </h3>
                    <p style={{ color: 'var(--text-mid)', fontSize: '14px' }}>
                        您可以通過註冊時使用的郵件地址來登錄系統。目前不支持更換郵箱。
                    </p>
                </div>
            </div>
        </div>
    )
}
