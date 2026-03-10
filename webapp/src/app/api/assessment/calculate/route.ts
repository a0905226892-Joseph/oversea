import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AssessmentEngine } from '@/lib/assessment-engine';

/**
 * POST /api/assessment/calculate
 * 接收原始指標數據，返回計算後的結果
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // 雖然開放給免費用戶預覽樣本，但自定義計算建議要求登錄
        if (!user) {
            return NextResponse.json({ error: '請先登錄' }, { status: 401 });
        }

        const body = await request.json();
        const { metrics: inputMetrics } = body;

        if (!inputMetrics || typeof inputMetrics !== 'object') {
            return NextResponse.json({ error: '無效的指標數據' }, { status: 400 });
        }

        // 執行核心計分引擎
        const result = AssessmentEngine.runFullAssessment(inputMetrics);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('評估計算錯誤:', error);
        return NextResponse.json({ error: '服務器計算錯誤' }, { status: 500 });
    }
}
