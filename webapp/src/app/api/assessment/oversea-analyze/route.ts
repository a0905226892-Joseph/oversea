import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { decryptApiKey, callAiLabAPI } from '@/lib/ai-lab'

// POST /api/assessment/oversea-analyze - 調用 DeepSeek 進行海外市場分析與問答
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: '請先登錄' }, { status: 401 })
        }

        const body = await request.json()
        const { prompt, systemPrompt, config } = body

        if (!prompt) {
            return NextResponse.json({ error: '缺少 Prompt' }, { status: 400 })
        }

        // 1. 獲取用戶的 AI算法實驗室 API Key (優先從本地傳遞，若無則從資料庫獲取)
        let apiKey = '';
        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('ai_lab_api_key')
            .eq('id', user.id)
            .single()

        if (profile?.ai_lab_api_key) {
            apiKey = decryptApiKey(profile.ai_lab_api_key)
        }

        if (!apiKey) {
            return NextResponse.json({
                error: 'API_KEY_MISSING',
                message: '請先設置並驗證 API Key',
            }, { status: 403 })
        }

        // 2. 調用 AI API
        const content = await callAiLabAPI(apiKey, prompt, systemPrompt, config)

        return NextResponse.json({ success: true, content })
    } catch (err: any) {
        console.error('Oversea AI 分析錯誤:', err)
        return NextResponse.json({ error: err.message || 'AI 分析失敗' }, { status: 500 })
    }
}
