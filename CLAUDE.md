# Study OS Coze WebApp V0.1

AI PM（产品经理）转型学习管理系统 — 12 个月 AI 教练驱动的计划执行与复盘系统。

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 16.1.1 (App Router) |
| UI | React 19.2 + shadcn/ui + Tailwind CSS v4 + Radix UI |
| 平台 SDK | `coze-coding-dev-sdk` v0.7.21 (LLMClient) |
| 存储 | JSON 文件系统 (`LocalFileStorageAdapter`，原子写入) |
| 认证 | HMAC-SHA256 token → `study_os_token` cookie (30 天) |
| 包管理 | pnpm 9.0.0 (Node ≥24) |
| 构建 | `bash ./scripts/with-node24.sh` 包装器 |

## 目录结构

```
src/
├── app/                  # Next.js App Router 页面 & API
│   ├── proxy.ts          # Auth 守卫 (Next 16 等价于 middleware)
│   ├── layout.tsx        # 根布局 → AppShell (Sidebar + 内容区 + AI 面板)
│   ├── page.tsx          # 首页 → AICoachMain
│   ├── login/            # 登录页 (唯一的公开页面)
│   ├── plans/            # 计划管理 (日/周/月)
│   ├── settings/         # 设置中心 (导航枢纽: LLM/Memory/编辑)
│   ├── flows/            # 流程执行与验证
│   ├── templates/        # 模板 CRUD
│   ├── resources/        # 资源库
│   ├── api/
│   │   ├── llm-proxy/    # LLM 代理 → Anthropic API 翻译层 (OpenAI 兼容)
│   │   ├── chat-bridge/  # Demo 用文件桥接方案
│   │   ├── auth/         # 登录/登出 (HMAC 签名 token)
│   │   ├── coach/        # AI 教练聊天 & 保存
│   │   ├── flows/        # 流程引擎 API (validate/execute/adjust/save)
│   │   ├── plans/        # 计划 CRUD
│   │   ├── settings/     # 设置持久化 (LLM 配置等)
│   │   ├── workflows/    # Harness 工作流 (confirm/execute/preflight)
│   │   ├── import/       # 资产导入管道
│   │   └── ...           # 其他 API 端点
├── components/
│   ├── layout/           # AppShell, Sidebar (17 个导航项)
│   ├── coach/            # AI 教练聊天面板 & 主界面
│   ├── chat/             # 通用聊天组件
│   ├── flows/            # 流程相关 UI 组件
│   └── ui/               # shadcn/ui 基础组件
├── lib/
│   ├── auth.ts           # HMAC-SHA256 认证 (signToken/verifyToken)
│   ├── llm/service.ts    # LLM 调用层 (Coze SDK → LLM Proxy → Anthropic)
│   ├── harness/          # 工作流管理框架
│   │   ├── types.ts      # 12 种工作流状态、10 种 Artifact 类型
│   │   ├── storage.ts    # LocalFileStorageAdapter (JSONL 审计日志)
│   │   ├── workflow.ts   # WorkflowService 状态机
│   │   ├── seed.ts       # 种子数据机制
│   │   └── import-classifier.ts
│   ├── plans/lifecycle.ts # 4 态生命周期 (draft→active→completed→expired)
│   ├── flow-definitions.ts # 9 种流程定义 (日/周/月 计划/复盘/准备)
│   ├── flow-engine/      # 流程执行引擎 (前提条件检查)
│   └── roles/            # 角色配置 & 持久化
└── data/ai_pm_transition/ # 静态数据: 计划/复盘/资源/模板/方法论/角色
```

## 核心架构

### 1. 认证流程

```
src/proxy.ts → 拦截所有请求 → 读取 study_os_token cookie
  → verifyToken(token) → HMAC-SHA256 签名校验 + 30天过期
  → PUBLIC_PATHS 白名单: /login, /api/auth/login, /api/auth/logout
  → API 请求返回 401, 页面请求重定向 /login?from=xxx
```

Token 格式: `base64url(timestamp.hex_hmac)`  
密钥派生: `"study-os-coze-auth:${ACCESS_PASSWORD}"`  
默认密码: `ACCESS_PASSWORD=test123` (在 `.env.local`)

### 2. LLM 调用链

```
UI 组件 → generateFromLLM() / LLMService
  → Coze SDK (LLMClient.invoke)
  → POST http://localhost:5000/api/llm-proxy/chat/completions
  → route.ts 翻译 OpenAI→Anthropic Messages API
  → api.anthropic.com (需要 ANTHROPIC_API_KEY)
  → 流式 SSE 返回
```

**当前 Demo 模式**: LLM Proxy 已改写为文件桥接方案 (见下方 Demo/Removal 说明)。  
**回退机制**: 用户可在 Settings → LLM 配置自定义 API Key/Endpoint 覆盖默认行为。

### 3. Harness 工作流框架

- **存储**: `.study-os-runtime/` 下 JSON 文件，原子写入 (tmp→rename)
- **审计**: JSONL 格式日志
- **状态机**: Draft → Confirmation → Artifact（12 种中间状态）
- **Artifact 类型**: plan/review/output/lesson_prep/evaluation/source_material 等 10 种
- **导入管道**: uploaded→parsed→classified→mapped→user_reviewing→confirmed→committed→indexed

### 4. 计划生命周期

```
draft → active → completed → expired
  ↑                 ↓            ↓
  └─── 重新激活 ←── ┘   expired → completed (逾期补交)
```

层级: master → monthly → weekly → daily（用于进度汇总查询）

### 5. 流程定义 (9 种)

| 流程 | 类型 | 触发条件 |
|---|---|---|
| daily_plan / week_plan / month_plan | plan_generation | 对应周期开始时 |
| daily_review / week_review / monthly_review | review | 对应周期结束时 |
| daily_prep / week_prep / month_prep | prep | 前一周期的准备阶段 |

每种流程定义了 `requiredReadFiles` + `preconditions` + `instructions`。

### 6. 导航结构 (Sidebar)

首页(AI教练) → 计划执行 → 复盘执行 → 流程 → 导入 → 输出 → 上传对比 → 模板 → 资源 → 角色 → 设置(LLM/Memory/编辑)

## 环境变量 (`.env.local`)

```
ACCESS_PASSWORD=test123                          # 登录密码
ANTHROPIC_API_KEY=sk-ant-your-key-here          # Anthropic API key (正式上线需要)
COZE_WORKLOAD_IDENTITY_API_KEY=proxy-key        # Coze SDK 透传 key (当前由 LLM Proxy 代收)
COZE_INTEGRATION_BASE_URL=http://localhost:5000/api/llm-proxy  # Coze SDK 调用的 base URL
```

## Demo/Removal 标注

以下文件标记了 `@demo` 和 `@removal` 注释，正式上线前需处理：

| 文件 | 说明 | 处理方式 |
|---|---|---|
| `src/app/api/llm-proxy/chat/completions/route.ts` | LLM Proxy 文件桥接版 | 恢复为直连 Anthropic API 或替换为其他后端 |
| `src/app/api/chat-bridge/route.ts` | 旧文件桥接端点 | 直接删除 |

`.study-os-runtime/chat-bridge/` 目录 — 桥接临时文件，正式上线前删除目录。

## 当前开发状态 (2026-05-09)

- [x] 认证系统 (proxy.ts + HMAC token)
- [x] 页面路由 (17 个页面)
- [x] API 端点 (30+ 个)
- [x] LLM Proxy (文件桥接版，Demo 就绪)
- [x] Harness 工作流框架
- [x] 计划生命周期引擎
- [x] 流程定义与执行引擎
- [x] UI 组件 (shadcn/ui + 自定义)
- [x] 旧资产清理 (TopNav, HarnessDashboard, @supabase, react-dev-inspector, .babelrc)
- [ ] Claude Code Bridge Monitor (需在 Claude Code 侧实现)
- [ ] 真实 LLM 后端替换 (Anthropic/DeepSeek/OpenAI)

## 常用命令

```bash
# 开发服务器 (端口 5000)
pnpm dev              # 或: bash ./scripts/dev.sh

# 类型检查 + Lint
pnpm ts-check
pnpm lint

# 完整构建
pnpm build            # 或: bash ./scripts/build.sh

# Node 24 环境包装
pnpm dev:node24       # 自动切换 Node 24 后运行 dev
pnpm build:node24     # 自动切换 Node 24 后运行 build
```

## 开发注意事项

1. **Next.js 16 用 `proxy.ts` 而非 `middleware.ts`**。不要创建 `middleware.ts`，会导致构建冲突。
2. **Windows 环境**: Bash 脚本可能遇到 fork 失败，使用 PowerShell 备选方案 (`npx next dev` 等)。
3. **`src/data/` 目录** 包含静态参考数据，运行时状态存储在 `.study-os-runtime/` 下。
4. **Login 页面和 `/api/auth/**` 是唯一无需登录的公开路径**。新增公开路由需同时更新 `src/proxy.ts` 中的 `PUBLIC_PATHS`。
5. **pnpm 独占**: `preinstall` 脚本强制使用 pnpm，不要用 npm/yarn。
