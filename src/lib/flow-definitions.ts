/**
 * 流程定义 — 纯数据/类型模块
 *
 * 此模块零 Node.js 依赖（无 fs/path/os），可安全导入客户端组件。
 * 需要文件系统校验/读取的函数请从 @/lib/flow-engine 导入。
 */

// 流程类型
export type FlowType =
  | "daily_plan"
  | "daily_review"
  | "week_plan"
  | "week_review"
  | "month_plan"
  | "monthly_review"
  | "daily_prep"
  | "week_prep"
  | "month_prep";

// 流程定义
export interface FlowDefinition {
  id: FlowType;
  name: string;
  type: "plan_generation" | "review" | "prep";
  trigger: string;
  requiredReadFiles: string[];
  preconditions: string[];
  output: {
    path: string;
    description: string;
  };
  instructions: string;
}

// 流程验证结果
export interface FlowValidationResult {
  canProceed: boolean;
  flowType: FlowType;
  flowName: string;
  preconditions: PreconditionCheck[];
  warnings: string[];
  missingFiles: string[];
  readFiles: string[];
}

export interface PreconditionCheck {
  name: string;
  passed: boolean;
  message: string;
}

// 流程定义数据
export const FLOW_DEFINITIONS: Record<FlowType, FlowDefinition> = {
  daily_plan: {
    id: "daily_plan",
    name: "日计划生成",
    type: "plan_generation",
    trigger: "必须用户明确触发（如「日计划」）",
    requiredReadFiles: [
      "current_month_plan.md",
      "current_week_plan.md",
      "flows/daily_plan_generation_flow.md",
      "templates/daily_plan_template.md",
    ],
    preconditions: [
      "current_month_plan.md 已按正式月计划模板生成",
      "current_week_plan.md 已按周计划模板生成",
    ],
    output: {
      path: "plans/daily/{date}_plan.md",
      description: "日计划文件",
    },
    instructions: `# 日计划生成

## 必须读取的文件（按顺序）
1. current_month_plan.md - 月计划
2. current_week_plan.md - 周计划
3. flows/daily_plan_generation_flow.md - 流程定义
4. templates/daily_plan_template.md - 模板

## 生成要求
- 日期：今天
- 所属周：周计划中的周期
- 所属月计划：月计划

## 必须包含的字段
- 今日完成标准
- 今日任务（来自周计划分解）
- 边界与约束

## 禁止事项
- 不得假设用户状态
- 不得生成与周计划无关的任务`,
  },

  daily_review: {
    id: "daily_review",
    name: "日复盘",
    type: "review",
    trigger: "必须用户明确触发（如「日复盘」）",
    requiredReadFiles: [
      "current_status.md",
      "current_week_plan.md",
      "flows/daily_review_flow.md",
      "templates/daily_review_template.md",
    ],
    preconditions: [
      "current_status.md 中的当前阶段已定义",
      "current_week_plan.md 中的本周计划已存在",
    ],
    output: {
      path: "plans/daily/{date}_review.md",
      description: "日复盘文件",
    },
    instructions: `# 日复盘

## 必须读取的文件（按顺序）
1. current_status.md - 当前状态
2. current_week_plan.md - 周计划
3. flows/daily_review_flow.md - 流程定义
4. templates/daily_review_template.md - 模板

## 前置状态检查
- 用户是否提供了完成/未完成/困难/阻塞/判断/原始产出中的至少一种事实输入
- 如果没有用户事实输入，不得生成正式日复盘

## 生成要求
- 区分用户事实与 AI 判断
- 标注证据来源
- 明确待确认事项`,
  },

  week_plan: {
    id: "week_plan",
    name: "周计划生成",
    type: "plan_generation",
    trigger: "必须用户明确触发（如「周计划」）",
    requiredReadFiles: [
      "current_status.md",
      "current_month_plan.md",
      "master_plan.md",
      "flows/week_plan_generation_flow.md",
      "templates/week_plan_template.md",
    ],
    preconditions: [
      "current_status.md 中的当前阶段已定义",
      "current_month_plan.md 已按正式月计划模板生成",
    ],
    output: {
      path: "plans/weekly/{week}_plan.md",
      description: "周计划文件",
    },
    instructions: `# 周计划生成

## 必须读取的文件（按顺序）
1. current_status.md - 当前状态
2. current_month_plan.md - 月计划
3. master_plan.md - Master Plan
4. flows/week_plan_generation_flow.md - 流程定义
5. templates/week_plan_template.md - 模板

## 生成要求
- 周期：本周
- 目标：来自月计划的周分解
- 必须包含日计划入口

## 禁止事项
- 不得生成超出月计划范围的目标`,
  },

  week_review: {
    id: "week_review",
    name: "周复盘",
    type: "review",
    trigger: "必须用户明确触发（如「周复盘」）",
    requiredReadFiles: [
      "current_status.md",
      "current_month_plan.md",
      "flows/weekly_review_flow.md",
      "templates/weekly_review_template.md",
    ],
    preconditions: [
      "current_status.md 中的当前阶段已定义",
      "current_month_plan.md 中的本月计划已存在",
    ],
    output: {
      path: "plans/weekly/{week}_review.md",
      description: "周复盘文件",
    },
    instructions: `# 周复盘

## 必须读取的文件（按顺序）
1. current_status.md - 当前状态
2. current_month_plan.md - 月计划
3. flows/weekly_review_flow.md - 流程定义
4. templates/weekly_review_template.md - 模板

## 前置状态检查
- 用户是否提供了本周的完成情况
- 如果没有用户事实输入，不得生成正式周复盘`,
  },

  month_plan: {
    id: "month_plan",
    name: "月计划生成",
    type: "plan_generation",
    trigger: "必须用户明确触发（如「月计划」）",
    requiredReadFiles: [
      "current_status.md",
      "master_plan.md",
      "flows/month_plan_generation_flow.md",
      "templates/month_plan_template.md",
    ],
    preconditions: [
      "current_status.md 中明确允许进入月计划生成",
    ],
    output: {
      path: "plans/month/{month}_plan.md",
      description: "月计划文件",
    },
    instructions: `# 月计划生成

## 必须读取的文件（按顺序）
1. current_status.md - 当前状态
2. master_plan.md - Master Plan
3. flows/month_plan_generation_flow.md - 流程定义
4. templates/month_plan_template.md - 模板

## 前置状态检查
- current_status.md 中是否允许进入月计划生成
- 必须有 TBD 或具体目标

## 生成要求
- 月度目标：来自 Master Plan 或 annual_plan
- 里程碑：分解月度目标
- 周次拆分`,
  },

  monthly_review: {
    id: "monthly_review",
    name: "月复盘",
    type: "review",
    trigger: "必须用户明确触发（如「月复盘」）",
    requiredReadFiles: [
      "current_status.md",
      "current_month_plan.md",
      "flows/monthly_review_flow.md",
      "templates/monthly_review_template.md",
    ],
    preconditions: [
      "current_status.md 中的当前阶段已定义",
      "current_month_plan.md 中的本月计划已存在",
    ],
    output: {
      path: "plans/month/{month}_review.md",
      description: "月复盘文件",
    },
    instructions: `# 月复盘

## 必须读取的文件（按顺序）
1. current_status.md - 当前状态
2. current_month_plan.md - 月计划
3. flows/monthly_review_flow.md - 流程定义
4. templates/monthly_review_template.md - 模板

## 生成要求
- 完成情况对照
- AI 分析与判断
- 待用户确认事项
- 下月改进计划`,
  },

  // 备课流程
  daily_prep: {
    id: "daily_prep",
    name: "日备课",
    type: "prep",
    trigger: "必须用户明确触发（如「日备课」）",
    requiredReadFiles: [
      "current_month_plan.md",
      "current_week_plan.md",
      "current_daily_plan.md",
      "flows/daily_prep_flow.md",
      "templates/daily_prep_template.md",
    ],
    preconditions: [
      "current_month_plan.md 已按正式月计划模板生成",
      "current_week_plan.md 已按周计划模板生成",
      "current_daily_plan.md 已按日计划模板生成",
    ],
    output: {
      path: "preps/daily/{date}_prep.md",
      description: "日备课文件",
    },
    instructions: `# 日备课

## 必须读取的文件（按顺序）
1. current_month_plan.md - 月计划
2. current_week_plan.md - 周计划
3. current_daily_plan.md - 日计划
4. flows/daily_prep_flow.md - 流程定义
5. templates/daily_prep_template.md - 模板

## 生成要求
- 今日学习目标回顾
- 重点知识预热
- 练习准备
- 预期产出确认

## 禁止事项
- 不得生成超出日计划范围的内容`,
  },

  week_prep: {
    id: "week_prep",
    name: "周备课",
    type: "prep",
    trigger: "必须用户明确触发（如「周备课」）",
    requiredReadFiles: [
      "current_status.md",
      "current_month_plan.md",
      "current_week_plan.md",
      "flows/week_prep_flow.md",
      "templates/week_prep_template.md",
    ],
    preconditions: [
      "current_status.md 中的当前阶段已定义",
      "current_month_plan.md 已按正式月计划模板生成",
    ],
    output: {
      path: "preps/weekly/{week}_prep.md",
      description: "周备课文件",
    },
    instructions: `# 周备课

## 必须读取的文件（按顺序）
1. current_status.md - 当前状态
2. current_month_plan.md - 月计划
3. current_week_plan.md - 周计划
4. flows/week_prep_flow.md - 流程定义
5. templates/week_prep_template.md - 模板

## 生成要求
- 本周目标确认
- 学习模块准备
- 练习任务分解
- 产出标准定义

## 禁止事项
- 不得生成超出周计划范围的内容`,
  },

  month_prep: {
    id: "month_prep",
    name: "月备课",
    type: "prep",
    trigger: "必须用户明确触发（如「月备课」）",
    requiredReadFiles: [
      "current_status.md",
      "master_plan.md",
      "current_month_plan.md",
      "flows/month_prep_flow.md",
      "templates/month_prep_template.md",
    ],
    preconditions: [
      "current_status.md 中明确允许进入月计划",
    ],
    output: {
      path: "preps/monthly/{month}_prep.md",
      description: "月备课文件",
    },
    instructions: `# 月备课

## 必须读取的文件（按顺序）
1. current_status.md - 当前状态
2. master_plan.md - Master Plan
3. current_month_plan.md - 月计划
4. flows/month_prep_flow.md - 流程定义
5. templates/month_prep_template.md - 模板

## 生成要求
- 本月目标确认
- 周次节奏规划
- 里程碑检查点
- 资源配置准备`,
  },
};

/** 获取所有可用流程 */
export function getAvailableFlows(): FlowDefinition[] {
  return Object.values(FLOW_DEFINITIONS);
}

/** 获取流程定义 */
export function getFlowDefinition(flowType: FlowType): FlowDefinition | undefined {
  return FLOW_DEFINITIONS[flowType];
}

/** 获取周数（纯函数） */
export function getWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return String(weekNo).padStart(2, "0");
}

/** 获取下一个推荐流程 */
export function getNextRecommendedFlow(currentFlow: FlowType): FlowType | null {
  const flowChain: Record<FlowType, FlowType | null> = {
    daily_plan: "daily_review",
    daily_review: null,
    daily_prep: "daily_plan",
    week_plan: "week_prep",
    week_prep: "daily_plan",
    week_review: "week_plan",
    month_plan: "month_prep",
    month_prep: "week_plan",
    monthly_review: "month_plan",
  };

  return flowChain[currentFlow] || null;
}
