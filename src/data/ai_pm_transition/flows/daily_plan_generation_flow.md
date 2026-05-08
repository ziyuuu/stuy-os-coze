# 日计划生成流程

本流程用于从已确认周计划派生当天学习安排。

日计划是周计划的当日执行切片，不是新的学习战略。日计划回答“今天做什么、如何完成、如何检查、晚上如何复盘”，不得新增上级计划之外的目标，不得把计划内容写成完成事实。

## 1. 触发条件

日计划必须由用户明确触发。

允许触发表达包括：

- 日计划
- 制定今日计划
- 生成明日计划
- Daily Startup
- 从当前周计划派生当天计划

不得自动触发：

- 不因日期变化自动生成。
- 不因周计划已确认而自动生成。
- 不因存在周备课而自动生成。
- 不连续自动生成多日计划。

## 2. 前置状态检查

生成日计划前必须检查：

- `current_status.md` 是否允许进入日计划生成或日常执行。
- `current_week_plan.md` 是否为已批准或用户明确指定的当前周计划。
- `current_month_plan.md` 是否为正式已确认月计划。
- `current_stage.md` 是否与当前月计划一致。
- 是否存在最近一次已确认日复盘、周复盘或月复盘，可作为调整输入。
- 用户本轮是否提供当天可投入时间、精力状态、现实约束或偏好。

如果周计划不存在、上级计划未确认、状态文件不允许进入日计划，或上级文件之间存在冲突，不得生成正式日计划，只能输出阻塞说明或候选准备说明。

## 3. 读取顺序与输入

必读文件按以下顺序读取：

- `mvp_memory/ai_pm_transition/current_status.md`
- `mvp_memory/ai_pm_transition/current_stage.md`
- `mvp_memory/ai_pm_transition/current_month_plan.md`
- `mvp_memory/ai_pm_transition/current_week_plan.md`
- `mvp_memory/ai_pm_transition/templates/daily_plan_template.md`
- `mvp_memory/ai_pm_transition/methodologies/methodology_index.md`

存在时必读：

- 当前月备课目录：`mvp_memory/ai_pm_transition/lesson_prep_notes/YYYY/month_lesson_prep_YYYY_MM/`
- 当前周备课：`mvp_memory/ai_pm_transition/lesson_prep_notes/YYYY/weekly_lesson_prep_YYYY_MM_DD.md`
- 最近一次已确认日复盘：`mvp_memory/ai_pm_transition/reviews/`
- 最近一次已确认周复盘：`mvp_memory/ai_pm_transition/weekly_reviews/`
- 最近一次已确认月复盘：`mvp_memory/ai_pm_transition/monthly_reviews/`
- 当前用户明确提供的现实约束、时间约束或节奏偏好

周备课和月备课只提供教学、练习和检查支持，不替代日计划。日计划仍必须以 `current_week_plan.md` 和 `current_status.md` 为直接上游。

## 4. 生成判断

生成日计划前，Codex 必须先做一次日计划判断：

- 今天对应当前周计划中的哪个目标、练习和产出。
- 今天服务哪个月目标和学习模块。
- 今天最多安排哪些 1-3 个关键任务。
- 今天应形成哪些可观察证据。
- 今天调用哪些资源，调用到什么程度。
- 今天需要哪些脚手架、示例、反例或检查问题。
- 今天是否需要降密度、拆分任务或只做补缺。
- 最近复盘事实是否要求调整任务、资源或脚手架。
- 哪些事项需要用户确认后才能进入日计划。

不得把周计划目标、备课内容、历史资产存在或计划中的产出写成已完成事实。

## 5. 输出结构

日计划必须使用 `templates/daily_plan_template.md` 的字段结构。

日计划至少包含：

- 日期。
- 来源上下文。
- 今日目标。
- 学习内容。
- 练习动作。
- 观察点。
- 完成标准。
- 今日边界。
- 复盘入口。

每个今日目标必须能追溯到：

- 当前周目标。
- 当前月目标。
- 月计划模块。
- 预期证据。
- 检查标准。

## 6. 教学与负荷规则

日计划默认采用：

```text
先回忆 -> 再应用 -> 再查漏 -> 再修正
```

规则：

- 单日只安排有限关键任务，默认 1-3 个。
- 学习内容必须服务当天练习和证据，不以阅读量、课程量作为能力证据。
- 练习动作必须能形成可观察证据。
- 弱阶段或低精力日优先做启动、整理、补缺、检查和收敛。
- 强阶段可提高练习和产出密度，但不得把周目标全部压入单日。
- 日计划不得把产品、AI、代码、eval、用户研究和求职表达一次性压入同一天。

## 7. 保存与状态规则

正式日计划可保存到：

```text
mvp_memory/ai_pm_transition/daily_plans/YYYY/daily_plan_YYYY_MM_DD.md
```

保存前必须确保：

- 用户已明确要求生成正式日计划。
- 上级计划和状态文件允许日计划生成。
- 日计划没有新增月目标、周目标或核心产出。
- 日计划没有记录完成事实。
- 不修改 `master_plan.md`、`annual_plan.md`、`current_month_plan.md` 或 `current_week_plan.md`。

生成日计划本身不得更新 `current_status.md`。日复盘后如需状态更新，必须依据用户事实和用户确认。

## 8. 禁止事项

日计划不得：

- 新增上级计划没有确认的目标、模块或核心产出。
- 启动未授权的正式用户访谈、主作品集、复杂 Demo、RAG 或 Agent 实验。
- 把课程、书籍或资源完成量写成目标。
- 把旧资产存在写成当前能力证据。
- 自动生成日备课或日复盘。
- 自动生成后续多日计划。
- 修改原始周计划、月计划、年度计划或总计划。
- 记录完成事实或复盘结论。

## 9. 验证清单

日计划完成前应检查：

- 是否由用户明确触发。
- 是否读取了当前状态、当前阶段、当前月计划和当前周计划。
- 当前周计划是否存在并允许派生日计划。
- 每个目标是否对应周目标、月目标、模块、证据和检查标准。
- 是否只安排当天任务。
- 是否控制了认知负荷。
- 是否只把资源作为任务支撑，而不是完成目标。
- 是否没有记录完成事实。
- 是否没有启动未授权事项。
