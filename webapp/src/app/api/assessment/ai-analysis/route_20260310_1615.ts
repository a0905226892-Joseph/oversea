import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { decryptApiKey, callDeepSeekAPI } from '@/lib/deepseek';

/**
 * POST /api/assessment/ai-analysis
 * 封裝 PESTEL, 4P, VRIO, SWOT 的提示詞模板
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '請先登錄' }, { status: 401 });
        }

        const body = await request.json();
        const { companyInfo, resultSummary, type = 'comprehensive' } = body;

        // 1. 獲取 API Key (從管理員權限 Profile 中獲取)
        const adminClient = createAdminClient();
        const { data: profile } = await adminClient
            .from('profiles')
            .select('deepseek_api_key')
            .eq('id', user.id)
            .single();

        if (!profile?.deepseek_api_key) {
            return NextResponse.json({ error: 'MISSING_API_KEY', message: '請先在設置中配置 API Key' }, { status: 403 });
        }

        const apiKey = decryptApiKey(profile.deepseek_api_key);

        // 2. 根據類型準備不同的提示詞模板 (遷移自 index.html)
        let systemPrompt = "你是一位資深企業投資評估專家與國際市場分析師，擁有 10 年以上經驗。";
        let userPrompt = "";

        if (type === 'comprehensive') {
            userPrompt = `
                企業名稱：${companyInfo.name}
                所屬行業：${companyInfo.industry}
                融資階段：${companyInfo.fundingStage}
                評估得分：${resultSummary.totalScore}/100
                維度表現：${JSON.stringify(resultSummary.categoryScores)}

                請提供以下深度分析（繁體中文）：
                1. 核心競爭力分析：基於 VRIO 框架。
                2. 主要風險因素：識別潛在弱點。
                3. PESTEL 分析：政治、經濟、社會、技術、環境、法律六個維度的影響。
                4. 4P 營銷建議：產品、價格、渠道、促銷的改進路徑。
                5. 綜合投資價值與建議。

                請返回結構清晰的內容，嚴禁輸出任何免責聲明。
            `;
        } else if (type === 'market_matching') {
            userPrompt = `
                分析企業「${companyInfo.name}」(${companyInfo.industry}) 的出海匹配度。
                得分數據：${JSON.stringify(resultSummary.categoryScores)}
                請推薦 5 個最適合的出海國家，並以 JSON 格式返回：
                { "matches": [{ "country": "國家名", "matchPercentage": 數字, "reasons": ["原因1", "原因2"] }] }
            `;
        }

        // 3. 調用 AI
        const response = await callDeepSeekAPI(apiKey, userPrompt, systemPrompt);

        return NextResponse.json({ content: response });
    } catch (error: any) {
        console.error('AI 分析錯誤:', error);
        return NextResponse.json({ error: 'AI 分析失敗' }, { status: 500 });
    }
}
