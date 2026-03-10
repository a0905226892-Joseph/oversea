import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkUsageLimit, recordUsage } from '@/lib/usage'
import { decryptApiKey, callDeepSeekAPI } from '@/lib/deepseek'

// POST /api/ai-analyze - 调用 DeepSeek AI 深度分析
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: '请先登录' }, { status: 401 })
        }

        // 检查使用次数
        const limitCheck = await checkUsageLimit(user.id, supabase)
        if (!limitCheck.allowed) {
            return NextResponse.json({ error: limitCheck.error }, { status: 403 })
        }

        // 获取用户的 DeepSeek API Key
        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('deepseek_api_key, api_key_verified')
            .eq('id', user.id)
            .single()

        if (!profile?.deepseek_api_key) {
            return NextResponse.json({
                error: 'API_KEY_MISSING',
                message: '请先设置 DeepSeek API Key',
            }, { status: 403 })
        }

        const apiKey = decryptApiKey(profile.deepseek_api_key)

        // 获取请求数据
        const body = await request.json()
        const { companyInfo, results, deepInfo, metricsData } = body

        if (!companyInfo?.companyName) {
            return NextResponse.json({ error: '请先填写企业信息' }, { status: 400 })
        }

        // 构建 AI 分析提示词
        const systemPrompt = `你是一位资深的企业投资评估专家，专注于中国企业出海与融资评估。
请基于提供的108项指标评估数据，进行深度分析并返回严格的 JSON 格式结果。
分析必须客观、专业、有依据，语言使用简体中文。`

        const topMetrics = Object.values(metricsData || {})
            .sort((a: any, b: any) => parseFloat(b.points) - parseFloat(a.points))
            .slice(0, 5)
            .map((m: any) => m.name)

        const bottomMetrics = Object.values(metricsData || {})
            .sort((a: any, b: any) => parseFloat(a.points) - parseFloat(b.points))
            .slice(0, 5)
            .map((m: any) => m.name)

        const prompt = `请对以下企业进行深度投资评估分析：

企业名称：${companyInfo.companyName}
所属行业：${companyInfo.industry}
融资阶段：${companyInfo.fundingStage}
综合评分：${results?.finalScore || 0}/100
评级：${results?.scoreGrade || ''}

各维度得分：
- 团队能力：${results?.teamScore || 0}分（权重${results?.teamWeight || 0}%）
- 产品技术：${results?.productScore || 0}分
- 市场竞争力：${results?.marketScore || 0}分
- 财务状况：${results?.financeScore || 0}分
- 运营效率：${results?.operationsScore || 0}分
- 战略规划：${results?.strategyScore || 0}分
- 可持续发展：${results?.sustainabilityScore || 0}分

核心优势指标：${topMetrics.join('、')}
待改进指标：${bottomMetrics.join('、')}

请以严格 JSON 格式返回以下分析内容（不要有任何JSON之外的文字）：
{
  "pestel": [政治分, 经济分, 社会分, 技术分, 环境分, 法律分],
  "fourP": [产品分, 价格分, 渠道分, 推广分],
  "vrio": [价值性分, 稀缺性分, 难模仿性分, 组织能力分],
  "pestelAnalysis": "PESTEL分析文字（200字内）",
  "fourPAnalysis": "4P策略分析文字（200字内）",
  "vrioAnalysis": "VRIO分析文字（200字内）",
  "strengths": ["优势1", "优势2", "优势3", "优势4", "优势5"],
  "weaknesses": ["劣势1", "劣势2", "劣势3", "劣势4", "劣势5"],
  "opportunities": ["机会1", "机会2", "机会3", "机会4", "机会5"],
  "threats": ["威胁1", "威胁2", "威胁3", "威胁4", "威胁5"],
  "investmentSummary": "投资总结（300字内）",
  "keyFindings": "关键发现（200字内）",
  "riskAssessment": "风险评估（200字内）",
  "investmentRecommendation": "投资建议（200字内）"
}`

        // 调用 DeepSeek API
        let aiResult: any
        try {
            const rawResponse = await callDeepSeekAPI(apiKey, prompt, systemPrompt)
            // 提取 JSON 内容
            const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                aiResult = JSON.parse(jsonMatch[0])
            } else {
                throw new Error('返回格式异常')
            }
        } catch (apiErr: any) {
            if (apiErr.message === 'API_KEY_INVALID') {
                // 标记 Key 为无效
                await adminClient
                    .from('profiles')
                    .update({ api_key_verified: false })
                    .eq('id', user.id)
                return NextResponse.json({
                    error: 'API_KEY_INVALID',
                    message: 'DeepSeek API Key 已失效，请重新设置',
                }, { status: 403 })
            }
            throw apiErr
        }

        // 记录使用次数
        await recordUsage(user.id, 'ai_analysis', companyInfo.companyName, supabase)

        // 更新评估记录中的 AI 分析
        if (body.evaluationId) {
            await supabase
                .from('evaluations')
                .update({ ai_analysis: aiResult })
                .eq('id', body.evaluationId)
                .eq('user_id', user.id)
        }

        return NextResponse.json({
            success: true,
            aiAnalysis: aiResult,
            remainingUsage: limitCheck.remainingUsage !== null
                ? limitCheck.remainingUsage - 1
                : null,
        })
    } catch (err: any) {
        console.error('AI分析错误:', err)
        return NextResponse.json({ error: 'AI分析失败，请稍后重试' }, { status: 500 })
    }
}
