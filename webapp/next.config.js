/** @type {import('next').NextConfig} */
const nextConfig = {
    // 允许在 API Routes 中使用较大的请求体（用于传输评估数据）
    experimental: {
        serverActions: {
            bodySizeLimit: '5mb',
        },
    },
}

module.exports = nextConfig
