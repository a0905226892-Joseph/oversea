import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/auth/signup - 用户注册（发送邮箱验证码）
export async function POST(request: NextRequest) {
    try {
        const { email, password, displayName } = await request.json()

        if (!email) {
            return NextResponse.json({ error: '请输入邮箱地址' }, { status: 400 })
        }

        const supabase = await createClient()

        // 使用 OTP 方式：发送验证码邮件（magic link / OTP）
        // 使用 signUp 接口進行郵件+密碼註冊
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { display_name: displayName || email.split('@')[0] },
            },
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ message: '验证码已发送，请查看邮箱' })
    } catch (err) {
        return NextResponse.json({ error: '服务错误，请稍后重试' }, { status: 500 })
    }
}
