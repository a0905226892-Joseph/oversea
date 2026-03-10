import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkUsageLimit, recordUsage } from '@/lib/usage'
import { calculateCategoryResults, calculateFinalResult } from '@/lib/calculator'

// POST /api/evaluate - 提交企業信息，執行 108 項指標評估並保存
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: '請先登錄' }, { status: 401 })
        }

        const body = await request.json()
        const { id, companyInfo, metrics: metricsArray } = body

        if (!companyInfo?.companyName) {
            return NextResponse.json({ error: '請輸入企業名稱' }, { status: 400 })
        }

        // 如果是新評估，檢查使用次數限制
        if (!id) {
            const limitCheck = await checkUsageLimit(user.id, supabase)
            if (!limitCheck.allowed) {
                return NextResponse.json({ error: limitCheck.error }, { status: 403 })
            }
            // 記錄使用次數 (僅新評估扣費)
            await recordUsage(user.id, 'calculate', companyInfo.companyName, supabase)
        }

        // 整理指標數據並計算結果
        const { metrics: staticMetrics } = require('@/lib/metrics-data')
        const inputMetrics = staticMetrics.map((m: any) => {
            const userVal = metricsArray.find((um: any) => um.id === m.id)
            return { ...m, value: userVal ? userVal.value : 0 }
        })

        const categoryResults = calculateCategoryResults(inputMetrics)
        const finalResult = calculateFinalResult(categoryResults)
        const results = { categoryResults, finalResult }

        let responseData: any = {}

        if (id) {
            const { error } = await supabase
                .from('evaluations')
                .update({
                    company_name: companyInfo.companyName,
                    industry: companyInfo.industry,
                    funding_stage: companyInfo.fundingStage,
                    evaluation_date: companyInfo.evaluationDate,
                    input_data: metricsArray,
                    results
                })
                .eq('id', id)
                .eq('user_id', user.id)

            if (error) throw error
            responseData = { success: true, id }
        } else {
            const { data: evaluation, error } = await supabase
                .from('evaluations')
                .insert({
                    user_id: user.id,
                    company_name: companyInfo.companyName,
                    industry: companyInfo.industry,
                    funding_stage: companyInfo.fundingStage,
                    evaluation_date: companyInfo.evaluationDate,
                    input_data: metricsArray,
                    results,
                })
                .select('id')
                .single()

            if (error) throw error
            responseData = { success: true, id: evaluation?.id }
        }

        return NextResponse.json(responseData)
    } catch (err: any) {
        console.error('評估保存錯誤:', err)
        return NextResponse.json({ error: '保存失敗，請重試' }, { status: 500 })
    }
}

// GET /api/evaluate - 獲取歷史列表或單個詳情
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: '請先登錄' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (id) {
            const { data, error } = await supabase
                .from('evaluations')
                .select('*')
                .eq('id', id)
                .eq('user_id', user.id)
                .single()

            if (error) throw error

            const metric_values = data.input_data || []
            return NextResponse.json({
                evaluation: {
                    ...data,
                    metric_values
                }
            })
        } else {
            const { data, error } = await supabase
                .from('evaluations')
                .select('id, company_name, industry, funding_stage, evaluation_date, created_at, results')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50)

            if (error) throw error
            return NextResponse.json({ evaluations: data || [] })
        }
    } catch (err: any) {
        console.error('獲取評估錯誤:', err)
        return NextResponse.json({ error: '獲取數據失敗' }, { status: 500 })
    }
}

// DELETE /api/evaluate - 刪除用戶評估記錄
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: '請先登錄' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: '缺少 ID' }, { status: 400 })
        }

        const { error } = await supabase
            .from('evaluations')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('刪除評估錯誤:', err)
        return NextResponse.json({ error: '刪除失敗' }, { status: 500 })
    }
}
