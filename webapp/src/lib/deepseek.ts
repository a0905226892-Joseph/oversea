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

// 验证 DeepSeek API Key 有效性
export async function verifyDeepSeekApiKey(apiKey: string): Promise<boolean> {
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
        // 返回 200 或 400（参数错误）都说明 Key 有效，401 说明无效
        return response.status !== 401
    } catch {
        return false
    }
}

// 调用 DeepSeek API 进行分析
export async function callDeepSeekAPI(
    apiKey: string,
    prompt: string,
    systemPrompt: string
): Promise<string> {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
            ],
            max_tokens: 4000,
            temperature: 0.7,
        }),
    })

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('API_KEY_INVALID')
        }
        throw new Error(`DeepSeek API 错误: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
}
