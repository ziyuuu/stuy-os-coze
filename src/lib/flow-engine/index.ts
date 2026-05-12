/**
 * 流程引擎 - 简化版
 * 
 * 严格按照原始流程定义实现：
 * 1. 日/周/月计划生成流程
 * 2. 日/周/月复盘流程
 */

import { readFile } from "@/lib/file-utils";
import { getWorkflowService } from "@/lib/harness/workflow";
import type { ArtifactKind } from "@/lib/harness/types";
import { readLatestPlanContent } from "@/lib/harness/plan-overrides";
import { parseStatusFromContent, extractPeriod, checkReviewTiming } from "@/lib/plans/lifecycle";
import path from "path";
import fs from "fs";
import {
  FLOW_DEFINITIONS,
  getFlowDefinition,
  getWeekNumber,
} from "@/lib/flow-definitions";
import type { FlowType, FlowDefinition, FlowValidationResult, PreconditionCheck } from "@/lib/flow-definitions";

// 计划生成层级门禁：下级计划生成前需上级计划已 active
const PLAN_GENERATION_GATE: Record<string, { planType: string; label: string }> = {
  month_plan: { planType: "master", label: "Master Plan" },
  week_plan: { planType: "monthly", label: "月计划" },
  daily_plan: { planType: "weekly", label: "周计划" },
};

// 复盘流程 → 对应计划类型（用于时间检查）
const REVIEW_TO_PLAN: Record<string, string> = {
  daily_review: "daily",
  week_review: "weekly",
  monthly_review: "monthly",
};

// 重新导出纯数据模块供服务端消费者使用
export type { FlowType, FlowDefinition, FlowValidationResult, PreconditionCheck } from "@/lib/flow-definitions";
export { getAvailableFlows, getFlowDefinition, getNextRecommendedFlow, getWeekNumber } from "@/lib/flow-definitions";

// 基础数据目录
const BASE_DIR = path.join(process.cwd(), "src/data/ai_pm_transition");

// 流程执行结果
export interface FlowExecutionResult {
  success: boolean;
  flowType: FlowType;
  flowName: string;
  draft: string;
  outputPath: string;
  validation?: FlowValidationResult;
}

/**
 * 验证流程触发条件
 */
export async function validateFlow(
  flowType: FlowType,
  userInput?: string
): Promise<FlowValidationResult> {
  const definition = FLOW_DEFINITIONS[flowType];
  
  if (!definition) {
    return {
      canProceed: false,
      flowType,
      flowName: "",
      preconditions: [],
      warnings: [`未知流程类型: ${flowType}`],
      missingFiles: [],
      readFiles: [],
    };
  }

  const preconditions: PreconditionCheck[] = [];
  const warnings: string[] = [];
  const missingFiles: string[] = [];
  const readFiles: string[] = [];

  // 检查前置文件是否存在
  for (const file of definition.requiredReadFiles) {
    const filePath = path.join(BASE_DIR, file);
    try {
      if (fs.existsSync(filePath)) {
        readFiles.push(file);
      } else {
        missingFiles.push(file);
        warnings.push(`缺少文件: ${file}`);
      }
    } catch {
      missingFiles.push(file);
      warnings.push(`无法读取文件: ${file}`);
    }
  }

  // 检查前置条件
  for (const precondition of definition.preconditions) {
    const passed = !missingFiles.some(f => 
      precondition.includes(f.replace("current_", "").replace(".md", ""))
    );
    preconditions.push({
      name: precondition,
      passed,
      message: passed ? "通过" : "未通过",
    });
  }

  // 复盘流程需要用户输入
  if (definition.type === "review" && !userInput) {
    warnings.push("复盘流程需要用户提供完成情况");
    preconditions.push({
      name: "用户事实输入",
      passed: false,
      message: "请提供您的完成情况",
    });
  }

  // 计划生成层级门禁
  if (definition.type === "plan_generation") {
    const gate = PLAN_GENERATION_GATE[flowType];
    if (gate) {
      try {
        const parentContent = await readLatestPlanContent(gate.planType);
        if (parentContent) {
          const parentStatus = parseStatusFromContent(parentContent);
          if (parentStatus === "expired") {
            warnings.push(
              `${gate.label}状态为「逾期」，建议先更新状态后再生成子计划`
            );
            preconditions.push({
              name: `${gate.label}已激活`,
              passed: true,
              message: `${gate.label}当前状态: expired（允许生成，建议处理逾期）`,
            });
          } else if (parentStatus !== "active" && parentStatus !== "completed") {
            warnings.push(
              `${gate.label}状态为「${parentStatus}」，需先激活上级计划后才能生成`
            );
            preconditions.push({
              name: `${gate.label}已激活`,
              passed: false,
              message: `${gate.label}当前状态: ${parentStatus}（需要 active）`,
            });
          } else {
            preconditions.push({
              name: `${gate.label}已激活`,
              passed: true,
              message: "通过",
            });
          }
        }
      } catch {
        // 上级计划不存在时，由文件检查逻辑处理
      }
    }
  }

  // 复盘流程时间检查（窗口提醒但不禁用）
  if (definition.type === "review") {
    const planType = REVIEW_TO_PLAN[flowType];
    if (planType) {
      try {
        const planContent = await readLatestPlanContent(planType);
        if (planContent) {
          const period = extractPeriod(planType, planContent);
          if (period) {
            const now = new Date();
            const timing = checkReviewTiming(planType, period.end, now);
            if (now < period.end) {
              warnings.push("计划周期尚未结束，建议到期后再复盘");
            }
            if (timing.isLate) {
              warnings.push(`已超出复盘窗口 ${timing.latencyDays} 天，将标记为逾期复盘`);
            }
          }
        }
      } catch {
        // 计划不存在时跳过
      }
    }
  }

  // 检查是否所有前置文件都存在
  const hasUserInput = Boolean(userInput && userInput.length > 0);
  const canProceedFlag: boolean = missingFiles.length === 0 &&
    (definition.type !== "review" || hasUserInput) &&
    preconditions.every((p) => p.passed);

  return {
    canProceed: canProceedFlag,
    flowType,
    flowName: definition.name,
    preconditions,
    warnings,
    missingFiles,
    readFiles,
  };
}

/**
 * 生成输出路径
 */
export function generateOutputPath(flowType: FlowType): string {
  const definition = FLOW_DEFINITIONS[flowType];
  if (!definition) return "";
  
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const week = getWeekNumber(now);
  
  let outputPath = definition.output.path;
  outputPath = outputPath.replace("{date}", date);
  outputPath = outputPath.replace("{week}", `${year}-W${week}`);
  outputPath = outputPath.replace("{month}", `${year}-${month}`);
  
  return path.join(BASE_DIR, outputPath);
}

/**
 * 保存草案
 */
export async function saveDraft(
  flowType: FlowType,
  draft: string,
  outputPath?: string
): Promise<{ success: boolean; path: string; error?: string }> {
  try {
    const result = await getWorkflowService().createDraft({
      workflowType: flowType,
      artifactKind: artifactKindForFlow(flowType),
      title: `${getFlowDefinition(flowType)?.name || flowType} draft`,
      content: draft,
      evidenceType: "draft",
      metadata: {
        outputPath: outputPath || generateOutputPath(flowType),
        source: "legacy_flow_engine_saveDraft",
      },
    });

    return { success: true, path: `draft:${result.draft.id}` };
  } catch (error) {
    return { 
      success: false, 
      path: "", 
      error: (error as Error).message 
    };
  }
}

/**
 * 读取流程相关文件内容
 */
export async function readFlowFiles(flowType: FlowType): Promise<Record<string, string>> {
  const definition = FLOW_DEFINITIONS[flowType];
  if (!definition) return {};

  const contents: Record<string, string> = {};
  
  for (const file of definition.requiredReadFiles) {
    try {
      const content = await readFile(file);
      contents[file] = content || "";
    } catch {
      contents[file] = "";
    }
  }
  
  return contents;
}


function artifactKindForFlow(flowType: FlowType): ArtifactKind {
  if (flowType.includes("review")) return "review";
  if (flowType.includes("prep")) return "lesson_prep";
  return "plan";
}

