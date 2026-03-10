'use client'
import { useState, useEffect } from 'react'

interface Demo {
    id: string
    name: string
    description: string
    icon: string
    companyInfo: any
    results: any
    deepAnalysis: any
}

export default function DemoPage() {
    const [demos, setDemos] = useState<Demo[]>([])
    const [selected, setSelected] = useState<Demo | null>(null)
    const [loading, setLoading] = useState(false)

    const demoList = [
        { id: '1', name: '科技独角兽示例', desc: 'AI+SaaS科技企业，A轮融资阶段', icon: '🤖', score: 82 },
        { id: '2', name: '智能制造示例', desc: '工业机器人，Pre-B轮阶段', icon: '🏭', score: 71 },
        { id: '3', name: '消费品牌示例', desc: '国潮健康食品，天使轮阶段', icon: '🛍️', score: 58 },
    ]

    async function loadDemo(id: string) {
        setLoading(true)
        const res = await fetch(`/api/demo/${id}`)
        const data = await res.json()
        setLoading(false)
        if (res.ok) setSelected(data.demo)
    }

    const scoreColor = (s: number) => s >= 80 ? '#16a34a' : s >= 70 ? '#2563eb' : s >= 60 ? '#d97706' : '#dc2626'

    return (
        <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }}>📋 示例评估报告</h2>
            <p style={{ color: 'var(--text-mid)', marginBottom: '28px' }}>
                以下为3个真实演示案例，展示完整的企业评估报告。免费会员可查看全部内容。
            </p>

            {/* 示例选择卡片 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {demoList.map(d => (
                    <button key={d.id} onClick={() => loadDemo(d.id)}
                        style={{
                            background: selected?.id === d.id ? 'var(--primary-light)' : '#fff',
                            border: selected?.id === d.id ? '2px solid var(--primary)' : '2px solid var(--border)',
                            borderRadius: '12px', padding: '20px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                        }}>
                        <div style={{ fontSize: '32px', marginBottom: '10px' }}>{d.icon}</div>
                        <div style={{ fontWeight: 700, marginBottom: '4px' }}>{d.name}</div>
                        <div style={{ color: 'var(--text-mid)', fontSize: '13px', marginBottom: '12px' }}>{d.desc}</div>
                        <div style={{ display: 'inline-block', background: scoreColor(d.score) + '15', color: scoreColor(d.score), padding: '4px 12px', borderRadius: '20px', fontWeight: 700 }}>
                            综合得分：{d.score}分
                        </div>
                    </button>
                ))}
            </div>

            {loading && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-mid)' }}><span className="spinner spinner-dark" /> 加载中...</div>}

            {/* 示例报告详情 */}
            {selected && !loading && (
                <div>
                    {/* 基本信息 */}
                    <div className="card" style={{ marginBottom: '20px', borderTop: '4px solid var(--primary)' }}>
                        <h3 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>{selected.icon} {selected.name}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                            {[
                                { label: '企业名称', value: selected.companyInfo.companyName },
                                { label: '所属行业', value: selected.companyInfo.industry },
                                { label: '融资阶段', value: selected.companyInfo.fundingStage },
                            ].map((item, i) => (
                                <div key={i} style={{ background: 'var(--bg-page)', padding: '12px', borderRadius: '8px' }}>
                                    <div style={{ color: 'var(--text-light)', fontSize: '12px', marginBottom: '4px' }}>{item.label}</div>
                                    <div style={{ fontWeight: 700 }}>{item.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 综合评分 */}
                    <div className="card" style={{ marginBottom: '20px', textAlign: 'center', background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', color: '#fff' }}>
                        <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>企业综合投资评分</div>
                        <div style={{ fontSize: '5rem', fontWeight: 800, margin: '10px 0' }}>{selected.results.finalScore}</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px' }}>{selected.results.scoreGrade}</div>
                        <div style={{ opacity: 0.85 }}>{selected.results.stageRecommendation}</div>
                    </div>

                    {/* 七维度评分 */}
                    <div className="card" style={{ marginBottom: '20px' }}>
                        <h3 style={{ marginBottom: '16px' }}>📊 七大维度评分</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                            {[
                                { label: '团队能力', score: selected.results.teamScore, color: '#3b82f6' },
                                { label: '产品技术', score: selected.results.productScore, color: '#10b981' },
                                { label: '市场竞争力', score: selected.results.marketScore, color: '#ef4444' },
                                { label: '财务状况', score: selected.results.financeScore, color: '#f59e0b' },
                                { label: '运营效率', score: selected.results.operationsScore, color: '#8b5cf6' },
                                { label: '战略规划', score: selected.results.strategyScore, color: '#1e293b' },
                                { label: '可持续发展', score: selected.results.sustainabilityScore, color: '#14b8a6' },
                            ].map((cat, i) => (
                                <div key={i} style={{ background: cat.color + '10', borderRadius: '10px', padding: '16px', textAlign: 'center', border: `2px solid ${cat.color}20` }}>
                                    <div style={{ color: cat.color, fontSize: '28px', fontWeight: 800 }}>{cat.score}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-mid)', marginTop: '4px' }}>{cat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SWOT 分析 */}
                    <div className="card" style={{ marginBottom: '20px' }}>
                        <h3 style={{ marginBottom: '16px' }}>🎯 SWOT 分析</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {[
                                { title: '优势 Strengths', items: selected.deepAnalysis.strengths, color: '#16a34a', bg: '#f0fdf4' },
                                { title: '劣势 Weaknesses', items: selected.deepAnalysis.weaknesses, color: '#dc2626', bg: '#fef2f2' },
                                { title: '机会 Opportunities', items: selected.deepAnalysis.opportunities, color: '#2563eb', bg: '#eff6ff' },
                                { title: '威胁 Threats', items: selected.deepAnalysis.threats, color: '#d97706', bg: '#fffbeb' },
                            ].map((s, i) => (
                                <div key={i} style={{ background: s.bg, border: `2px solid ${s.color}30`, borderRadius: '10px', padding: '16px' }}>
                                    <div style={{ color: s.color, fontWeight: 700, marginBottom: '10px' }}>{s.title}</div>
                                    <ul style={{ paddingLeft: '18px' }}>
                                        {s.items.map((item: string, j: number) => (
                                            <li key={j} style={{ color: 'var(--text-dark)', fontSize: '13px', marginBottom: '6px', lineHeight: 1.5 }}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 投资建议 */}
                    <div className="card" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', color: '#fff' }}>
                        <h3 style={{ marginBottom: '16px' }}>💡 投资评估建议</h3>
                        <div style={{ lineHeight: 1.8, marginBottom: '12px' }}>{selected.deepAnalysis.investmentSummary}</div>
                        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', fontSize: '14px' }}>
                            <strong>关键发现：</strong>{selected.deepAnalysis.keyFindings}
                        </div>
                    </div>
                </div>
            )}

            {!selected && !loading && (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-light)' }}>
                    👆 请点击上方示例卡片查看详细报告
                </div>
            )}
        </div>
    )
}
