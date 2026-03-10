import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/auth/logout - 用户登出
export async function POST() {
    try {
        const supabase = await createClient()
        await supabase.auth.signOut()
        return NextResponse.json({ message: '已退出登录' })
    } catch {
        return NextResponse.json({ error: '服务错误' }, { status: 500 })
    }
}
