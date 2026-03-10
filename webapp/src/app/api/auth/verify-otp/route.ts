import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth/verify-otp - 验证 OTP 码完成登录/注册
export async function POST(request: NextRequest) {
    try {
        const { email, token, type } = await request.json()

        if (!email || !token) {
            return NextResponse.json({ error: '参数不完整' }, { status: 400 })
        }

        const supabase = await createClient()

        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: type || 'email',
        })

        if (error) {
            return NextResponse.json({ error: '验证码无效或已过期，请重新获取' }, { status: 400 })
        }

        return NextResponse.json({
            message: '验证成功',
            user: data.user,
        })
    } catch {
        return NextResponse.json({ error: '服务错误，请稍后重试' }, { status: 500 })
    }
}
