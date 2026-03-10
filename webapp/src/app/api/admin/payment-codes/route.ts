import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { customAlphabet } from 'nanoid'

// 生成付款码：10位大写字母+数字
const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 12)

// 检查管理员权限
async function checkAdmin(supabase: any, userId: string): Promise<boolean> {
    const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single()
    return data?.is_admin === true
}

// POST /api/admin/payment-codes - 生成付款码
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })
        if (!(await checkAdmin(supabase, user.id))) {
            return NextResponse.json({ error: '无管理员权限' }, { status: 403 })
        }

        const { subscriptionTier, durationMonths, priceCny, remark, quantity = 1 } = await request.json()

        if (!['standard', 'premium'].includes(subscriptionTier)) {
            return NextResponse.json({ error: '无效的订阅类型' }, { status: 400 })
        }

        const adminClient = createAdminClient()
        const codes = []

        for (let i = 0; i < Math.min(quantity, 50); i++) {
            const code = generateCode()
            codes.push({
                code,
                subscription_tier: subscriptionTier,
                duration_months: durationMonths || 12,
                price_cny: priceCny,
                remark,
                created_by: user.id,
            })
        }

        const { data, error } = await adminClient
            .from('payment_codes')
            .insert(codes)
            .select('code, subscription_tier, duration_months, price_cny')

        if (error) throw error

        return NextResponse.json({ success: true, codes: data })
    } catch {
        return NextResponse.json({ error: '生成失败' }, { status: 500 })
    }
}

// GET /api/admin/payment-codes - 获取付款码列表
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })
        if (!(await checkAdmin(supabase, user.id))) {
            return NextResponse.json({ error: '无管理员权限' }, { status: 403 })
        }

        const adminClient = createAdminClient()
        const { data, error } = await adminClient
            .from('payment_codes')
            .select(`*, used_by_profile:profiles!payment_codes_used_by_fkey(email)`)
            .order('created_at', { ascending: false })
            .limit(200)

        if (error) throw error

        return NextResponse.json({ codes: data || [] })
    } catch {
        return NextResponse.json({ error: '获取失败' }, { status: 500 })
    }
}
