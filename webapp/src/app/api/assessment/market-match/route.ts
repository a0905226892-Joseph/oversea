import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { decryptApiKey, callDeepSeekAPI } from '@/lib/deepseek';

/**
 * POST /api/assessment/market-match
 * 封裝全球市場匹配的提示詞模板
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '請先登錄' }, { status: 401 });
        }

        const body = await request.json();
        const { companyName, industry, scoreSummary } = body;

        const adminClient = createAdminClient();
        const { data: profile } = await adminClient
            .from('profiles')
            .select('deepseek_api_key')
            .eq('id', user.id)
            .single();

        if (!profile?.deepseek_api_key) {
            return NextResponse.json({ error: 'MISSING_API_KEY', message: '請先設置 API Key' }, { status: 403 });
        }

        const apiKey = decryptApiKey(profile.deepseek_api_key);

        const systemPrompt = "你是一位資深國際市場戰略分析師，專注於中國企業出海策略。必須返回標準的 JSON 格式，不要包含任何文字說明。";
        const prompt = `
            根據以下評估數據，分析企業「${companyName}」(${industry}) 最適合出海的 5 個國家或地區。
            得分摘要：${JSON.stringify(scoreSummary)}

            請以純 JSON 格式返回：
            {
              "matches": [
                {"country": "國家名", "matchPercentage": 數字, "reasons": ["原因1", "原因2"]}
              ]
            }
        `;

        const response = await callDeepSeekAPI(apiKey, prompt, systemPrompt);

        // 嘗試提取 JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return NextResponse.json(JSON.parse(jsonMatch[0]));
        }

        return NextResponse.json({ error: 'AI 返回格式無效' }, { status: 500 });
    } catch (error: any) {
        console.error('市場匹配分析失敗:', error);
        return NextResponse.json({ error: '分析失敗' }, { status: 500 });
    }
}
