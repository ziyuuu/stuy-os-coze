# AI PM 转型学习管理系统 - 项目计划

## 概述

本项目将"AI PM 转型学习工作区"转换为网页应用，帮助用户完成从 B2B/B2G 产品背景向 C 端 AI Product Manager 的 12 个月转型学习。系统支持层次化计划管理（Master → Annual → Phase → Month → Week → Day）、流程驱动学习、模板化产出和资源追踪。**核心目标是搭建完整的系统框架（Harness），而非仅关注 UI**。

## 技术方案

| 维度 | 选择 | 理由 |
|------|------|------|
| 框架 | Next.js 16 (App Router) | 支持 SSR/CSR 混合渲染，便于页面导航和数据管理 |
| UI 组件 | shadcn/ui + Tailwind CSS 4 | 快速构建现代化管理界面 |
| 数据存储 | 本地文件系统 (Markdown/JSON) | 符合原工作区结构，便于版本控制 |
| 状态管理 | React Context + useState | 轻量级管理，无需 Redux |
| 部署端口 | 5000 | 符合环境变量规范 |

## 核心模块（系统框架重点）

### 1. 数据层 (Data Layer)
- Markdown 文件解析与渲染
- 计划数据结构（Master/Annual/Month/Week/Day）
- 流程状态追踪
- 模板引擎

### 2. 业务逻辑层 (Business Logic)
- 计划派生逻辑（Month → Week → Day）
- 流程状态机
- 资源路由规则
- 学习方法论驱动

### 3. 展示层 (UI Layer)
- Dashboard 仪表盘
- 计划管理视图
- 流程中心
- 模板库
- 资源管理
- 角色与方法论

### 4. API 层 (API Routes)
- `/api/plans/*` - 计划 CRUD
- `/api/flows/*` - 流程状态管理
- `/api/templates/*` - 模板获取
- `/api/resources/*` - 资源管理

## 是否有原型设计

**否** - 聚焦系统框架搭建，UI 采用标准 shadcn/ui 组件

## 实施步骤

### 阶段一：项目初始化与数据层

1. **[pending] 初始化 Next.js 项目**
   - 使用 `coze init` 初始化项目
   - 配置 shadcn/ui 和 Tailwind CSS
   - 关键文件：`package.json`、`tailwind.config.ts`

2. **[pending] 构建数据层基础设施**
   - 创建 Markdown 文件解析工具
   - 定义 TypeScript 类型（Plan, Flow, Template, Resource）
   - 实现文件读写 API
   - 关键文件：`src/lib/types.ts`、`src/lib/file-utils.ts`、`src/lib/parsers/`

3. **[pending] 实现 API Routes**
   - 创建计划相关 API（读取、解析、派生）
   - 创建流程状态 API
   - 创建模板 API
   - 关键文件：`src/app/api/plans/`、`src/app/api/flows/`、`src/app/api/templates/`

### 阶段二：核心业务逻辑

4. **[pending] 实现计划派生引擎**
   - Month → Week 派生逻辑
   - Week → Day 派生逻辑
   - 流程状态管理
   - 关键文件：`src/lib/plan-engine.ts`、`src/lib/flow-engine.ts`

5. **[pending] 构建 Dashboard 仪表盘**
   - 当前状态概览卡片
   - 计划进度追踪
   - 快速导航入口
   - 关键文件：`src/app/page.tsx`、`src/components/dashboard/`

### 阶段三：功能页面实现

6. **[pending] 实现计划管理模块**
   - Master Plan 视图
   - Annual Plan 视图
   - Month/Week/Day Plan 视图与编辑
   - 关键文件：`src/app/plans/`、`src/components/plans/`

7. **[pending] 实现流程中心与模板库**
   - 流程列表与状态展示
   - 模板预览与使用
   - 关键文件：`src/app/flows/`、`src/app/templates/`

8. **[pending] 实现资源管理与角色方法论**
   - 资源目录与复核状态
   - 角色说明展示
   - 方法论库
   - 关键文件：`src/app/resources/`、`src/app/roles/`

### 阶段四：验证与交付

9. **[pending] 执行代码检查与验证**
   - 运行 `pnpm lint` 和 `pnpm ts-check`
   - 执行接口冒烟测试
   - 检查日志健康状态

## 页面规格

##### @nav(web-topbar)
> type: topbar
> platform: web

- @page(/) 首页
- @page(/plans) 计划管理
- @page(/flows) 流程中心
- @page(/templates) 模板库
- @page(/resources) 资源管理
- @page(/roles) 角色方法论
- @page(/outputs) 产出记录

##### @page(/) 首页仪表盘

**核心职责**：展示 AI PM 转型学习的核心状态概览和快速导航。

**访问路径**：直接访问或从顶部导航点击 Logo。

**布局**：顶部导航栏 + 左侧状态概览卡片 + 右侧快速入口列表。

**状态**：
- 空态：显示引导用户初始化当前计划
- 加载态：骨架屏加载
- 正常态：显示当前阶段、月份、周计划摘要

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| Logo | 点击 | 刷新当前页面 | — | — |
| 导航链接 | 点击 | 跳转对应页面 | — | — |
| 计划卡片 | 点击 | 跳转 @page(/plans) | — | — |
| 流程卡片 | 点击 | 跳转 @page(/flows) | — | — |
| 资源卡片 | 点击 | 跳转 @page(/resources) | — | — |
