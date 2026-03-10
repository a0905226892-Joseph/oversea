import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 服务端 Supabase 客户端（用于 API Routes 和 Server Components）
export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Server Component 中忽略写入错误
                    }
                },
            },
        }
    )
}

// 管理员客户端（使用 Service Role Key，绕过 RLS）
export function createAdminClient() {
    const { createClient } = require('@supabase/supabase-js')
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}
