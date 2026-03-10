import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth/login - 用户登录（发送邮箱验证码 OTP）
export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        if (!email) {
            return NextResponse.json({ error: '请输入邮箱地址' }, { status: 400 })
        }

        const supabase = await createClient()

        if (password) {
            // 模式 A：密碼登錄
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) {
                return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 })
            }
            return NextResponse.json({ message: '登录成功' })
        } else {
            // 模式 B：驗證碼登錄
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: { shouldCreateUser: false },
            })
            if (error) {
                if (error.message.includes('not found') || error.message.includes('Signups not allowed')) {
                    return NextResponse.json({ error: '该邮箱未注册，请先注册' }, { status: 404 })
                }
                return NextResponse.json({ error: error.message }, { status: 400 })
            }
            return NextResponse.json({ message: '验证码已发送' })
        }
    } catch (err) {
        return NextResponse.json({ error: '服务错误，请稍后重试' }, { status: 500 })
    }
}
