'use client'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #2563eb 100%)' }}>
      {/* 顶部导航 */}
      <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#fff', fontSize: '20px', fontWeight: 700 }}>
          🚀 企业出海评估系统
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/login" className="btn btn-ghost" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}>
            登录
          </Link>
          <Link href="/register" className="btn btn-primary" style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.5)' }}>
            免费注册
          </Link>
        </div>
      </nav>

      {/* 主 Hero 区 */}
      <div style={{ textAlign: 'center', padding: '80px 20px 60px', color: '#fff' }}>
        <div style={{ fontSize: '14px', background: 'rgba(255,255,255,0.15)', display: 'inline-block', padding: '6px 16px', borderRadius: '20px', marginBottom: '24px' }}>
          🎯 专为中国企业出海设计
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, marginBottom: '20px', lineHeight: 1.2 }}>
          企业出海与投资<br />评估分析系统
        </h1>
        <p style={{ fontSize: '18px', opacity: 0.85, maxWidth: '600px', margin: '0 auto 40px', lineHeight: 1.8 }}>
          108项指标动态评估 · AI向量数据算法分析 · DeepSeek AI深度分析
          <br />帮助企业客观评估出海潜力与投资价值
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" className="btn btn-lg" style={{ background: '#2563eb', color: '#fff', boxShadow: '0 8px 30px rgba(37,99,235,0.4)' }}>
            免费开始使用
          </Link>
          <Link href="/app/demo" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '2px solid rgba(255,255,255,0.4)' }}>
            查看示例报告
          </Link>
        </div>
      </div>

      {/* 功能特点 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          {[
            { icon: '📊', title: '108项全面评估', desc: '7大维度（团队/产品/市场/财务/运营/战略/可持续性），权重可灵活调整' },
            { icon: '🤖', title: 'DeepSeek AI分析', desc: 'PESTEL、4P、VRIO深度分析，生成SWOT矩阵与专业投资建议' },
            { icon: '📈', title: '可视化图表', desc: '雷达图、柱状图直观呈现核心优势与短板，支持PDF导出' },
            { icon: '🔒', title: '数据安全', desc: 'Supabase数据库存储，评估历史随时查阅，API Key加密保存' },
          ].map((f, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '28px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ fontSize: '36px', marginBottom: '14px' }}>{f.icon}</div>
              <div style={{ color: '#fff', fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>{f.title}</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 定价方案 */}
      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '60px 20px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ color: '#fff', textAlign: 'center', fontSize: '2rem', marginBottom: '40px', fontWeight: 700 }}>
            简单透明的定价
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {[
              { tier: '免费会员', price: '¥0', period: '', desc: '体验3个完整示例报告', features: ['✅ 3个示例数据查看', '✅ 完整图表展示', '❌ 自定义企业评估', '❌ AI深度分析'], color: '#64748b' },
              { tier: '标准会员', price: '¥888', period: '/年', desc: '适合偶尔使用的用户', features: ['✅ 所有免费功能', '✅ 自定义企业评估', '✅ 100次/年 AI分析', '✅ 历史记录保存'], color: '#2563eb' },
              { tier: '高级会员', price: '¥1,688', period: '/年', desc: '不限次数深度分析', features: ['✅ 所有标准功能', '✅ 无限次 AI分析', '✅ 优先客服支持', '✅ 数据导出'], color: '#d97706' },
            ].map((p, i) => (
              <div key={i} style={{ background: i === 1 ? '#fff' : 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '28px', border: i === 1 ? '2px solid #2563eb' : '1px solid rgba(255,255,255,0.2)', position: 'relative' }}>
                {i === 1 && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#2563eb', color: '#fff', padding: '4px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>推荐</div>}
                <div style={{ color: i === 1 ? '#1e293b' : '#fff', fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>{p.tier}</div>
                <div style={{ color: p.color, fontSize: '36px', fontWeight: 800 }}>{p.price}<span style={{ fontSize: '16px', fontWeight: 400 }}>{p.period}</span></div>
                <div style={{ color: i === 1 ? '#64748b' : 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '20px' }}>{p.desc}</div>
                {p.features.map((f, j) => (
                  <div key={j} style={{ color: i === 1 ? '#374151' : 'rgba(255,255,255,0.85)', fontSize: '14px', marginBottom: '8px' }}>{f}</div>
                ))}
                <Link href="/register" className="btn btn-block" style={{ marginTop: '20px', background: i === 1 ? '#2563eb' : 'rgba(255,255,255,0.2)', color: '#fff', border: i !== 1 ? '1px solid rgba(255,255,255,0.4)' : 'none' }}>
                  {i === 0 ? '免费开始' : '立即购买'}
                </Link>
              </div>
            ))}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
            付费后联系管理员获取付款码激活订阅 · DeepSeek API Key需自行申请
          </p>
        </div>
      </div>

      <div className="page-footer" style={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.1)' }}>
        © 2026 企业出海与投资评估分析系统 · AI先进技术实验室
      </div>
    </div>
  )
}
