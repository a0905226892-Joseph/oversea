import CryptoJS from 'crypto-js'

const SECRET = process.env.ENCRYPTION_SECRET || 'default-secret-change-me'

// 加密 API Key
export function encryptApiKey(apiKey: string): string {
    return CryptoJS.AES.encrypt(apiKey, SECRET).toString()
}

// 解密 API Key
export function decryptApiKey(encryptedKey: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedKey, SECRET)
    return bytes.toString(CryptoJS.enc.Utf8)
}

// 验证 AI 算法实验室 API Key 有效性
export async function verifyAiLabApiKey(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 1,
            }),
        })
        return response.status !== 401
    } catch {
        return false
    }
}

// 调用 AI 算法实验室 API 进行分析
export async function callAiLabAPI(
    apiKey: string,
    prompt: string,
    systemPrompt: string,
    config?: { model?: string; temperature?: number; maxTokens?: number }
): Promise<string> {
    // 映射識別符回真實模型名
    const modelMap: Record<string, string> = {
        'ai-lab-chat': 'deepseek-chat',
        'ai-lab-reasoning': 'deepseek-reasoning'
    };
    const realModel = modelMap[config?.model || ''] || 'deepseek-chat';

    const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: realModel,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
            ],
            max_tokens: config?.maxTokens || 4000,
            temperature: config?.temperature ?? 0.7,
        }),
    })

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('API_KEY_INVALID')
        }
        throw new Error(`AI 算法實驗室 API 錯誤: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
}
