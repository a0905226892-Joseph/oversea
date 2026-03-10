'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function PricingPage() {
    const router = useRouter()

    const plans = [
        {
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
            tier: '高级会员',
            price: '¥1,688',
            period: '/年',
            desc: '不限次数深度分析',
            features: ['✅ 所有标准功能', '✅ 无限次 AI分析', '✅ 优先客服支持', '✅ 数据导出'],
            color: '#d97706',
            btnText: '联系获取',
            link: '/login'
        },
    ]

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
                    {plans.map((p, i) => (
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

                            <Link href={p.link} className="btn btn-block btn-lg" style={{
                                background: p.recommended ? '#2563eb' : 'transparent',
                                color: p.recommended ? '#fff' : '#fff',
                                border: p.recommended ? 'none' : '2px solid rgba(255,255,255,0.2)',
                                fontWeight: 700,
                                fontSize: '18px',
                                borderRadius: '12px',
                                padding: '16px'
                            }}>
                                {p.btnText}
                            </Link>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '80px', textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>常見問題</h3>
                    <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '700px', margin: '0 auto', lineHeight: 1.8 }}>
                        付費後請聯繫管理員獲取「付款碼」，在您的帳號設置中輸入即可快速激活訂閱。<br />
                        AI 算法實驗室深度分析需要您自行設置 API Key 以保證數據獨立性與隱私。
                    </p>
                </div>
            </div>

            <div style={{ textAlign: 'center', opacity: 0.5, fontSize: '14px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '40px' }}>
                © 2026 企业出海与投资评估分析系统 · AI算法实验室
            </div>
        </div>
    )
}
