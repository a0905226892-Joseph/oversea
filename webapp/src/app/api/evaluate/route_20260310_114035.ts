import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkUsageLimit, recordUsage } from '@/lib/usage'
import { calculateAllScores } from '@/lib/calculator'

// POST /api/evaluate - 提交企业信息，执行108项指标评估
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: '请先登录' }, { status: 401 })
        }

        // 检查使用次数限制
        const limitCheck = await checkUsageLimit(user.id, supabase)
        if (!limitCheck.allowed) {
            return NextResponse.json({ error: limitCheck.error }, { status: 403 })
        }

        const body = await request.json()
        const { companyInfo, metricsData, deepInfo } = body

        if (!companyInfo?.companyName) {
            return NextResponse.json({ error: '请输入企业名称' }, { status: 400 })
        }

        // 执行108项指标计算
        const results = calculateAllScores(metricsData)

        // 记录使用次数
        await recordUsage(user.id, 'calculate', companyInfo.companyName, supabase)

        // 保存评估记录
        const { data: evaluation } = await supabase
            .from('evaluations')
            .insert({
                user_id: user.id,
                company_name: companyInfo.companyName,
                industry: companyInfo.industry,
                funding_stage: companyInfo.fundingStage,
                evaluation_date: companyInfo.evaluationDate,
                input_data: metricsData,
                deep_info: deepInfo,
                results,
            })
            .select('id')
            .single()

        return NextResponse.json({
            success: true,
            evaluationId: evaluation?.id,
            results,
            remainingUsage: limitCheck.remainingUsage !== null
                ? limitCheck.remainingUsage - 1
                : null,
        })
    } catch (err: any) {
        console.error('评估计算错误:', err)
        return NextResponse.json({ error: '计算失败，请稍后重试' }, { status: 500 })
    }
}

// GET /api/evaluate - 获取用户历史评估列表
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: '请先登录' }, { status: 401 })
        }

        const { data, error } = await supabase
            .from('evaluations')
            .select('id, company_name, industry, funding_stage, evaluation_date, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) throw error

        return NextResponse.json({ evaluations: data || [] })
    } catch {
        return NextResponse.json({ error: '获取历史记录失败' }, { status: 500 })
    }
}
