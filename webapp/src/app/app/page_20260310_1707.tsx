import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AppHomePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_expires_at, display_name')
        .eq('id', user!.id)
        .single()

    const tier = profile?.subscription_tier || 'free'
    const isPaid = tier === 'standard' || tier === 'premium'
    const tierLabel: Record<string, string> = { free: '免费会员', standard: '标准会员', premium: '高级会员' }

    return (
        <div>
            {/* 欢迎横幅 */}
            <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', borderRadius: '16px', padding: '32px', color: '#fff', marginBottom: '28px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>
                    欢迎，{profile?.display_name || user?.email?.split('@')[0]} 👋
                </h1>
                <p style={{ opacity: 0.85, fontSize: '15px' }}>
                    当前账号：{tierLabel[tier]}
                    {profile?.subscription_expires_at && ` · 到期：${new Date(profile.subscription_expires_at).toLocaleDateString('zh-CN')}`}
                </p>
            </div>

            {/* 快捷入口 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                {[
                    {
                        href: '/app/demo', icon: '📋', title: '查看示例报告',
                        desc: '3个完整评估示例，了解系统功能',
                        color: '#7c3aed', available: true,
                    },
                    {
                        href: '/app/evaluate', icon: '🔍', title: '开始评估企业',
                        desc: '输入108项指标数据，生成评估报告',
                        color: '#2563eb', available: isPaid,
                        lockMsg: '需要标准或高级会员',
                    },
                    {
                        href: '/app/history', icon: '📁', title: '历史评估记录',
                        desc: '查看已保存的所有评估报告',
                        color: '#16a34a', available: isPaid,
                        lockMsg: '需要标准或高级会员',
                    },
                ].map((item, i) => (
                    <div key={i} className="card" style={{
                        position: 'relative', overflow: 'hidden',
                        border: `2px solid ${item.available ? item.color + '30' : 'var(--border)'}`,
                        opacity: item.available ? 1 : 0.7,
                    }}>
                        <div style={{ fontSize: '36px', marginBottom: '12px' }}>{item.icon}</div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-dark)' }}>{item.title}</h3>
                        <p style={{ color: 'var(--text-mid)', fontSize: '14px', marginBottom: '16px' }}>{item.desc}</p>
                        {item.available ? (
                            <Link href={item.href} className="btn btn-primary btn-sm" style={{ background: item.color }}>
                                进入 →
                            </Link>
                        ) : (
                            <div>
                                <span style={{ fontSize: '12px', color: 'var(--text-light)', display: 'block', marginBottom: '8px' }}>
                                    🔒 {item.lockMsg}
                                </span>
                                <Link href="/pricing" className="btn btn-sm btn-ghost">升级订阅</Link>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* 非付费用户提示 */}
            {!isPaid && (
                <div className="alert alert-info" style={{ fontSize: '15px', padding: '16px 20px' }}>
                    💡 <strong>想要使用自定义评估功能？</strong>
                    <Link href="/pricing" style={{ color: 'var(--primary)', fontWeight: 700, marginLeft: '8px' }}>
                        点击此处升级订阅 →
                    </Link>
                </div>
            )}
        </div>
    )
}
