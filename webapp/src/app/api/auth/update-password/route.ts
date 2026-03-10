import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth/update-password - 更新用戶密碼
export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json()

        if (!password || password.length < 6) {
            return NextResponse.json({ error: '密碼長度至少需6位' }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. 獲取當前用戶
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: '請先登錄' }, { status: 401 })
        }

        // 2. 更新密碼
        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ message: '密碼更新成功！下次登錄可直接使用新密碼。' })
    } catch (err) {
        return NextResponse.json({ error: '服務錯誤，請稍後重試' }, { status: 500 })
    }
}
