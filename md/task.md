# 投资分析评估页面 (In-depth Analysis) 改造任务清单

## 任务清单

- [x] 更新实施计划 (implementation_plan.md) 并提交审核
- [x] 修改 `webapp/src/app/app/evaluate/page.tsx`
  - [x] 更新 `aiSections` 接口定义，加入 `strengths` 与 `weaknesses`
  - [x] 调整 `generateAIPrompt`，新增 SWOT 内部优势、劣势的生成指令，总共输出 1~13 点，均使用简体中文。
  - [x] 调整 `parseAIResponse`，加入提取 `strengths` 与 `weaknesses` 的逻辑，匹配相应的关键字。
  - [x] 调整 `generateSwot` (如果需要) 或者直接修改 UI 中 SWOT 矩阵的渲染逻辑，全部强制使用 `aiSections`，无数据时显示占位文本。
  - [x] 调整图表数据 `pestelChartData`, `fourPChartData`, `vrioChartData`，无 AI 数据时全填 `0`。
  - [x] 将「分析」Tab 的所有 UI 文字（包括子标签、占位文本等）全面转为简体中文。
- [x] 运行 TypeScript 编译检查
- [x] 手动/目视验证 UI 显示是否符合预期
