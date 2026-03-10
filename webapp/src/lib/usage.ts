import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// 使用次数限制中间件
export async function checkUsageLimit(userId: string, supabase: any): Promise<{
    allowed: boolean
    tier: string
    remainingUsage: number | null
    error?: string
}> {
    // 获取用户订阅信息
    const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_expires_at')
        .eq('id', userId)
        .single()

    if (!profile) {
        return { allowed: false, tier: 'free', remainingUsage: 0, error: '用户信息不存在' }
    }

    const tier = profile.subscription_tier

    // 免费用户不允许计算
    if (tier === 'free') {
        return { allowed: false, tier, remainingUsage: 0, error: '免费会员无法使用此功能，请升级订阅' }
    }

    // 检查订阅是否过期
    if (profile.subscription_expires_at && new Date(profile.subscription_expires_at) < new Date()) {
        return { allowed: false, tier: 'free', remainingUsage: 0, error: '订阅已过期，请续费' }
    }

    // 高级会员无限次
    if (tier === 'premium') {
        return { allowed: true, tier, remainingUsage: null }
    }

    // 标准会员：检查本年度次数（100次限制）
    const currentYear = new Date().getFullYear()
    const { data: usageData } = await supabase
        .rpc('get_yearly_usage', { p_user_id: userId, p_year: currentYear })

    const used = usageData || 0
    const limit = 100
    const remaining = limit - used

    if (remaining <= 0) {
        return {
            allowed: false,
            tier,
            remainingUsage: 0,
            error: `本年度使用次数已达上限（${limit}次），请upgrade升级为高级会员`
        }
    }

    return { allowed: true, tier, remainingUsage: remaining }
}

// 记录使用次数
export async function recordUsage(
    userId: string,
    actionType: 'calculate' | 'ai_analysis',
    companyName: string,
    supabase: any
) {
    await supabase.from('usage_records').insert({
        user_id: userId,
        action_type: actionType,
        company_name: companyName,
        year: new Date().getFullYear(),
    })
}
