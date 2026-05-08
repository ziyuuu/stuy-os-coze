# AI PM Transition Resource Catalog V0.1

## 1. 文件定位

本文件是 `ai_pm_transition/` 的资源候选池，用于沉淀 AI PM 转型相关资源的候选、复核状态、使用边界和阶段建议。

本文件不是固定课程表，不是已批准学习任务，也不是年度、月度、周度或日度计划。任何资源进入下级计划前，都必须结合当时目标、阶段、时间投入、版本状态和版权边界进行二次复核。

本文件基于：

- `mvp_memory/ai_pm_transition/resources/source_materials/资源.md`
- `mvp_memory/ai_pm_transition/resources/source_materials/ai_pm_course_research_2026-05-06.md`
- `mvp_memory/ai_pm_transition/master_plan.md`

## 2. 资源选择原则

- 能力缺口 → 练习任务 → 作品集证据 → 资源选择。先判断要补什么能力，再设计练习和证据，最后选择资源。
- 稳定资源和高时效资源分开管理。产品基础书籍、经典框架和成熟实践相对稳定；LLM、RAG、Agent、eval、AI coding 和 Demo 工具必须更频繁复核。
- 课程不能替代练习。课程、书籍和教程只提供输入，必须通过 PRD、访谈、原型、Demo、eval、用户反馈或作品集材料形成证据。
- 官方文档优先。AI 技术、API、RAG、Agent、eval、安全和 Responsible AI 相关资源优先使用官方文档、官方教程和维护活跃的开源文档。
- 课程资源优先 Coursera。用户已购入 Coursera 会员，支付和访问成本更低；在课程质量、目标适配度、更新时间和练习价值相近时，优先选择 Coursera 课程。但 AI 技术、API、RAG、Agent、eval 和安全边界仍以官方文档为准，课程不能替代官方文档和实践。
- 资源进入年度、阶段、月、周或日计划前必须二次复核，检查日期、版本、作者、机构、费用、许可、实践价值和目标匹配度。
- 不使用盗版、侵权、未经授权课程、电子书、聚合资料或付费内容全文。
- 不随意采集用户学习数据。用户访谈、Demo 测试和作品集反馈必须授权、匿名化、最小化，并只展示脱敏、聚合或授权内容。

## 3. 资源进入 4C/ID 学习闭环的规则

资源不是独立学习目标，而是支持 AI PM 转型任务的输入材料。每个资源进入下级计划前，必须明确它服务 4C/ID 中的哪一类作用：

- 支撑完整任务：帮助理解当前 C 端 AI 产品问题、用户场景、产品机会或作品集项目。
- 提供系统知识：补充产品发现、用户研究、C 端体验、AI 技术、eval、数据边界和求职表达等课程支撑线。
- 提供程序性脚手架：提供模板、步骤、检查表、反例、案例拆解方法或操作方法。
- 支持局部专项练习：用于补强访谈、JTBD、指标、RAG、Agent、eval、Demo、求职表达等短板。

资源是否有效，不以“看完”为标准，而以是否能转化为问题判断、产品文档、实验结果、eval 证据、Demo 证据、用户反馈、复盘结论或作品集表达为标准。

不采用：

```text
热门课程 → 学习安排 → 假设能力提升
```

采用：

```text
能力缺口 → 练习任务 → 作品集证据 → 资源选择
```

本文件只建立资源候选池和复核机制，不把具体课程、博客、书籍、训练营或工具写成已批准必学清单。资源进入年度计划、阶段计划、月计划或周计划前，需要二次复核。

## 4. Resource Catalog Overview

本概览统计业务资源候选，不包含 `RULE-*` 规则型条目。规则型条目用于把资源选择、版权、数据和复核边界纳入同一候选池口径。

| Module | Count | Notes |
| --- | ---: | --- |
| 产品基础 | 15 | 覆盖产品发现、访谈、精益、MVP、Backlog、Roadmap、指标和既有学习资产 |
| C 端产品 | 13 | 覆盖用户研究、UX、增长、AARRR、AI 学习产品、生产力产品、用户引导、原型和实验 |
| AI PM / AI-native 产品 | 14 | 覆盖 AI PM 课程、AI 产品生命周期、AI UX、Responsible AI、Human Factors、GenAI 通识和 AI PM 能力模型 |
| LLM / RAG / Agent / Eval / Demo | 12 | 覆盖 OpenAI、LangChain、LlamaIndex、向量库、eval、vibe coding 和 Web Demo 工具 |
| 作品集与求职表达 | 5 | 覆盖作品集结构、案例讲述、Demo 视频、简历和岗位匹配 |
| 学习方法论与自我调节 | 8 | 覆盖习惯设计、刻意练习、复杂概念学习、项目制学习、反思性实践和知识外化 |
| 不推荐 / 谨慎资源 | 8 | 覆盖过时教程、营销训练营、盗版、无出处路线图等 |

## 5. Full Resource Catalog

字段口径：

- `Status` 使用 `resource_review.md` 中定义的候选状态枚举。
- `Freshness` 使用 `resource_review.md` 中定义的新鲜度枚举。
- `Recommendation` 使用 `resource_review.md` 中定义的复核输出枚举。
- `Status` 和 `Recommendation` 不代表资源已进入学习计划；任何资源进入下级计划前都必须二次复核。

| Resource ID | Resource Name | URL / Source | Type | Module | Phase | Status | Authority | Freshness | Difficulty | Language | Cost | Why Learn | Practice Output | Portfolio Evidence | Risk / Boundary | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PF-001 | Inspired / 《启示录》 | Book; source from existing learning assets | Book | Product Fundamentals | Phase 0 / Phase 1 | previously_used | High | stable | intermediate | EN / CN | paid | 复习产品发现、产品经理角色、机会判断和可行性 / 可用性 / 商业价值取舍。 | 产品发现摘要、机会判断练习 | 产品发现方法说明、项目机会判断框架 | 不能摘录大段原文；需结合当前项目练习 | include_in_catalog |
| PF-002 | The Mom Test | Book; source from existing learning assets | Book | Product Fundamentals | Phase 0 / Phase 1 | previously_used | High | stable | beginner | EN / CN | paid | 复习非诱导式用户访谈，避免把愿望和赞美误判为需求。 | 访谈提纲、问题清单 | 用户访谈方法说明、轻量访谈记录 | 不能把正式用户访谈提前到 Phase 0；需授权记录 | include_in_catalog |
| PF-003 | The Lean Startup / 《精益创业》 | Book / official summaries | Book | Product Fundamentals | Phase 1 | candidate | High | stable | beginner | EN / CN | paid | 复习 MVP、验证性学习、假设验证和迭代思路。 | MVP 假设表、验证计划 | 主项目 MVP 决策依据 | 经典案例较旧，需结合 AI 产品场景理解 | include_in_catalog |
| PF-004 | Lean Product / PMF materials | Existing notes and public materials | Notes / Articles | Product Fundamentals | Phase 0 / Phase 1 | previously_used | Medium | stable | intermediate | CN / EN | mixed | 恢复 PMF、问题空间 / 方案空间和产品验证基础。 | PMF 判断练习、问题空间拆解 | 项目验证逻辑和阶段目标 | 来源分散，需整理和复核 | review_before_use |
| PF-005 | Atlassian Agile / Backlog / Roadmap guides | https://www.atlassian.com/agile | Official guide | Product Fundamentals | Phase 0 / Phase 1 | high_priority_candidate | High | quarterly_review | beginner | EN | free | 复习 Backlog、Roadmap、Scrum 和敏捷交付表达。 | Backlog、用户故事、Roadmap 初稿 | 产品执行和规划证据 | 官方材料偏工具实践，需避免替代产品判断 | include_in_catalog |
| PF-006 | SVPG / Marty Cagan articles | https://svpg.com/articles/ | Expert blog | Product Fundamentals | Phase 0 / Phase 1 | auxiliary | High | quarterly_review | intermediate | EN | free | 补充 Inspired 相关产品发现、团队和产品文化观点。 | 文章摘要、原则提炼 | 产品原则和方法论引用 | 观点型内容需结合实际练习 | include_as_auxiliary |
| PF-011 | Digital Product Management: Modern Fundamentals | https://www.coursera.org/learn/uva-darden-digital-product-management?specialization=uva-darden-digital-product-management | Course | Product Fundamentals | Phase 0 | previously_used | High | quarterly_review | beginner | EN | Included with Coursera Plus / paid subscription; user has Coursera membership | 复习现代产品管理的基本框架、产品经理角色、产品焦点与机会判断。 | 产品焦点练习、产品机会判断、课程笔记复盘 | 产品基础恢复证据、问题定义方法来源说明 | 已学部分只做回查和复盘，不重学 | review_before_use |
| PF-012 | Agile Meets Design Thinking | https://www.coursera.org/learn/uva-darden-getting-started-agile?specialization=uva-darden-digital-product-management | Course | Product Fundamentals | Phase 0 | previously_used | High | quarterly_review | beginner | EN | Included with Coursera Plus / paid subscription; user has Coursera membership | 复习敏捷与设计思维如何结合，用于问题场景、persona、user story 和 prototype 的基础表达。 | persona / problem scenario 练习、用户故事、轻量原型说明 | 产品表达和协作方法证据 | 已学部分只做回查，不把课程本身当成果 | review_before_use |
| PF-013 | Hypothesis-Driven Development | https://www.coursera.org/learn/uva-darden-agile-testing?specialization=uva-darden-digital-product-management | Course | Product Fundamentals | Phase 1 | candidate | High | quarterly_review | intermediate | EN | Included with Coursera Plus / paid subscription; user has Coursera membership | 学习如何提出可检验假设，并用定性 / 定量方法做验证。 | 假设表、验证计划、设计冲刺练习 | 假设驱动验证方法证据 | 进入计划前需确认与当前 product idea 的匹配度 | review_before_use |
| PF-014 | Product Analytics and AI | https://www.coursera.org/learn/uva-darden-agile-analytics?specialization=uva-darden-digital-product-management | Course | Product Fundamentals | Phase 1 | candidate | High | quarterly_review | intermediate | EN | Included with Coursera Plus / paid subscription; user has Coursera membership | 学习把产品工作和可行动分析连接起来，理解如何用分析支持 AI 相关产品判断。 | 指标映射、分析练习、埋点思路 | 指标设计和分析证据 | 不把分析替代产品判断；需结合当前任务使用 | review_before_use |
| PF-015 | Managing an Agile Team | https://www.coursera.org/learn/uva-darden-agile-team-management?specialization=uva-darden-digital-product-management | Course | Product Fundamentals | Phase 1 | candidate | High | quarterly_review | intermediate | EN | Included with Coursera Plus / paid subscription; user has Coursera membership | 学习如何建立团队章程、对齐目标、协作节奏和跨职能沟通。 | team charter、协作节奏、角色分工练习 | 执行和协作方法证据 | 不把团队管理课程替代产品练习 | review_before_use |
| PF-016 | Escaping the Build Trap / 《逃离建造陷阱》 | Book; source from existing learning assets | Book | Product Fundamentals | Phase 1 / Phase 2 | candidate | High | stable | intermediate | EN / CN | paid | 复习产品策略、结果导向、产品价值与路线图取舍，避免把产品做成功能堆叠。 | 产品策略摘要、问题-结果映射、路线图判断练习 | 产品方向与路线图决策说明 | 只用于策略判断，不做全文精读 | include_in_catalog |
| PF-008 | JTBD / Jobs To Be Done materials | Existing notes and public materials | Framework / Articles | Product Fundamentals | Phase 1 / Phase 2 | previously_used | Medium | stable | intermediate | EN / CN | mixed | 用于用户任务、场景、动机和替代方案拆解。 | JTBD 陈述、用户任务表 | C 端机会判断和用户场景证据 | 来源分散，需补充权威来源 | review_before_use |
| PF-009 | HEART / AARRR / North Star Metric materials | Existing notes and public materials | Framework / Articles | Product Fundamentals | Phase 1 / Phase 2 | previously_used | Medium | quarterly_review | intermediate | EN / CN | mixed | 建立体验、增长和产品指标设计能力。 | 指标树、HEART 指标表 | 主项目指标体系 | 指标框架不能脱离具体产品目标 | include_in_catalog |
| PF-010 | Product Management Playbook 1.0.0 | User-owned source material | User asset | Product Fundamentals | Phase 0 | previously_used | User-owned | stable | intermediate | CN | free | 复盘用户已沉淀的产品方法论，识别可继承与需补强部分。 | Playbook 复盘版、缺口清单 | 产品基础恢复证据 | 不能把旧内容直接视为稳定能力 | include_in_catalog |
| CP-001 | NN/g User Interviews 101 | https://www.nngroup.com/articles/user-interviews/ | Expert article | Consumer Product | Phase 2 | high_priority_candidate | High | quarterly_review | beginner | EN | free | 学习用户访谈目标、结构和洞察提炼。 | 用户访谈计划、访谈提纲 | 用户研究方法证据 | 访谈需授权和匿名化 | include_in_catalog |
| CP-002 | NN/g UX research method selection | https://www.nngroup.com/articles/which-ux-research-methods/ | Expert article | Consumer Product | Phase 2 | candidate | High | quarterly_review | intermediate | EN | free | 区分定性 / 定量、态度 / 行为研究方法，选择合适验证方式。 | 研究方法选择表 | 用户研究方案 | 不能替代真实研究设计 | include_in_catalog |
| CP-003 | Coursera Advanced UX Strategies for Product Managers | Coursera course; URL in source material incomplete | Course | Consumer Product | Phase 2 | review_required | Medium | quarterly_review | intermediate | EN | paid / audit possible | 补强用户旅程、情绪图、JTBD 访谈、Figma 原型等 UX 能力。 | UX 评估文档、原型练习 | 用户旅程和交互原型 | 费用、更新时间和课程内容需检查 | review_before_use |
| CP-004 | Mixpanel AARRR / Pirate Metrics article | https://mixpanel.com/blog/aarrr/ | Tool blog | Consumer Product | Phase 2 | auxiliary | Medium | high_risk_outdated | beginner | EN | free | 理解 AARRR 的基础漏斗思路。 | 漏斗拆解练习 | 增长指标说明 | 资料较旧，必须结合新资源使用 | include_as_auxiliary |
| CP-005 | Amplitude Pirate Metrics / AARRR guide | https://amplitude.com/blog/pirate-metrics | Tool blog | Consumer Product | Phase 2 | high_priority_candidate | High | quarterly_review | beginner | EN | free | 用较新增长分析材料补充 AARRR 和数据驱动产品增长。 | Funnel / Cohort 模拟分析 | 增长策略和指标证据 | 工具厂商内容可能带产品视角 | include_in_catalog |
| CP-006 | Duolingo Max official blog | https://blog.duolingo.com/duolingo-max/ | Official product case | Consumer Product | Phase 2 / Phase 4 | high_priority_candidate | High | quarterly_review | beginner | EN | free | 学习 AI 学习产品如何用 GPT-4 做角色扮演和解释功能。 | AI 学习产品案例拆解 | 主项目竞品 / 参考案例 | 只能参考公开内容，不能复制界面或专有内容 | include_in_catalog |
| CP-007 | Notion AI product case analysis | Medium / Design Bootcamp; URL in source material incomplete | Case article | Consumer Product | Phase 2 / Phase 4 | review_required | Medium | quarterly_review | intermediate | EN | free / metered | 学习 AI 生产力产品如何嵌入摘要、生成、继续写作和搜索体验。 | 功能流程图、体验拆解 | AI 个人效率方向案例 | 非官方文章，URL、作者和日期需复核 | review_before_use |
| CP-008 | Intercom onboarding / activation resources | Source incomplete in resource.md | Blog / Guide | Consumer Product | Phase 2 | review_required | Medium | quarterly_review | intermediate | EN | mixed | 用于学习用户引导、激活、留存和首日体验设计。 | Onboarding 流程、激活假设 | C 端体验与留存设计证据 | URL、作者、日期和商业偏向需复核 | review_before_use |
| CP-009 | C 端 AI learning / personal growth product cases | Case pool to be built | Case collection | Consumer Product | Phase 2 / Phase 4 | review_required | Medium | quarterly_review | intermediate | CN / EN | mixed | 为 AI 学习、求职、个人成长、知识消费方向建立案例库。 | 竞品拆解、机会判断 | 主项目定位和差异化证据 | 需要后续补充具体案例和来源 | review_before_use |
| CP-010 | User Experience: Research & Prototyping | https://www.coursera.org/learn/user-research | Course | Consumer Product | Phase 2 | high_priority_candidate | High | quarterly_review | beginner | EN | Coursera subscription / certificate paid; financial aid possible | 学习用户研究、用户中心设计、访谈、故事板、原型和可用性测试的基础方法。 | 用户研究摘要、低保真原型、可用性测试练习 | 支撑关键流程体验设计和原型表达 | 课程偏基础，适合作为 P2 体验输入主课之一 | include_in_catalog |
| CP-011 | UX Research at Scale: Surveys, Analytics, Online Testing | https://www.coursera.org/learn/ux-research-at-scale | Course | Consumer Product | Phase 2 | high_priority_candidate | High | quarterly_review | beginner | EN | Coursera subscription / certificate paid; financial aid possible | 学习大规模用户研究、问卷、网页分析、A/B 测试和远程非主持测试。 | 调研方案、A/B 测试草案、体验验证摘要 | 支撑体验验证与指标判断 | 课程侧重方法与实验设计，需和真实问题结合 | include_in_catalog |
| CP-012 | User Segmentation, Experimentation, and Retention Analytics | https://www.coursera.org/learn/user-segmentation-experimentation-and-retention-analytics | Course | Consumer Product | Phase 2 | candidate | High | quarterly_review | intermediate | EN | Coursera subscription / certificate paid; financial aid possible | 学习用户分群、A/B 测试、留存分析和实验偏差识别。 | 分群练习、实验设计、留存分析摘要 | 支撑体验验证、留存判断和实验解释 | 偏数据分析，需与产品场景一起用；不应替代产品判断 | review_before_use |
| CP-013 | Metrics that Matter: Improving Product Outcomes | https://www.coursera.org/learn/metrics-that-matter-improving-product-outcomes | Course | Consumer Product | Phase 2 | candidate | High | quarterly_review | beginner | EN | Coursera subscription / certificate paid; financial aid possible | 学习如何用指标支撑决策、对齐团队和衡量产品结果。 | 指标说明、结果指标草案 | 支撑体验指标与结果导向表达 | 侧重敏捷与结果指标，需结合候选问题使用 | review_before_use |
| AI-001 | Product Management: Building AI-Powered Products | https://www.coursera.org/learn/product-management-building-ai-powered-products | Course | AI PM / AI-native Product | Phase 1 / Phase 3 | high_priority_candidate | High | quarterly_review | beginner | EN | Included with Coursera Plus / paid subscription; user has Coursera membership | 学习 AI PM 角色、AI 价值主张、AI product lifecycle、AI 团队协作、ROI、失败原因和商业化。 | AI PM 角色说明、AI 产品生命周期摘要、AI 机会 / 风险清单 | AI 产品策划框架、主项目 AI 取舍说明 | 使用前复核课程结构和作业要求；不能替代实际小实验 | include_in_catalog |
| AI-002 | Generative AI for Product Managers Specialization | https://www.coursera.org/specializations/generative-ai-for-product-managers | Course series | AI PM / AI-native Product | Phase 3 | high_priority_candidate | High | quarterly_review | intermediate | EN | Included with Coursera Plus / paid subscription; user has Coursera membership | 系统学习 GenAI 模型、Prompt、AI PM 工作流、AI 产品机会和 PM 场景中的生成式 AI 应用。 | GenAI PM 学习笔记、Prompt / PM 工作流练习、AI 产品机会草案 | AI PM 专项能力证据、主项目 AI 功能取舍 | 专项较长，按模块选用；不要求完整学完 | include_in_catalog |
| AI-003 | Microsoft Responsible AI / HAX Toolkit | Microsoft official resources | Official guide | AI PM / AI-native Product | Phase 3 / Phase 4 | high_priority_candidate | High | quarterly_review | intermediate | EN | free | 学习 AI 交互、人类控制、透明度、错误处理和 Responsible AI。 | AI 风险清单、交互边界设计 | AI UX 和安全边界证据 | 需确认最新版本和具体文档链接 | review_before_use |
| AI-004 | Google Responsible AI / Gemini product docs | Google official resources | Official docs | AI PM / AI-native Product | Phase 3 | candidate | High | quarterly_review | intermediate | EN | free | 理解多模态、模型能力、Responsible AI 和 Google AI 产品参考。 | 模型能力对比、风险清单 | AI 产品方案中的模型选择依据 | 具体链接和版本需补全 | review_before_use |
| AI-005 | Anthropic / Claude official docs | https://docs.anthropic.com/ | Official docs | AI PM / AI-native Product | Phase 3 | high_priority_candidate | High | monthly_review | intermediate | EN | free / API paid | 学习 Claude 模型使用、提示、安全边界和工具调用。 | 模型能力比较、Prompt 实验 | AI 产品模型选择和安全边界 | 技术更新快，使用前复核版本 | include_in_catalog |
| AI-006 | AI PM ability model articles | Woshipm / expert blogs from source material | Articles | AI PM / AI-native Product | Phase 0 / Phase 3 | review_required | Medium | quarterly_review | intermediate | CN / EN | free | 建立 AI PM 与传统 PM 的能力差异、岗位类型和作品集要求。 | 个人能力地图 | 求职能力叙事 | 文章质量、作者和日期需逐篇复核 | review_before_use |
| AI-007 | AI product case articles | Source material references to AI product / AI PM cases | Case articles | AI PM / AI-native Product | Phase 3 / Phase 4 | review_required | Medium | quarterly_review | intermediate | CN / EN | mixed | 学习 AI 产品从 0 到 1、指标、eval、商业化和失败案例。 | 案例拆解、产品机会判断 | 主项目案例对照 | 来源分散，不能直接采信单篇观点 | review_before_use |
| AI-008 | Duke / Coursera AI Product Management Specialization | https://www.coursera.org/specializations/ai-product-management-duke | Course series | AI PM / AI-native Product | Phase 3 | candidate | High | quarterly_review | beginner | EN | Coursera subscription / certificate paid; financial aid possible | 作为 AI PM 专项备选课程，系统学习 ML 产品设计与开发管理，覆盖 ML 适用性判断、数据科学流程、AI 项目管理、人本 AI、隐私和伦理。 | AI PM 专项学习笔记、ML 产品机会判断、AI 项目计划草案、Human Factors 风险清单 | AI 产品生命周期说明、主项目 AI 方案取舍、隐私 / 伦理 / 用户信任设计依据 | 备选项，不作为 Phase 3 默认主线；课程偏 ML 产品管理，进入计划前需确认是否服务 C 端 AI / LLM / Agent 作品集；需检查费用、时长和最新课程结构 | review_before_use |
| AI-009 | Machine Learning Foundations for Product Managers | https://www.coursera.org/learn/machine-learning-foundations-for-product-managers | Course | AI PM / AI-native Product | Phase 3 | candidate | High | quarterly_review | intermediate | EN | Coursera subscription / certificate paid; financial aid possible | 为产品经理建立非编码 ML 基础，理解机器学习类型、常见算法、建模挑战、模型评估和解释。 | ML 概念对照表、模型适用性判断、模型评估指标小练习 | 说明主项目何时需要 ML / 何时不需要 ML、模型评估指标解释 | 课程偏传统 ML，不等同于 LLM / RAG / Agent；需避免过度技术化或转向工程路线 | review_before_use |
| AI-010 | Managing Machine Learning Projects | https://www.coursera.org/learn/managing-machine-learning-projects | Course | AI PM / AI-native Product | Phase 3 | candidate | High | quarterly_review | intermediate | EN | Coursera subscription / certificate paid; financial aid possible | 学习如何识别 ML 机会、组织 ML 项目、处理数据、技术选型、部署、监控和维护。 | ML 项目计划、数据需求清单、模型监控 / 维护风险表 | 主项目或备选 case 的 AI 项目管理说明、数据和模型生命周期取舍 | 偏 ML 项目管理，使用前需判断是否适配当前作品集 Demo；不应替代 LLM / RAG 官方文档学习 | review_before_use |
| AI-011 | Human Factors in AI | https://www.coursera.org/learn/human-factors-in-artificial-intelligence | Course | AI PM / AI-native Product | Phase 3 / Phase 4 | candidate | High | quarterly_review | beginner | EN | Coursera subscription / certificate paid; financial aid possible | 作为 Duke AI PM 专项中的备选子课，学习人本 AI、AI UX、透明度、不确定性沟通、隐私、伦理、偏见、用户信任和人机增强。 | AI 用户体验风险清单、隐私 / 伦理分析、信任和透明度设计 | 主项目 AI 交互边界、失败兜底、隐私和用户信任说明 | 备选项，使用前需复核课程版本和作业要求；作品集展示必须遵守用户数据最小化和匿名化 | review_before_use |
| AI-012 | IBM AI Product Manager Professional Certificate | https://www.coursera.org/professional-certificates/ibm-ai-product-manager | Professional certificate | AI PM / AI-native Product | Phase 3 / Phase 5 | candidate | High | quarterly_review | beginner | EN | Included with Coursera Plus / paid subscription; user has Coursera membership | 作为 AI PM 证书型总览候选，覆盖产品管理、AI 基础、GenAI、AI powered products、PM 职业表达和综合项目。 | AI PM 能力地图、课程项目筛选、求职表达参考 | AI PM 能力叙事和简历证书候选 | 内容较长，不能整体压入 P3；只选 AI PM 相关模块，避免重复产品基础课程 | review_before_use |
| AI-013 | Generative AI: Supercharge Your Product Management Career | https://www.coursera.org/learn/generative-ai-supercharge-your-product-management-career | Course | AI PM / AI-native Product | Phase 2 / Phase 3 / Phase 4 | high_priority_candidate | High | quarterly_review | intermediate | EN | Included with Coursera Plus / paid subscription; user has Coursera membership | 学习 GenAI 如何改善 PM 的 ideation、PRD、协作、用户体验和产品生命周期工作，并包含 guided project。 | GenAI PM 工作流练习、AI 辅助 PRD / idea / CX 练习 | AI-assisted PM 工作证据、主项目方案生成和取舍说明 | 只作为 AI PM 工作流输入，不把工具使用本身当能力证据 | include_in_catalog |
| AI-014 | AI Product Management: The Complete Handbook | https://www.coursera.org/learn/packt-ai-product-management-the-complete-handbook | Course | AI PM / AI-native Product | Phase 3 / Phase 4 | review_required | Medium | quarterly_review | intermediate | EN | Included with Coursera Plus / paid subscription; user has Coursera membership | 作为 AI PM 总览候选，覆盖 AI-native 产品、AI 产品策略、模型维护、商业化、指标、成本和管理。 | AI-native 产品框架摘要、AI 产品成本 / 指标 / 商业化检查表 | 主项目 AI 产品化说明、B 端备选 case 参考 | Packt / 课程质量需复核；只选和当前作品集相关模块 | review_before_use |
| TECH-001 | OpenAI Prompt Engineering best practices | https://help.openai.com/articles/10032626-prompt-engineering-best-practices-for-chatgpt | Official help doc | LLM / Prompt | Phase 3 | high_priority_candidate | High | monthly_review | beginner | EN | free | 学习清晰指令、迭代提示和输出格式控制。 | Prompt 对比实验 | Prompt 优化记录 | 官方文档更新快，使用前检查版本 | include_in_catalog |
| TECH-002 | OpenAI Developer Prompting guide | https://platform.openai.com/docs/guides/prompting | Official docs | LLM / Prompt | Phase 3 | high_priority_candidate | High | monthly_review | intermediate | EN | free / API paid | 学习面向开发者的提示策略、上下文和结构化输出。 | 系统提示、任务提示模板 | AI Chat UX 和 Demo 提示证据 | API 和文档可能更新 | include_in_catalog |
| TECH-003 | OpenAI Retrieval / Vector Stores / File Search docs | OpenAI platform docs; exact current URL review required | Official docs | RAG / Retrieval | Phase 3 / Phase 4 | review_required | High | monthly_review | intermediate | EN | free / API paid | 学习语义检索、文件检索、向量存储和引用来源能力。 | RAG 小 Demo、检索测试 | RAG / 知识消费 Demo 证据 | 资源.md 中 URL 可能过时，需确认当前文档路径 | review_before_use |
| TECH-004 | OpenAI Evals / evaluation resources | OpenAI official / GitHub resources | Official / Open source | Eval | Phase 3 / Phase 4 | high_priority_candidate | High | monthly_review | intermediate | EN | free | 学习测试集、rubric、模型输出评估和自动化评测思路。 | eval 测试集、rubric | eval 报告和迭代证据 | 需确认当前维护状态和工具适配 | review_before_use |
| TECH-005 | LangChain official RAG tutorial | https://python.langchain.com/ | Official docs / tutorial | RAG / Agent | Phase 3 / Phase 4 | high_priority_candidate | High | monthly_review | intermediate | EN | free | 学习用 LangChain 构建 RAG / Agent 原型。 | RAG 问答原型 | Demo 链路和技术选型说明 | 版本变动频繁，代码需使用前复核 | include_in_catalog |
| TECH-006 | LangChain OpenAI RAG strategies blog | https://blog.langchain.com/applying-openai-rag/ | Official blog | RAG | Phase 3 | auxiliary | High | high_risk_outdated | advanced | EN | free | 理解查询扩展、HyDE、路由、多数据源等 RAG 策略。 | RAG 策略对比表 | RAG 方案取舍说明 | 内容较旧，需对照最新 LangChain / OpenAI 文档 | include_as_auxiliary |
| TECH-007 | LlamaIndex official docs | https://docs.llamaindex.ai/ | Official docs | RAG / Data connectors | Phase 3 / Phase 4 | candidate | High | monthly_review | intermediate | EN | free | 学习知识库、索引、数据连接和检索流程。 | 数据连接 Demo、索引设计 | 知识库 / RAG 项目证据 | 版本更新快，使用前复核 | include_in_catalog |
| TECH-008 | Pinecone / Weaviate / Milvus vector database docs | Official docs for each vendor | Official docs | Vector DB | Phase 3 / Phase 4 | candidate | High | monthly_review | intermediate | EN | free / paid tiers | 学习 Embedding、向量索引、检索和向量库选择。 | 向量检索实验 | RAG Demo 技术说明 | 厂商内容有产品偏向，需比较多个来源 | include_in_catalog |
| TECH-009 | LangChain / LlamaIndex GitHub examples | GitHub official / community examples | Open source examples | RAG / Agent / Demo | Phase 4 | review_required | Medium | monthly_review | intermediate | EN | free | 借鉴可运行 RAG / Agent Demo 结构，加速原型。 | Demo 项目、运行记录 | 可运行 Demo 和技术取舍 | 需检查许可证、依赖版本和维护状态 | review_before_use |
| TECH-010 | Cursor / Codex / AI-assisted coding guides | Tool official docs and current tutorials | Official docs / Tutorials | Demo / Vibe coding | Phase 4 | review_required | Medium | monthly_review | beginner | EN / CN | mixed | 支持 vibe coding 和 AI-assisted prototyping，不走传统工程训练路线。 | 简单 Web Demo、开发记录 | Demo 制作过程证据 | 工具更新快，需确认费用和最新能力 | review_before_use |
| TECH-011 | Next.js / Vercel simple Web Demo docs | https://nextjs.org/docs and https://vercel.com/docs | Official docs | Web Demo | Phase 4 | candidate | High | quarterly_review | intermediate | EN | free / paid tiers | 用于构建和部署简单 Web Demo。 | 可访问 Demo 页面 | Demo 链接或视频 | 只用于作品集原型，不扩展为工程主线 | include_in_catalog |
| TECH-012 | Supabase / Firebase docs | Official docs | Official docs | Web Demo / Data | Phase 4 | auxiliary | High | quarterly_review | intermediate | EN | free / paid tiers | 为 Demo 提供轻量存储、鉴权或数据能力。 | Demo 数据表、反馈表 | 原型后台能力说明 | 避免收集真实敏感用户数据 | include_as_auxiliary |
| PORT-001 | AI PM portfolio closed-loop guidance | Woshipm / source material articles | Article | Portfolio / Job Search | Phase 4 / Phase 5 | review_required | Medium | quarterly_review | intermediate | CN | free | 明确 AI PM 作品集要证明问题定义、Demo、eval、反馈和迭代闭环。 | 作品集证据清单 | Portfolio 页面结构 | 具体文章 URL 和作者需补全 | review_before_use |
| PORT-002 | Product manager portfolio case study guides | Blogs / templates; source incomplete | Guide / Template | Portfolio / Job Search | Phase 5 | review_required | Medium | quarterly_review | beginner | EN / CN | mixed | 学习案例结构、问题-方案-结果叙事和视觉呈现。 | Case study 大纲 | 主项目案例页 | 来源质量差异大，需筛选 | review_before_use |
| PORT-003 | Demo video / project storytelling examples | Source to be built | Examples | Portfolio / Job Search | Phase 5 | review_required | Medium | quarterly_review | beginner | EN / CN | mixed | 形成 3-5 分钟 Demo 讲述方式和面试演示节奏。 | Demo 脚本、视频大纲 | Demo 视频或展示说明 | 需补充具体可信示例 | review_before_use |
| PORT-004 | AI PM resume / JD matching resources | JD sources and resume guides | JD / Guide | Portfolio / Job Search | Phase 5 | review_required | Medium | quarterly_review | intermediate | CN / EN | mixed | 支持 C 端 AI PM 主线和 B 端 AI 备选线的简历表达。 | 岗位匹配矩阵、简历版本 | 求职表达证据 | JD 变化快，需季度复核 | review_before_use |
| PORT-005 | User-owned previous outputs: Gemini outputs, long-term learning system docs | User-owned source materials | User asset | Portfolio / Job Search | Phase 0 / Phase 5 | previously_used | User-owned | stable | intermediate | CN | free | 盘点已有 PRD、Backlog、Roadmap、AC 和学习系统文档，判断可继承证据。 | 旧成果盘点、可复用清单 | 文档能力和项目思考证据 | 不能直接当作当前作品集完成证据 | include_in_catalog |
| LM-001 | Atomic Habits / 《原子习惯》 | Existing notes plus official author site / purchased book if needed | Book / User notes | Learning Methodology / Self-regulation | Phase 1 | previously_used | High | stable | beginner | EN / CN | paid; use existing notes first, purchase licensed copy only if needed | 用于恢复身份型习惯、环境提示、最小行动和稳定学习节奏。 | 阶段学习习惯设计说明、最小行动规则 | 学习方法应用记录、阶段学习系统迭代说明 | 不把阅读本身当完成；没有正版或旧笔记不足时再补购 | include_in_catalog |
| LM-002 | Learning How to Learn | https://www.coursera.org/learn/learning-how-to-learn | Coursera course / video course | Learning Methodology / Self-regulation | Phase 1 / Phase 3 | high_priority_candidate | High | quarterly_review | beginner | EN | Included with Coursera Plus / paid subscription; user has Coursera membership | 补充注意力、记忆、拖延处理和有效学习策略，用于恢复节奏和复杂概念学习。 | 学习策略摘要、检索练习设计、实验笔记模板 | 学习方法应用记录、技术概念解释记录 | Coursera 课程只选用相关章节；不以看完课程为目标 | include_in_catalog |
| LM-003 | Deep Work / 《深度工作》 | Book; official author site / purchased book if needed | Book | Learning Methodology / Self-regulation | Phase 1 / Phase 4 | candidate | High | stable | intermediate | EN / CN | paid; purchase candidate | 建立专注块、干扰控制和深度任务推进方式，支持长期学习和作品集项目。 | 专注时段设计、干扰清单、项目推进规则 | 项目推进复盘、学习能量管理说明 | 购买建议不是已购买事实；只抽取可执行规则 | include_in_catalog |
| LM-004 | Peak / 《刻意练习》 | Book; purchased book if needed | Book | Learning Methodology / Self-regulation | Phase 2 | candidate | High | stable | intermediate | EN / CN | paid; purchase candidate | 学习刻意练习、反馈、短板识别和专项训练设计。 | 关键能力刻意练习记录、反馈循环记录 | 用户研究 / 指标 / 体验判断能力提升证据 | 不做全文精读任务；必须绑定当前短板 | include_in_catalog |
| LM-005 | Make It Stick / 《认知天性》 | Book; purchased book if needed | Book | Learning Methodology / Self-regulation | Phase 2 / Phase 3 | candidate | High | stable | intermediate | EN / CN | paid; purchase candidate | 支持检索练习、间隔复习、交错练习和复杂概念迁移。 | 检索练习设计、间隔复习规则、概念解释记录 | 技术概念解释记录、学习方法应用记录 | 购买建议不是已购买事实；只用于方法抽取和应用 | include_in_catalog |
| LM-006 | Mindshift | https://www.coursera.org/learn/mindshift | Coursera course / video course | Learning Methodology / Self-regulation | Phase 5 | candidate | High | quarterly_review | beginner | EN | Included with Coursera Plus / paid subscription; user has Coursera membership | 支持职业转型、学习迁移和身份叙事调整。 | 职业转型反思、学习原则复盘 | 求职叙事、个人学习方法复盘 | 可选观看资源；不作为主线课程 | include_as_auxiliary |
| LM-007 | Ultralearning / 《超速学习》 | Book; purchased book if needed | Book | Learning Methodology / Self-regulation | Phase 4 | auxiliary | Medium | stable | intermediate | EN / CN | paid; optional purchase | 作为项目制学习和自驱学习设计的辅助参考。 | 项目学习策略、范围控制说明 | 项目推进复盘 | 可选购买；避免过度追求学习技巧 | include_as_auxiliary |
| LM-008 | Show Your Work! / 《展示你的作品》 | Book; purchased book if needed | Book | Learning Methodology / Self-regulation | Phase 5 | auxiliary | Medium | stable | beginner | EN / CN | paid; optional purchase | 支持知识外化、作品集叙事和过程展示。 | 项目讲述素材、展示结构草案 | Portfolio 叙事、面试故事素材 | 可选购买；不替代真实作品集证据 | include_as_auxiliary |
| RULE-001 | Resource selection rule: ability-gap first | `资源.md` and `master_plan.md` | Rule | Resource Rules | All phases | high_priority_candidate | Project-defined | stable | beginner | CN | free | 保证资源服务能力、练习和作品集证据，而不是堆课程。 | 资源选择检查表 | 资源使用说明 | 规则不是资源本身，不能替代复核 | include_in_catalog |
| RULE-002 | Copyright and authorization boundary | `资源.md` and `master_plan.md` | Rule | Resource Rules | All phases | high_priority_candidate | Project-defined | stable | beginner | CN | free | 保护版权，避免盗版、全文复制和未经授权内容进入系统。 | 引用和授权检查表 | 合规说明 | 必须在作品集展示中持续遵守 | include_in_catalog |
| RULE-003 | User learning data boundary | `资源.md` and `master_plan.md` | Rule | Resource Rules | Phase 3 / Phase 4 / Phase 5 | high_priority_candidate | Project-defined | stable | beginner | CN | free | 限制用户学习数据、访谈和测试数据的收集与展示。 | 访谈授权说明、匿名化规则 | 用户反馈边界说明 | 不得采集敏感或可识别数据 | include_in_catalog |
| RULE-004 | Resource freshness review mechanism | `资源.md` and `master_plan.md` | Rule | Resource Rules | All phases | high_priority_candidate | Project-defined | quarterly_review | beginner | CN | free | 为高时效资源建立月度 / 季度复核节奏。 | 资源复核清单 | 资源有效性记录 | 需要后续单独资源复核记录承接 | include_in_catalog |
| RULE-005 | Not recommended / caution list | `资源.md` section 8 | Rule | Resource Rules | All phases | high_priority_candidate | Project-defined | quarterly_review | beginner | CN | free | 避免过时教程、营销训练营、盗版、无出处路线图和黑盒速成内容。 | 排除清单 | 资源治理证据 | 排除判断仍需结合具体资源复核 | include_in_catalog |

## 6. Phase-based Resource Suggestions

### Phase 0：恢复复习与旧成果盘点

建议资源组合：

- `PF-001` Inspired / 《启示录》
- `PF-002` The Mom Test
- `PF-004` Lean Product / PMF materials
- `PF-011` Digital Product Management: Modern Fundamentals
- `PF-012` Agile Meets Design Thinking
- `PF-010` Product Management Playbook 1.0.0
- `PORT-005` User-owned previous outputs
- `RULE-001` Resource selection rule

建议产出：

- 旧学习成果复盘。
- 产品基础缺口清单。
- Playbook 复盘版。
- 旧长期学习系统和 `codex-study-os` 关系判断。

### Phase 1：产品基础继续夯实

建议资源组合：

- `PF-013` Hypothesis-Driven Development
- `PF-014` Product Analytics and AI
- `PF-015` Managing an Agile Team
- `PF-016` Escaping the Build Trap / 《逃离建造陷阱》
- `PF-003` The Lean Startup / 《精益创业》
- `PF-008` JTBD materials
- `PF-009` HEART / AARRR / North Star Metric materials
- `AI-001` Product Management: Building AI-Powered Products
- `LM-001` Atomic Habits / 《原子习惯》
- `LM-002` Learning How to Learn
- `LM-003` Deep Work / 《深度工作》

建议产出：

- 问题定义。
- 用户访谈提纲。
- PRD 练习。
- Backlog / 用户故事 / AC。
- Roadmap 初稿。
- 指标设计。
- AI PM 角色和 AI 机会判断预热笔记。
- 阶段学习习惯设计说明。

### Phase 2：用户体验、验证与结果指标

建议资源组合：

- `CP-001` NN/g User Interviews 101
- `CP-002` NN/g UX research method selection
- `CP-003` Coursera Advanced UX Strategies for Product Managers
- `CP-005` Amplitude Pirate Metrics / AARRR guide
- `CP-006` Duolingo Max official blog
- `CP-007` Notion AI product case analysis
- `CP-008` Intercom onboarding / activation resources
- `CP-009` C 端 AI learning / personal growth product cases
- `CP-010` User Experience: Research & Prototyping
- `CP-011` UX Research at Scale: Surveys, Analytics, Online Testing
- `CP-012` User Segmentation, Experimentation, and Retention Analytics
- `CP-013` Metrics that Matter: Improving Product Outcomes
- `AI-013` Generative AI: Supercharge Your Product Management Career
- `LM-004` Peak / 《刻意练习》
- `LM-005` Make It Stick / 《认知天性》

建议产出：

- 用户体验拆解。
- 关键流程图。
- 验证方案。
- 指标与实验说明。
- 用户画像。
- 用户旅程。
- Onboarding 分析。
- Funnel / Cohort 模拟分析。
- 增长实验设计。
- GenAI PM 工作流和 AI 辅助体验判断练习。
- 关键能力刻意练习记录。

### Phase 3：AI PM 专项

建议资源组合：

- `AI-001` Product Management: Building AI-Powered Products
- `AI-003` Microsoft Responsible AI / HAX Toolkit
- `AI-005` Anthropic / Claude official docs
- `AI-006` AI PM ability model articles
- `TECH-001` OpenAI Prompt Engineering best practices
- `TECH-002` OpenAI Developer Prompting guide
- `TECH-003` OpenAI Retrieval / Vector Stores / File Search docs
- `TECH-004` OpenAI Evals / evaluation resources
- `TECH-005` LangChain official RAG tutorial
- `TECH-007` LlamaIndex official docs
- `TECH-008` Vector database docs
- `LM-002` Learning How to Learn
- `LM-005` Make It Stick / 《认知天性》

备选课程候选：

- `AI-008` Duke / Coursera AI Product Management Specialization
- `AI-009` Machine Learning Foundations for Product Managers
- `AI-010` Managing Machine Learning Projects
- `AI-011` Human Factors in AI
- `AI-012` IBM AI Product Manager Professional Certificate
- `AI-013` Generative AI: Supercharge Your Product Management Career
- `AI-014` AI Product Management: The Complete Handbook

建议产出：

- Prompt 对比实验。
- RAG 小 Demo。
- Agent / Workflow 小实验。
- eval 测试集。
- rubric。
- AI 交互失败兜底设计。
- AI PM 能力地图、AI 产品生命周期摘要、AI-native 产品框架。
- 技术概念解释记录。

### Phase 4：作品集 Demo / Vibe Coding

建议资源组合：

- `CP-006` Duolingo Max official blog
- `CP-007` Notion AI product case analysis
- `TECH-004` OpenAI Evals / evaluation resources
- `TECH-005` LangChain official RAG tutorial
- `TECH-009` LangChain / LlamaIndex GitHub examples
- `TECH-010` Cursor / Codex / AI-assisted coding guides
- `TECH-011` Next.js / Vercel simple Web Demo docs
- `TECH-012` Supabase / Firebase docs
- `PORT-001` AI PM portfolio closed-loop guidance
- `RULE-002` Copyright and authorization boundary
- `RULE-003` User learning data boundary
- `AI-013` Generative AI: Supercharge Your Product Management Career
- `AI-014` AI Product Management: The Complete Handbook
- `LM-003` Deep Work / 《深度工作》
- `LM-007` Ultralearning / 《超速学习》

建议产出：

- 主项目 PRD。
- 原型。
- 可运行 Demo。
- 测试集 / rubric。
- eval 报告。
- 3-5 个授权、匿名化、最小化的轻量反馈。
- 迭代记录。
- AI PM 工作流应用记录和 AI 产品化取舍说明。
- 项目推进复盘。

### Phase 5：作品集与求职表达

建议资源组合：

- `PORT-001` AI PM portfolio closed-loop guidance
- `PORT-002` Product manager portfolio case study guides
- `PORT-003` Demo video / project storytelling examples
- `PORT-004` AI PM resume / JD matching resources
- `PORT-005` User-owned previous outputs
- `RULE-002` Copyright and authorization boundary
- `RULE-003` User learning data boundary
- `LM-006` Mindshift
- `LM-008` Show Your Work! / 《展示你的作品》

建议产出：

- Portfolio 页面。
- 主项目讲述稿。
- Demo 视频或展示脚本。
- C 端 AI PM 简历版本。
- B 端 / 企业级 AI 备选简历版本。
- 岗位匹配矩阵。
- 个人学习方法复盘。

## 7. Ability-to-Resource Mapping

| Ability Gap | Recommended Resources | Why These Resources | Expected Evidence |
| --- | --- | --- | --- |
| 产品发现 & 用户验证 | `PF-001`, `PF-002`, `CP-001`, `PF-008` | Inspired 和 JTBD 支持机会判断；The Mom Test 和 NN/g 支持访谈方法。 | 产品想法验证报告、访谈提纲、用户问题定义 |
| 精益 MVP & 快速迭代 | `PF-003`, `PF-005`, `PF-004` | Lean Startup 提供验证性学习；Atlassian 支持 Backlog 和迭代表达。 | MVP 假设表、迭代计划、Backlog |
| 用户研究 & 可用性测试 | `CP-001`, `CP-002`, `CP-003` | NN/g 和 UX 课程支持研究方法、用户旅程和原型评估。 | 用户研究报告、用户旅程、测试方案 |
| 交互设计 & 原型 | `CP-003`, `CP-006`, `CP-007` | UX 课程和 AI 产品案例帮助理解 C 端 AI 交互和用户控制。 | 原型图、交互流程、AI Chat UX 说明 |
| 数据分析 & 增长指标 | `PF-009`, `CP-004`, `CP-005` | HEART、AARRR、Mixpanel 和 Amplitude 支持漏斗、留存和增长指标。 | Funnel / Cohort 模拟分析、指标体系 |
| 激活 / 留存策略 | `CP-005`, `CP-008`, `CP-009` | 增长资源和用户引导资源支持 Onboarding、激活和留存设计。 | Onboarding 流程、激活假设、增长实验设计 |
| AI / ML 产品基础 | `AI-001`, `AI-002`, `AI-008`, `AI-009`, `AI-010`, `AI-012`, `AI-013`, `AI-014`, `AI-005`, `TECH-001`, `TECH-002` | AI PM 课程、证书候选和官方文档支持模型能力、提示、AI 产品生命周期、AI 项目管理、AI-native 产品化和 PM 工作流理解。 | AI / ML 能力对比、Prompt 实验、AI 产品生命周期摘要、AI 项目计划、AI PM 能力地图 |
| Prompt Engineering | `TECH-001`, `TECH-002`, `AI-005` | OpenAI 和 Anthropic 官方文档支持提示设计和安全边界。 | Prompt 版本记录、输出质量对比 |
| RAG & 向量检索 | `TECH-003`, `TECH-005`, `TECH-006`, `TECH-007`, `TECH-008` | OpenAI、LangChain、LlamaIndex 和向量库文档支持 RAG 原型。 | RAG Demo、检索测试、引用来源说明 |
| Agent 架构与工具调用 | `AI-005`, `TECH-005`, `TECH-009`, `TECH-010` | 官方文档和示例支持 Agent、工具调用和 vibe coding 原型。 | Agent 流程图、工具调用实验、Demo |
| AI 用户体验 & 安全 | `AI-003`, `AI-004`, `AI-011`, `AI-013`, `CP-006`, `CP-007`, `RULE-003` | Responsible AI、HAX、Human Factors、GenAI PM 工作流和产品案例支持用户控制、信任、透明度、隐私、伦理和数据边界。 | AI 交互失败兜底、风险清单、隐私 / 伦理说明、数据边界说明 |
| Eval & 闭环反馈 | `TECH-004`, `PORT-001`, `RULE-004` | eval 资源和作品集闭环指南支持测试集、rubric、反馈和迭代。 | eval 报告、失败样例库、迭代记录 |
| AI 原型开发 | `TECH-009`, `TECH-010`, `TECH-011`, `TECH-012` | 开源示例、AI-assisted coding 和 Web Demo 文档支持可运行原型。 | Web Demo 链接、Demo 视频、技术选型说明 |
| 学习方法论与自我调节 | `LM-001`, `LM-002`, `LM-003`, `LM-004`, `LM-005`, `LM-006`, `LM-007`, `LM-008` | 原子习惯、Learning How to Learn、Deep Work、Peak、Make It Stick、Mindshift、Ultralearning、Show Your Work 分别支持习惯、学习策略、专注、刻意练习、检索复习、转型叙事、项目制学习和知识外化。 | 阶段学习习惯设计说明、关键能力刻意练习记录、技术概念解释记录、项目推进复盘、个人学习方法复盘 |
| 作品集 & 简历表达 | `PORT-001`, `PORT-002`, `PORT-003`, `PORT-004`, `PORT-005` | 作品集、讲述、简历和 JD 资源支持求职表达。 | Portfolio 页面、主项目讲述稿、简历版本 |

## 8. Not Recommended / Caution List

| Resource ID | Resource Name | URL / Source | Type | Module | Phase | Status | Authority | Freshness | Difficulty | Language | Cost | Why Learn | Practice Output | Portfolio Evidence | Risk / Boundary | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NR-001 | 过时 LLM / RAG / Agent 教程 | Unspecified | Tutorial | Not Recommended | Any | not_recommended | Low | high_risk_outdated | varies | CN / EN | mixed | 不建议作为主学习资源。 | none | none | 可能使用已弃用模型、旧版 API 或旧框架，导致无法复现。 | exclude |
| NR-002 | 空洞工具清单 | Unspecified | Article | Not Recommended | Any | not_recommended | Low | high_risk_outdated | beginner | CN / EN | free | 不建议作为资源。 | none | none | 只有工具名，没有方法、案例、练习或边界。 | exclude |
| NR-003 | 训练营广告 / 速成班宣传页 | Unspecified | Marketing page | Not Recommended | Any | not_recommended | Low | monthly_review | beginner | CN / EN | paid | 不建议直接纳入资源池。 | none | none | 可能过度营销、缺少实操、费用高且质量不明。 | exclude |
| NR-004 | 无作者无日期的 AI PM 路线图 | Unspecified | Roadmap | Not Recommended | Any | not_recommended | Low | high_risk_outdated | beginner | CN / EN | free | 不建议采信。 | none | none | 无出处、无上下文，无法判断适配性和新旧。 | exclude |
| NR-005 | 盗版课程 / 盗版电子书 / 未授权聚合资料 | Unspecified | Pirated material | Not Recommended | Any | not_recommended | None | high_risk_outdated | varies | CN / EN | free / paid | 禁止使用。 | none | none | 版权和伦理风险，不能进入系统或作品集。 | exclude |
| NR-006 | “不用理解技术也能搞定 AI PM”的黑盒教条 | Unspecified | Course / Article | Not Recommended | Any | not_recommended | Low | high_risk_outdated | beginner | CN / EN | mixed | 不建议使用。 | none | none | 夸大宣传，削弱 AI PM 必要的模型、eval 和系统边界理解。 | exclude |
| NR-007 | 与目标不匹配的深度 B2B 大数据平台资源 | Unspecified | Course / Article | Caution | Phase 2 / Phase 3 | defer | Medium | quarterly_review | advanced | CN / EN | mixed | 暂缓使用。 | none | possible auxiliary case | 可能偏离 C 端 AI PM 主线；仅在备选线需要时使用。 | defer |
| NR-008 | 过度营销的公司白皮书或产品广告 | Unspecified | Whitepaper / Ad | Caution | Any | defer | Medium | quarterly_review | beginner | CN / EN | free | 可观察但不作为主资源。 | none | none | 观点带销售偏向，缺少客观分析和可复现实践。 | defer |

## 9. Resource Freshness and Review Mechanism

资源状态只能在复核后转换，不得因为被列入本文件就自动成为已批准学习任务。

复核节奏：

- 产品基础资源：半年或年度复核。经典书籍、成熟产品框架和用户自有笔记相对稳定，但要结合实际练习验证是否仍适用。
- C 端产品案例：季度或半年复核。关注 AI 学习、个人成长、效率、知识消费、用户信任、Onboarding、增长和商业化的新案例。
- 学习方法论资源：半年或年度复核。经典书籍相对稳定；Coursera 课程访问状态、课程结构和会员可用性需在进入月计划前确认。
- AI 技术文档：月度或季度复核。OpenAI、Anthropic、Google、LangChain、LlamaIndex、向量数据库和 eval 资源更新快，使用前必须确认版本。
- AI coding / Demo 工具：使用前复核。Cursor、Codex、Next.js、Vercel、Supabase、Firebase、开源示例和框架依赖变化快。
- JD / 岗位要求：季度或半年复核。用于校准 C 端 AI PM 主线、远程机会和长沙本地 B 端 / 企业级 AI 备选线。

资源复核检查项：

- URL 是否有效。
- 作者 / 机构是否可信。
- 发布时间和最近更新时间。
- 是否官方或维护活跃。
- 是否有真实案例或练习。
- 是否能形成作品集证据。
- 是否服务当前 Phase 的能力缺口。
- 是否存在版权、许可、隐私或敏感数据风险。
- 是否需要付费，以及费用是否值得。

## 10. Copyright and Data Boundary

版权边界：

- 不使用盗版课程、盗版电子书、盗版资料包或未经授权聚合内容。
- 不复制书籍、课程、博客、文章或付费材料全文。
- 不把课程内容、付费书籍内容或未经授权文章直接喂给系统。
- 不把第三方材料伪装成用户自己的产出。
- 引用资源时保留来源、链接、作者或机构信息。
- 开源项目只能在许可允许范围内使用，并需要记录许可证。

用户数据边界：

- 不随意采集用户学习行为、测评结果、作业、简历、职业目标、对话记录、学习计划或可识别反馈。
- 用户访谈 / Demo 测试必须告知用途、获得授权、最小化采集、匿名化记录，并允许撤回。
- 不采集健康、财务、身份、客户项目、真实企业内部资料等敏感数据。
- 作品集中只能展示脱敏、聚合或授权反馈。
- 做 AI 学习 / 求职 / 个人成长产品时，必须把教学材料和用户学习数据分开处理。

## 11. Resource Purchase / Viewing Guidance

本节只记录购买和观看优先级，不代表资源已购买、已批准进入计划或必须完成。

优先购买或确认已有正版：

- `LM-003` Deep Work / 《深度工作》
- `LM-004` Peak / 《刻意练习》
- `LM-005` Make It Stick / 《认知天性》
- `LM-001` Atomic Habits / 《原子习惯》：仅在没有正版或可用旧笔记不足时补购。

可选购买：

- `LM-007` Ultralearning / 《超速学习》
- `LM-008` Show Your Work! / 《展示你的作品》

优先观看 / 使用 Coursera：

- `LM-002` Learning How to Learn
- `LM-006` Mindshift

优先复核 / 选用的 AI PM Coursera 课程：

- `AI-001` Product Management: Building AI-Powered Products
- `AI-002` Generative AI for Product Managers Specialization
- `AI-013` Generative AI: Supercharge Your Product Management Career
- `AI-012` IBM AI Product Manager Professional Certificate：证书型总览候选，按模块选用。
- `AI-014` AI Product Management: The Complete Handbook：`review_required`，先复核课程质量和模块适配度。

## 12. Open Questions / To Review

- 哪些 URL 需要补全：`CP-003`, `CP-007`, `CP-008`, `AI-001`, `AI-002`, `AI-003`, `AI-004`, `AI-006`, `AI-007`, `TECH-003`, `PORT-001`, `PORT-002`, `PORT-003`, `PORT-004`。
- 哪些课程需要检查费用和更新时间：`CP-003`, `AI-001`, `AI-002`, `AI-008`, `AI-009`, `AI-010`, `AI-011`, `AI-012`, `AI-013`, `AI-014`, 以及后续新增的 C 端产品课程和 AI PM 课程。
- 哪些 AI 技术资源需要确认最新版本：`TECH-001`, `TECH-002`, `TECH-003`, `TECH-004`, `TECH-005`, `TECH-007`, `TECH-008`, `TECH-009`, `TECH-010`。
- 哪些学习方法论资源需要确认购买或访问状态：`LM-001`, `LM-003`, `LM-004`, `LM-005`, `LM-007`, `LM-008` 需确认正版或购买优先级；`LM-002`, `LM-006` 需确认 Coursera 会员可访问性和课程结构。
- 哪些作品集资源需要补充：`PORT-001`, `PORT-002`, `PORT-003`, `PORT-004` 需要补充可信 URL、作者、案例质量和适配度。
- 哪些中文资源可以补充：C 端增长、AI 产品案例、AI PM 作品集、AI eval、vibe coding、求职表达和长沙 / 远程 AI PM JD 相关中文资源。
- 是否需要后续创建独立 `resource_review_log.md`：本文件只做候选池，不记录逐次复核历史。
