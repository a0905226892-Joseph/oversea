# 深度分析功能修改报告 (全面简体中文化与强制 AI 化)

## 已完成的修改

### `webapp/src/app/app/evaluate/page.tsx` 核心变更

#### 1. 状态变更
- `aiSections` 中新增了 `strengths: string[];` 和 `weaknesses: string[];` 字段。

#### 2. AI 提示词与解析
- 提示词完全转换为标准 **简体中文**。
- `generateAIPrompt()` 的输出要求增设至 1-13 项，明确指示输出 **内部优势 (SWOT Strengths)** (第 6 點)、 **内部劣势 (SWOT Weaknesses)** (第 7 點)、外部机会 (第 8 點) 及外部威胁 (第 9 點)。
- `parseAIResponse()` 增加了针对 `strengths` 与 `weaknesses` 关键字的截取逻辑。

#### 3. 强制 AI 化 UI
- **雷达/柱状图表**：`pestelChartData`, `fourPChartData`, `vrioChartData` 现在在缺乏 `aiSections` 结果时，会直接分别回传 6、4、4 个 `0`，而不再用系统推估分数代入。
- **SWOT 矩阵**：移除对于本地推估 `generateSwot` 变量的依赖，现在直接使用 `aiSections.strengths`, `aiSections.weaknesses` 等四项数据。当数据为空时，会显示 `等待 AI 深度分析生成...`。
- **图表隐藏**：在生成雷达图和柱状图的外围增加判断，若未进行 AI 深度分析则不显示图表，而是显示带边框的居中提示 `等待 AI 深度分析生成...`。

#### 4. UI 界面简体中文
- 将“分析”Tab 下的全部文字从繁体转换为简体。例如「企業體質分析」->「企业体质分析」，「護城河」->「护城河」及所有 AI 状态列文字提示等。

#### 5. 去除 AI 结果中的 Markdown 标签
- 修改 `parseAIResponse` 与 `formatAIContent`，确保所有的 `**`, `##`, `*`, `#` 被强制过滤并清除，使得 UI 在渲染 SWOT 和深度见解时，不会显示这些原被设计为 Markdown 格式但未被正确转译的原始字符串，确保画面整洁。

---

## 验证结果

| 项目 | 结果 |
|------|------|
| TypeScript 编译 | ✅ 无错误 (`tsc --noEmit` 通过) |
| UI 文本确认 | ✅ 已全面更替为简体中文 |
| 强制要求 AI 分析功能 | ✅ SWOT 四象限及三类图表在无 AI 结果时皆能正确回退至占位符展示 |

---

## 使用说明

1. 载入评估数据。
2. 切換至上方「**深度分析**」标签。
3. 未进行 AI 分析时，您将看到所有的图表和 SWOT 皆由于无数据而显示“等待 AI 深度分析生成...”。
4. 点击「立即 AI 分析」（或若符合条件系统会自动触发），等待进度条完成后。
5. SWOT 将会自动填入由 DeepSeek API 基于完整 prompts 计算并返回的四大象限；而 PESTEL/4P/VRIO 本身的图表也会正确显示。
