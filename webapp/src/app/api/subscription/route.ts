import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/subscription/redeem - 用付款码兑换订阅
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: '请先登录' }, { status: 401 })
        }

        const { code } = await request.json()
        if (!code?.trim()) {
            return NextResponse.json({ error: '请输入付款码' }, { status: 400 })
        }

        const adminClient = createAdminClient()

        // 查找付款码
        const { data: paymentCode, error: findError } = await adminClient
            .from('payment_codes')
            .select('*')
            .eq('code', code.trim().toUpperCase())
            .eq('is_used', false)
            .single()

        if (findError || !paymentCode) {
            return NextResponse.json({ error: '付款码无效或已被使用' }, { status: 400 })
        }

        // 计算到期时间
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + paymentCode.duration_months)

        // 更新用户订阅
        await adminClient
            .from('profiles')
            .update({
                subscription_tier: paymentCode.subscription_tier,
                subscription_expires_at: expiresAt.toISOString(),
            })
            .eq('id', user.id)

        // 标记付款码已使用
        await adminClient
            .from('payment_codes')
            .update({ is_used: true, used_by: user.id, used_at: new Date().toISOString() })
            .eq('id', paymentCode.id)

        const tierNames: Record<string, string> = {
            standard: '标准会员',
            premium: '高级会员',
        }

        return NextResponse.json({
            success: true,
            message: `恭喜！已成功升级为${tierNames[paymentCode.subscription_tier]}`,
            tier: paymentCode.subscription_tier,
            expiresAt: expiresAt.toISOString(),
        })
    } catch {
        return NextResponse.json({ error: '兑换失败，请稍后重试' }, { status: 500 })
    }
}

// GET /api/subscription - 查询订阅状态
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: '请先登录' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier, subscription_expires_at')
            .eq('id', user.id)
            .single()

        return NextResponse.json({
            tier: profile?.subscription_tier || 'free',
            expiresAt: profile?.subscription_expires_at,
        })
    } catch {
        return NextResponse.json({ error: '查询失败' }, { status: 500 })
    }
}
