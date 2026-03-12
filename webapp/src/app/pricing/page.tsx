'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function PricingPage() {
    const router = useRouter()
    const [currentTier, setCurrentTier] = useState<string | null>(null)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [paymentStep, setPaymentStep] = useState<'provider' | 'qr' | 'redeem'>('provider')
    const [selectedProvider, setSelectedProvider] = useState<'alipay' | 'wechat' | null>(null)
    const [redeemCode, setRedeemCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState('')

    useEffect(() => {
        fetchUsage()
    }, [])

    const fetchUsage = () => {
        fetch('/api/usage')
            .then(res => res.json())
            .then(data => {
                if (data.tier) setCurrentTier(data.tier)
            })
            .catch(() => {})
    }

    const plans = [
        {
            id: 'free',
            tier: '免费会员',
            price: '¥0',
            period: '',
            desc: '体验3个完整示例报告',
            features: ['✅ 3个示例数据查看', '✅ 完整图表展示', '❌ 自定义企业评估', '❌ AI深度分析'],
            color: '#64748b',
            btnText: '免费开始',
            link: '/register'
        },
        {
            id: 'standard',
            tier: '标准会员',
            price: '¥888',
            period: '/年',
            desc: '适合偶尔使用的用户',
            features: ['✅ 所有免费功能', '✅ 自定义企业评估', '✅ 100次/年 AI分析', '✅ 历史记录保存'],
            color: '#2563eb',
            recommended: true,
            btnText: '立即购买',
            link: '/login'
        },
        {
            id: 'premium',
            tier: '高级会员',
            price: '¥1,688',
            period: '/年',
            desc: '不限次数深度分析',
            features: ['✅ 所有标准功能', '✅ 无限次 AI分析', '✅ 优先客服支持', '✅ 数据导出'],
            color: '#d97706',
            btnText: '立即购买',
            link: '/login'
        },
    ]

    async function handleRedeem(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true); setMsg('')
        try {
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
                setTimeout(() => { setShowPaymentModal(false); setRedeemCode(''); setMsg(''); setPaymentStep('provider') }, 2000)
            } else {
                setMsg('❌ ' + data.error)
            }
        } catch (err) {
            setLoading(false)
            setMsg('❌ 网络错误，请重试')
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', color: '#fff', paddingBottom: '80px' }}>
            {/* 簡約導航 */}
            <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Link href="/" style={{ color: '#fff', fontSize: '20px', fontWeight: 700, textDecoration: 'none' }}>
                    🚀 企业出海评估系统
                </Link>
                <button onClick={() => router.back()} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                    返回
                </button>
            </nav>

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 20px' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, marginBottom: '20px' }}>选择适合您的方案</h1>
                    <p style={{ fontSize: '18px', opacity: 0.8, maxWidth: '600px', margin: '0 auto' }}>
                        解鎖 AI 算法實驗室的完整分析能力，為您的企業在全球市場博弈中獲取競爭優勢。
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                    {plans.map((p, i) => {
                        const isCurrent = currentTier === p.id
                        const btnLabel = isCurrent ? '开始使用' : p.btnText
                        
                        const handleBtnClick = (e: React.MouseEvent) => {
                            if (isCurrent) {
                                router.push('/app/evaluate')
                            } else if (p.btnText === '立即购买') {
                                e.preventDefault()
                                setPaymentStep('provider')
                                setShowPaymentModal(true)
                            }
                        }

                        return (
                            <div key={i} style={{
                                background: p.recommended ? '#fff' : 'rgba(255,255,255,0.05)',
                                borderRadius: '24px',
                                padding: '40px 32px',
                                border: p.recommended ? '3px solid #2563eb' : '1px solid rgba(255,255,255,0.1)',
                                position: 'relative',
                                boxShadow: p.recommended ? '0 20px 40px rgba(0,0,0,0.3)' : 'none',
                                transition: 'transform 0.3s ease',
                            }}>
                                {p.recommended && (
                                    <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: '#2563eb', color: '#fff', padding: '6px 20px', borderRadius: '20px', fontSize: '14px', fontWeight: 700 }}>
                                        最受歡迎
                                    </div>
                                )}

                                <div style={{ color: p.recommended ? '#1e293b' : '#fff', fontWeight: 700, fontSize: '20px', marginBottom: '12px' }}>{p.tier}</div>
                                <div style={{ color: p.color, fontSize: '48px', fontWeight: 800, marginBottom: '8px' }}>
                                    {p.price}
                                    <span style={{ fontSize: '18px', fontWeight: 400, opacity: 0.7 }}>{p.period}</span>
                                </div>
                                <p style={{ color: p.recommended ? '#64748b' : 'rgba(255,255,255,0.6)', fontSize: '15px', marginBottom: '32px', minHeight: '45px' }}>{p.desc}</p>

                                <div style={{ borderTop: `1px solid ${p.recommended ? '#f1f5f9' : 'rgba(255,255,255,0.1)'}`, paddingTop: '32px', marginBottom: '40px' }}>
                                    {p.features.map((f, j) => (
                                        <div key={j} style={{ color: p.recommended ? '#334155' : 'rgba(255,255,255,0.8)', fontSize: '15px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {f}
                                        </div>
                                    ))}
                                </div>

                                <button onClick={handleBtnClick} className="btn btn-block btn-lg" style={{
                                    background: isCurrent ? '#10b981' : (p.recommended ? '#2563eb' : 'transparent'),
                                    color: '#fff',
                                    border: (isCurrent || p.recommended) ? 'none' : '2px solid rgba(255,255,255,0.2)',
                                    fontWeight: 700,
                                    fontSize: '18px',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    width: '100%',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}>
                                    {btnLabel}
                                </button>
                            </div>
                        )
                    })}
                </div>

                {/* 支付與兌換模態視窗 */}
                {showPaymentModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '440px', padding: '40px', color: '#1e293b', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                            <button onClick={() => setShowPaymentModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
                            
                            {paymentStep === 'provider' && (
                                <div style={{ textAlign: 'center' }}>
                                    <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>选择支付方式</h2>
                                    <p style={{ color: '#64748b', marginBottom: '32px' }}>请选择您方便的支付工具完成订阅</p>
                                    <div style={{ display: 'grid', gap: '16px' }}>
                                        <button onClick={() => { setSelectedProvider('alipay'); setPaymentStep('qr') }} className="btn" style={{ background: '#f0f9ff', border: '2px solid #e0f2fe', color: '#0369a1', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontWeight: 700, fontSize: '18px' }}>
                                            <span style={{ fontSize: '24px' }}>🔹</span> 支付宝支付
                                        </button>
                                        <button onClick={() => { setSelectedProvider('wechat'); setPaymentStep('qr') }} className="btn" style={{ background: '#f0fdf4', border: '2px solid #dcfce7', color: '#15803d', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontWeight: 700, fontSize: '18px' }}>
                                            <span style={{ fontSize: '24px' }}>🔸</span> 微信支付
                                        </button>
                                    </div>
                                </div>
                            )}

                            {paymentStep === 'qr' && (
                                <div style={{ textAlign: 'center' }}>
                                    <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>掃碼進行支付</h2>
                                    <p style={{ color: '#64748b', marginBottom: '24px' }}>支付成功後點擊下方「已付款」按鈕</p>
                                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', marginBottom: '24px' }}>
                                        <img src={selectedProvider === 'alipay' ? '/icon/alipay_qr.png' : '/icon/wechat_qr.png'} alt="Payment QR" style={{ width: '100%', maxWidth: '240px', height: 'auto', margin: '0 auto', borderRadius: '12px' }} />
                                    </div>
                                    <button onClick={() => setPaymentStep('redeem')} className="btn btn-primary" style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '18px', fontWeight: 700 }}>
                                        我已付款
                                    </button>
                                    <button onClick={() => setPaymentStep('provider')} style={{ marginTop: '16px', background: 'none', border: 'none', color: '#64748b', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' }}>
                                        返回重新選擇
                                    </button>
                                </div>
                            )}

                            {paymentStep === 'redeem' && (
                                <div>
                                    <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>输入付款码</h2>
                                    <p style={{ color: '#64748b', marginBottom: '24px', textAlign: 'center' }}>請輸入您從管理員獲取的付款碼以升級訂閱</p>
                                    <form onSubmit={handleRedeem}>
                                        <input 
                                            type="text" 
                                            placeholder="請輸入付款碼 (例如: PAY-XXXX)" 
                                            value={redeemCode}
                                            onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                                            required
                                            style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '16px', marginBottom: '16px', textAlign: 'center', letterSpacing: '2px', fontWeight: 700 }}
                                        />
                                        <button disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '18px', fontWeight: 700 }}>
                                            {loading ? '正在激活...' : '立即激活订阅'}
                                        </button>
                                    </form>
                                    {msg && <div style={{ marginTop: '20px', padding: '12px', borderRadius: '8px', background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: msg.startsWith('✅') ? '#15803d' : '#991b1b', textAlign: 'center', fontWeight: 600 }}>{msg}</div>}
                                    <button onClick={() => setPaymentStep('qr')} style={{ marginTop: '16px', width: '100%', background: 'none', border: 'none', color: '#64748b', fontSize: '14px', cursor: 'pointer', textAlign: 'center' }}>
                                        返回查看二維碼
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '80px', textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>常見問題</h3>
                    <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '700px', margin: '0 auto', lineHeight: 1.8 }}>
                        付費後請聯繫管理員獲取「付款碼」，將其輸入上述激活框中即可快速生效。<br />
                        AI 算法實驗室深度分析需要您自行設置 API Key 以保證數據獨立性與隱私。
                    </p>
                </div>
            </div>


            <div style={{ textAlign: 'center', opacity: 0.5, fontSize: '14px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '40px' }}>
                © 2026 企业出海与投资评估 analysis 系统 · AI算法实验室
            </div>
        </div>
    )
}
