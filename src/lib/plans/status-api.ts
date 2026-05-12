import type { Artifact, MemoryState } from "@/lib/harness/types";
import { getWorkflowService } from "@/lib/harness/workflow";
import { getStorageAdapter } from "@/lib/harness/storage";
import { readLatestPlanContent } from "@/lib/harness/plan-overrides";
import { ensureSeedData } from "@/lib/harness/seed";
import { createId, nowIso } from "@/lib/harness/id";
import {
  type PlanStatus,
  type PlanPeriod,
  parseStatusFromContent,
  replaceStatusInContent,
  validateTransition,
  computePlanPhase,
  extractPeriod,
  checkReviewTiming,
  PLAN_HIERARCHY,
  MIN_PLAN_CONTENT_LENGTH,
  PLAN_TYPE_TO_STORAGE_KEY,
  normalizePlanType,
} from "./lifecycle";

export interface StatusUpdateResult {
  artifact: Artifact;
  memoryState: MemoryState | null;
}

// ─── 统一状态更新入口 ─────────────────────────────────

export async function updatePlanStatus(
  planType: string,
  newStatus: PlanStatus,
  options?: { note?: string }
): Promise<StatusUpdateResult> {
  await ensureSeedData();

  const normalizedType = normalizePlanType(planType);
  const content = await readLatestPlanContent(normalizedType);
  if (!content) {
    throw new Error(`${planType} 计划文件不存在`);
  }

  const currentStatus = parseStatusFromContent(content);

  // 验证状态转换
  const transition = validateTransition(currentStatus, newStatus);
  if (!transition.valid) {
    throw new Error(transition.reason || "无效的状态转换");
  }

  // 替换状态行并保存
  const updatedContent = replaceStatusInContent(content, newStatus);

  const artifact = await getWorkflowService().createAndCommitUserArtifact(
    {
      workflowType: "state_adjust",
      artifactKind: "plan",
      title: `${planType} plan (status: ${newStatus})`,
      content: updatedContent,
      evidenceType: "user_fact",
      metadata: {
        planType: normalizedType,
        status: newStatus,
        previousStatus: currentStatus,
        source: `lifecycle_${planType}_put`,
      },
    },
    options?.note || `Plan status changed: ${currentStatus} → ${newStatus}`
  );

  // 更新 MemoryState
  const memoryState = await updateMemoryStateForStatus(planType, newStatus, artifact.id);

  // 审计日志
  await getStorageAdapter().appendAuditLog({
    id: createId("audit"),
    eventType: "plan_status_changed",
    targetId: artifact.id,
    targetType: "plan",
    message: `Plan ${planType} status: ${currentStatus} → ${newStatus}`,
    metadata: {
      planType,
      previousStatus: currentStatus,
      newStatus,
      artifactId: artifact.id,
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  return { artifact, memoryState };
}

// ─── 自动状态转换（GET 时触发）─────────────────────────

export interface AutoTransitionResult {
  status: PlanStatus;
  transitioned: boolean;
  fromStatus?: PlanStatus;
  phase: string;
  warnings: string[];
}

/**
 * 在 GET handler 中调用，自动检测并执行状态转换：
 *  - 周期开始 → draft → active
 *  - 复盘窗口关闭 → active → expired
 */
export async function autoTransitionOnGet(
  planType: string
): Promise<AutoTransitionResult> {
  const normalizedType = normalizePlanType(planType);
  const content = await readLatestPlanContent(normalizedType);
  if (!content) return { status: "draft", transitioned: false, phase: "before_period", warnings: [] };

  const currentStatus = parseStatusFromContent(content);
  const now = new Date();
  const phase = computePlanPhase(now, normalizedType, content);

  // 周期未开始 → 保持 draft
  if (phase === "before_period") {
    return { status: currentStatus, transitioned: false, phase, warnings: [] };
  }

  // 周期内 → draft → active
  if (phase === "in_period" && currentStatus === "draft") {
    try {
      await updatePlanStatus(planType, "active", { note: "系统自动：周期开始，计划进入执行中" });
      return { status: "active", transitioned: true, fromStatus: "draft", phase, warnings: ["计划已自动从「未开始」切换为「进行中」（周期已到）"] };
    } catch (e) {
      console.error("autoTransitionOnGet draft→active failed:", (e as Error).message);
      return { status: currentStatus, transitioned: false, phase, warnings: [] };
    }
  }

  // 复盘窗口关闭 → active → expired
  if (phase === "after_window" && currentStatus === "active") {
    try {
      await updatePlanStatus(planType, "expired", { note: "系统自动：复盘窗口已关闭" });
      return { status: "expired", transitioned: true, fromStatus: "active", phase, warnings: ["计划已自动标记为「逾期」（复盘窗口已关闭），可补交复盘恢复"] };
    } catch (e) {
      console.error("autoTransitionOnGet active→expired failed:", (e as Error).message);
      return { status: currentStatus, transitioned: false, phase, warnings: [] };
    }
  }

  return { status: currentStatus, transitioned: false, phase, warnings: [] };
}

// ─── 复盘联动：完成计划 ────────────────────────────────

export interface ReviewCompleteResult {
  completed: boolean;
  artifact?: Artifact;
  memoryState?: MemoryState | null;
  cascadeSuggestion?: string;
  isLateReview: boolean;
  latencyDays: number;
  error?: string;
}

/**
 * 复盘确认后自动完成对应计划。
 * 支持逾期补交：expired 状态的计划也能被复盘驱动完成。
 */
export async function completePlanFromReview(
  planType: string
): Promise<ReviewCompleteResult> {
  try {
    const normalizedType = normalizePlanType(planType);
    const content = await readLatestPlanContent(normalizedType);
    if (!content) return { completed: false, error: "计划不存在", isLateReview: false, latencyDays: 0 };

    const currentStatus = parseStatusFromContent(content);

    // 已完成则跳过
    if (currentStatus === "completed") {
      return { completed: true, isLateReview: false, latencyDays: 0 };
    }

    // draft → 先自动激活再完成
    if (currentStatus === "draft") {
      try {
        await updatePlanStatus(planType, "active", { note: "系统自动：复盘前激活计划" });
      } catch {
        // 激活失败则继续尝试直接完成
      }
    }

    // 检查复盘是否逾期
    const period = extractPeriod(normalizedType, content);
    const now = new Date();
    const timing = period
      ? checkReviewTiming(normalizedType, period.end, now)
      : { isLate: false, latencyDays: 0 };

    // expired/completed → completed（补交），直接允许
    const result = await updatePlanStatus(planType, "completed", {
      note: timing.isLate
        ? `逾期复盘（${timing.latencyDays}天），计划完成`
        : "复盘已确认，计划完成",
    });

    // 级联建议
    const cascade = buildCascadeSuggestion(planType);

    return {
      completed: true,
      artifact: result.artifact,
      memoryState: result.memoryState,
      cascadeSuggestion: cascade,
      isLateReview: timing.isLate,
      latencyDays: timing.latencyDays,
    };
  } catch (error) {
    return {
      completed: false,
      error: (error as Error).message,
      isLateReview: false,
      latencyDays: 0,
    };
  }
}

function buildCascadeSuggestion(completedPlanType: string): string | undefined {
  const suggestions: Record<string, string> = {
    daily: "生成明日日计划",
    weekly: "生成下周计划",
    monthly: "生成下月计划",
  };
  return suggestions[completedPlanType];
}

// ─── 进度查询 ───────────────────────────────────────────

export interface ProgressGridItem {
  date: string;
  status: "completed" | "incomplete" | "no_plan" | "future";
}

export interface PlanProgress {
  periodStart: string;
  periodEnd: string;
  today: string;
  totalDaysToDate: number;
  completedDays: number;
  incompleteDays: number;
  noPlanDays: number;
  futureDays: number;
  grid: ProgressGridItem[];
}

async function getPeriodProgress(
  planType: "monthly" | "weekly",
  content: string
): Promise<PlanProgress | null> {
  const period = extractPeriod(planType, content);
  if (!period) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const storage = getStorageAdapter();
  const allDailyPlans = await storage.listArtifacts({ kind: "plan", status: "committed" });
  const dailyPlans = allDailyPlans.filter(
    (a) => a.metadata?.planType === "daily" && (a.content?.length || 0) > MIN_PLAN_CONTENT_LENGTH
  );

  const dailyMap = new Map<string, PlanStatus>();
  for (const plan of dailyPlans) {
    const dateMatch = plan.content?.match(/日期[：:]\s*(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      dailyMap.set(dateMatch[1], parseStatusFromContent(plan.content));
    }
  }

  const grid: ProgressGridItem[] = [];
  let completedDays = 0;
  let incompleteDays = 0;
  let noPlanDays = 0;
  let futureDays = 0;
  let totalDaysToDate = 0;

  const fmt = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const cursor = new Date(period.start);
  const end = new Date(period.end);

  while (cursor <= end) {
    const dateStr = fmt(cursor);
    const isFuture = cursor > today;

    if (isFuture) {
      grid.push({ date: dateStr, status: "future" });
      futureDays++;
    } else {
      totalDaysToDate++;
      const dailyStatus = dailyMap.get(dateStr);
      if (dailyStatus === "completed") {
        grid.push({ date: dateStr, status: "completed" });
        completedDays++;
      } else if (dailyStatus) {
        grid.push({ date: dateStr, status: "incomplete" });
        incompleteDays++;
      } else {
        grid.push({ date: dateStr, status: "no_plan" });
        noPlanDays++;
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    periodStart: fmt(period.start),
    periodEnd: fmt(period.end),
    today: fmt(today),
    totalDaysToDate,
    completedDays,
    incompleteDays,
    noPlanDays,
    futureDays,
    grid,
  };
}

export async function getMonthlyProgress(content: string): Promise<PlanProgress | null> {
  return getPeriodProgress("monthly", content);
}

export async function getWeeklyProgress(content: string): Promise<PlanProgress | null> {
  return getPeriodProgress("weekly", content);
}

// ─── MemoryState 联动 ──────────────────────────────────

async function updateMemoryStateForStatus(
  planType: string,
  newStatus: PlanStatus,
  artifactId: string
): Promise<MemoryState | null> {
  const storage = getStorageAdapter();
  const existing = await storage.readMemoryState();
  const now = nowIso();

  const nextActions = buildNextActions(planType, newStatus);
  const currentPhase = buildCurrentPhase(planType, newStatus);

  // 合并 nextActions：保留用户手动添加的项，追加系统生成的
  const mergedActions = existing
    ? [...new Set([...existing.nextActions, ...nextActions])]
    : nextActions;

  const state: MemoryState = existing
    ? {
        ...existing,
        currentPlanId: artifactId,
        currentPhase: currentPhase || existing.currentPhase,
        nextActions: mergedActions,
        updatedAt: now,
      }
    : {
        id: "memory-state_current",
        createdAt: now,
        updatedAt: now,
        currentGoal: "",
        currentPhase: currentPhase || "",
        currentPlanId: artifactId,
        nextActions,
        facts: [],
      };

  return storage.saveMemoryState(state);
}

function buildNextActions(planType: string, status: PlanStatus): string[] {
  const rules: Record<string, Record<string, string[]>> = {
    monthly: {
      active: ["执行本周计划", "日计划跟进"],
      completed: ["生成本月复盘", "生成下月计划"],
      expired: ["补交月复盘", "生成新月计划草稿"],
    },
    weekly: {
      active: ["执行今日计划"],
      completed: ["生成本周复盘", "生成下周计划"],
      expired: ["补交周复盘", "生成新周计划草稿"],
    },
    daily: {
      active: ["完成今日任务"],
      completed: ["今日复盘", "生成明日计划", "生成明日备课"],
      expired: ["补交今日复盘"],
    },
    master: {
      active: ["按阶段推进"],
    },
  };

  return rules[planType]?.[status] || [];
}

function buildCurrentPhase(planType: string, status: PlanStatus): string {
  const label =
    planType === "monthly" ? "月计划" :
    planType === "weekly" ? "周计划" :
    planType === "daily" ? "日计划" :
    planType === "master" ? "Master Plan" : planType;

  return `${label}（${status === "draft" ? "未开始" : status === "active" ? "执行中" : status === "completed" ? "已完成" : "逾期"}）`;
}
