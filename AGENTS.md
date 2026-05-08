# AI PM 转型学习管理系统 - 开发规范

## 项目概述

这是一个基于 AI PM 转型学习内容的 Web 管理平台，提供完整的层次化计划系统、流程管理、模板库和资源管理功能。

## 技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4

## 目录结构

```
src/
├── app/
│   ├── page.tsx                    # Dashboard 首页
│   ├── plans/page.tsx              # 计划管理
│   ├── flows/page.tsx              # 流程中心
│   ├── flows/[id]/page.tsx        # 流程详情
│   ├── templates/page.tsx          # 模板库
│   ├── templates/[id]/page.tsx    # 模板详情
│   ├── resources/page.tsx         # 资源管理
│   ├── roles/page.tsx             # 角色方法论
│   ├── outputs/page.tsx           # 产出管理
│   └── api/
│       ├── status/route.ts        # 当前状态 API
│       ├── plans/master/route.ts   # Master Plan API
│       ├── plans/month/route.ts    # 月计划 API
│       ├── plans/week/route.ts    # 周计划 API
│       ├── flows/route.ts          # 流程列表 API
│       ├── flows/[id]/route.ts    # 流程详情 API
│       ├── templates/route.ts      # 模板列表 API
│       ├── templates/[id]/route.ts # 模板详情 API
│       └── resources/route.ts     # 资源 API
├── components/
│   ├── layout/top-nav.tsx          # 顶部导航
│   └── dashboard/dashboard-client.tsx  # Dashboard 客户端组件
├── data/
│   └── ai_pm_transition/           # AI PM 转型数据
└── lib/
    ├── types.ts                    # 类型定义
    ├── file-utils.ts               # 文件工具函数
    └── utils.ts                    # 通用工具函数
```

## 开发命令

```bash
pnpm install          # 安装依赖
pnpm dev              # 开发环境
pnpm build            # 生产构建
pnpm lint             # 代码检查
pnpm ts-check         # 类型检查
```

## 数据层架构

### 数据存储
- **位置**: `src/data/ai_pm_transition/`
- **格式**: Markdown 文件
- **结构**:
  - `master_plan.md` - 12个月 Master Plan
  - `current_status.md` - 当前状态
  - `current_month_plan.md` - 当前月计划
  - `current_week_plan.md` - 当前周计划
  - `plans/` - 各类计划文件
  - `flows/` - 流程定义
  - `templates/` - 模板库
  - `resources/` - 资源管理
  - `roles/` - 角色定义

### API 层
- 所有 API 统一返回 `{ success, data, error }` 格式
- 使用文件系统读取 Markdown 内容
- 支持 Markdown 内容解析和结构化

## 页面规格

### Dashboard (/):
- 当前阶段概览
- 月计划目标
- 周计划状态
- 快速导航入口

### 计划管理 (/plans):
- 展示 Master Plan、年度计划、月计划、周计划
- 按类型分组展示

### 流程中心 (/flows):
- 6 类流程：计划生成、复盘、备课、评价等
- 按类型分组展示
- 流程详情页展示完整流程

### 模板库 (/templates):
- 15+ 个模板
- 按类型分组：计划、复盘、备课、评价等
- 模板详情页展示完整模板内容

### 资源管理 (/resources):
- 资源分类统计
- 来源材料管理
- 方法论库
- 角色定义

## 注意事项

- 使用 `pnpm` 作为包管理器
- 遵循 TypeScript strict 模式
- 禁止使用 `any` 类型
- 所有组件使用 shadcn/ui 组件库
