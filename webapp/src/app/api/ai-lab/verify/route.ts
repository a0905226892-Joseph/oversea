import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { encryptApiKey, verifyAiLabApiKey } from '@/lib/ai-lab'

// POST /api/ai-lab/verify - 验证并保存 AI 算法实验室 API Key
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: '请先登录' }, { status: 401 })
        }

        const { apiKey } = await request.json()
        if (!apiKey || !apiKey.startsWith('sk-')) {
            return NextResponse.json({ error: 'API Key 格式无效，应以 sk- 开头' }, { status: 400 })
        }

        // 验证 Key 有效性
        const isValid = await verifyAiLabApiKey(apiKey)
        if (!isValid) {
            return NextResponse.json({ error: 'API Key 无效，请检查后重试' }, { status: 400 })
        }

        // 加密存储
        const encryptedKey = encryptApiKey(apiKey)
        const adminClient = createAdminClient()
        const { error } = await adminClient
            .from('profiles')
            .update({ deepseek_api_key: encryptedKey, api_key_verified: true })
            .eq('id', user.id)

        if (error) {
            return NextResponse.json({ error: '保存失败，请重试' }, { status: 500 })
        }

        return NextResponse.json({ message: 'API Key 验证成功并已保存' })
    } catch (err) {
        return NextResponse.json({ error: '服务错误，请稍后重试' }, { status: 500 })
    }
}

// GET /api/ai-lab/status - 查询 API Key 状态
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: '请先登录' }, { status: 401 })
        }

        const { data } = await supabase
            .from('profiles')
            .select('api_key_verified, deepseek_api_key')
            .eq('id', user.id)
            .single()

        return NextResponse.json({
            hasKey: !!data?.deepseek_api_key,
            verified: data?.api_key_verified || false,
        })
    } catch {
        return NextResponse.json({ error: '服务错误' }, { status: 500 })
    }
}
