import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/usage - 查询本年度使用次数
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: '请先登录' }, { status: 401 })
        }

        const currentYear = new Date().getFullYear()

        // 获取用户信息和使用次数
        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier, subscription_expires_at, api_key_verified, ai_lab_api_key')
            .eq('id', user.id)
            .single()

        const { data: usedCount } = await supabase
            .rpc('get_yearly_usage', { p_user_id: user.id, p_year: currentYear })

        const tier = profile?.subscription_tier || 'free'
        const limit = tier === 'premium' ? null : tier === 'standard' ? 100 : 0
        const used = usedCount || 0
        const remaining = limit !== null ? Math.max(0, limit - used) : null
        const isExpired = profile?.subscription_expires_at
            ? new Date(profile.subscription_expires_at) < new Date()
            : false

        return NextResponse.json({
            tier,
            subscriptionExpiresAt: profile?.subscription_expires_at,
            isExpired,
            used,
            limit,
            remaining,
            hasApiKey: !!profile?.ai_lab_api_key,
            apiKeyVerified: profile?.api_key_verified || false,
        })
    } catch {
        return NextResponse.json({ error: '获取使用次数失败' }, { status: 500 })
    }
}
