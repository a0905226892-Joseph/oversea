# 投资分析评估页面 (In-depth Analysis) 改造计划

## 🎯 目标

1. **全面简体中文化**：将 `page.tsx` 中“深度分析”以及相关标签页的所有 UI 文字（繁体字）改为简体中文。
2. **完全依赖 AI 分析结果**：
   - 「多维度深度分析模型」(PESTEL/4P/VRIO) 和「SWOT 分析矩阵」**必须全部**来自 AI 的返回结果。
   - 不再使用本地的算法推估数据作为画面上 AI 分析区块的占位符。若无 AI 分析数据，相关图表应显示为空，或者 UI 明确显示“尚未生成”等占位提示。
   - 修改提示词以要求 AI 产生完整的 SWOT 数据（优势 Strengths、劣势 Weaknesses、机会 Opportunities、威胁 Threats）。

## 🛠️ Proposed Changes

### 修改 `webapp/src/app/app/evaluate/page.tsx`

#### 1. 状态与界面更新 `aiSections`
- 在 `aiSections` 的 type 定义中新增 `strengths: string[];` 以及 `weaknesses: string[];`

#### 2. 重构 `generateAIPrompt`
- 确保提示词内容全为标准简体中文。
- 修改提示词，扩展并细化要求 AI 输出到 1~13 点，明确包含：
  - SWOT 内部优势 (Strengths) -> 第 6 点
  - SWOT 内部劣势 (Weaknesses) -> 第 7 点
  - SWOT 外部机会 (Opportunities) -> 第 8 点
  - SWOT 外部威胁 (Threats) -> 第 9 点
- 相应地调整 8~11 项的序号至 10~13 项。

#### 3. 重构 `parseAIResponse`
- 新增截取逻辑：当识别到“内部优势”或“Strengths”关键字时，归类到 `strengths` 数组。
- 新增截取逻辑：当识别到“内部劣势”或“Weaknesses”关键字时，归类到 `weaknesses` 数组。
- 保证其余 PESTEL/4P/VRIO 及文本部分可正常解析。

#### 4. UI 渲染逻辑调整
- **图表数据强制 AI 化**：修改 `pestelChartData`、`fourPChartData`、`vrioChartData`。若 `aiSections.pestelScores`（或其他对应的分值数组）不存在，则图表数据全回传 `0`，不再回传预设的算法推估值。
- **SWOT 矩阵**：
  - 四大象限均由 `aiSections` 提供 (`aiSections.strengths`, `aiSections.weaknesses` 等)。
  - 若 `aiSections`（或具体的属性）为空，则统一显示“等待 AI 深度分析生成...”。不再通过 `generateSwot` 做回退显示。
- **简体中文化**：
  - 将原本写死的繁体字全部改为简体中文，例如：
    - 「企業體質分析（基於計分）」 -> 「企业体质分析（基于计分）」
    - 「多維度深度分析模型」 -> 「多维度深度分析模型」
    - 「護城河分析」 -> 「护城河分析」
    - 「優勢 (Strengths)」 -> 「优势 (Strengths)」
    - 等等...

## 🔍 Verification Plan
1. 重整页面，点击「分析」Tab（在没有触发 AI 分析的状态下）。
2. 核对 PESTEL/4P/VRIO 图表在没有 AI 结果前是否显示为空白 (或数值为 0)。
3. 核对 SWOT 分析矩阵的四个象限是否皆显示占位符「等待 AI 深度分析生成...」。
4. 检查该 Tab 下的所有中文字是否都是简体中文。
5. 自动 / 手动触发 AI 分析后，检查 SWOT 四个象限填入的内容是否为 AI 回传的条目。
6. 检查所有图表数据均能正确呈现 AI 给出的数值。
