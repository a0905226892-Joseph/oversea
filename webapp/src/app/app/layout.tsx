import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div>
            <Navbar userEmail={user.email} />
            <main style={{ padding: '30px 20px', maxWidth: '1400px', margin: '0 auto' }}>
                {children}
            </main>
            <div className="page-footer">
                © 2026 企业出海与投资评估分析系统 · 108项指标 · AI深度分析
            </div>
        </div>
    )
}
