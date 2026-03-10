import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '企业出海与投资评估分析系统',
  description: '108项指标动态评估 | AI向量数据算法分析 | AI算法实验室集成版',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
