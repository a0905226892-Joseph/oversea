import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkUsageLimit, recordUsage } from '@/lib/usage'
import { decryptApiKey, callDeepSeekAPI } from '@/lib/deepseek'

// POST /api/ai-analyze - 調用 AI算法實驗室 AI 深度分析
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: '請先登錄' }, { status: 401 })
        }

        const body = await request.json()
        const { id } = body

        if (!id) {
            return NextResponse.json({ error: '缺少評估 ID' }, { status: 400 })
        }

        // 1. 獲取評估數據
        const { data: evaluation, error: evError } = await supabase
            .from('evaluations')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (evError || !evaluation) {
            return NextResponse.json({ error: '找不到評估記錄' }, { status: 404 })
        }

        // 2. 檢查使用次數
        const limitCheck = await checkUsageLimit(user.id, supabase)
        if (!limitCheck.allowed) {
            return NextResponse.json({ error: limitCheck.error }, { status: 403 })
        }

        // 3. 獲取用戶的 AI算法實驗室 API Key
        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('deepseek_api_key, api_key_verified')
            .eq('id', user.id)
            .single()

        if (!profile?.deepseek_api_key) {
            return NextResponse.json({
                error: 'API_KEY_MISSING',
                message: '請先設置 AI算法實驗室 API Key',
            }, { status: 403 })
        }

        const apiKey = decryptApiKey(profile.deepseek_api_key)

        // 4. 準備 Prompt 數據
        const results = evaluation.results?.finalResult || {}
        const catResults = evaluation.results?.categoryResults || []
        const metricsArray = evaluation.input_data || []

        // 獲取靜態指標名稱映射
        const { metrics: staticMetrics } = require('@/lib/metrics-data')
        const getMetricName = (mid: string) => staticMetrics.find((sm: any) => sm.id === mid)?.name || mid

        // 排序找出優勢與劣勢指標 (假設輸入數據中已包含 value)
        const sortedMetrics = [...metricsArray].sort((a: any, b: any) => b.value - a.value)
        const top5 = sortedMetrics.slice(0, 5).map(m => getMetricName(m.id))
        const bottom5 = sortedMetrics.slice(-5).reverse().map(m => getMetricName(m.id))

        const systemPrompt = `你是一位資深企業投資評估專家，請基於提供的數據進行深度分析並返回 JSON。語法：繁體中文。`

        const prompt = `
企業：${evaluation.company_name} (${evaluation.industry})
融資階段：${evaluation.funding_stage}
綜合評分：${results.finalScore}/100 (${results.scoreGrade})

維度得分：
${catResults.map((c: any) => `- ${c.name}: ${c.totalPoints}分`).join('\n')}

優勢指標：${top5.join('、')}
待改進指標：${bottom5.join('、')}

請返回以下 JSON (嚴禁包含 Markdown 或多餘文字):
{
  "strengths": ["優勢1", "優勢2", "優勢3"],
  "weaknesses": ["劣勢1", "劣勢2", "劣勢3"],
  "investmentSummary": "500字內的總結性建議",
  "pestel": [政治%, 經濟%, 社會%, 技術%, 環境%, 法律%],
  "vrio": [價值%, 稀缺%, 難模仿%, 組織%],
  "ai_note": "本報告由 AI算法實驗室 分析生成"
}
`

        // 5. 調用 AI API
        let aiResult: any
        try {
            const rawResponse = await callDeepSeekAPI(apiKey, prompt, systemPrompt)
            const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                aiResult = JSON.parse(jsonMatch[0])
            } else {
                throw new Error('AI 返回格式錯誤')
            }
        } catch (apiErr: any) {
            if (apiErr.message === 'API_KEY_INVALID') {
                await adminClient.from('profiles').update({ api_key_verified: false }).eq('id', user.id)
                return NextResponse.json({ error: 'API_KEY_INVALID', message: 'API Key 已失效' }, { status: 403 })
            }
            throw apiErr
        }

        // 6. 保存結果並記錄使用
        await recordUsage(user.id, 'ai_analysis', evaluation.company_name, supabase)
        await supabase
            .from('evaluations')
            .update({ deep_analysis: aiResult })
            .eq('id', id)
            .eq('user_id', user.id)

        return NextResponse.json({ success: true, analysis: aiResult })
    } catch (err: any) {
        console.error('AI 分析錯誤:', err)
        return NextResponse.json({ error: 'AI 分析失敗' }, { status: 500 })
    }
}
