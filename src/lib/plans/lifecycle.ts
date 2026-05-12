/**
 * 计划生命周期引擎 v2
 *
 * 4 态：draft → active → completed → expired
 * 复盘驱动完成（有复盘即 completed），支持逾期补交（expired → completed）
 * 层级：master → monthly → weekly → daily（用于进度查询）
 */

// ─── 类型定义 ────────────────────────────────────────

export type PlanStatus = "draft" | "active" | "completed" | "expired";

export const STATUS_LABELS: Record<PlanStatus, string> = {
  draft: "未开始",
  active: "进行中",
  completed: "已完成",
  expired: "逾期",
};

/** 旧的 approved/pending 状态 → v2 映射 */
const LEGACY_STATUS_MAP: Record<string, PlanStatus> = {
  approved: "active",
  pending: "draft",
};

export const VALID_TRANSITIONS: Record<PlanStatus, PlanStatus[]> = {
  draft: ["active", "completed", "expired"],
  active: ["draft", "completed", "expired"],
  completed: ["draft", "active", "expired"],
  expired: ["active", "completed", "draft"],
};

/** 计划内容最小长度，短于此值的 artifact 视为状态切换记录而非真实计划 */
export const MIN_PLAN_CONTENT_LENGTH = 100;

/** planType → storage key 映射（兼容旧 month/week 命名） */
export const PLAN_TYPE_TO_STORAGE_KEY: Record<string, string> = {
  master: "master",
  monthly: "monthly",
  weekly: "weekly",
  daily: "daily",
  month: "monthly",
  week: "weekly",
};

export function normalizePlanType(planType: string): string {
  return PLAN_TYPE_TO_STORAGE_KEY[planType] || planType;
}

export interface PlanPeriod {
  start: Date;
  end: Date;
}

// ─── 层级定义（用于进度查询）────────────────────────

export const PLAN_HIERARCHY: Record<string, { parent: string | null; child: string | null }> = {
  master: { parent: null, child: "monthly" },
  monthly: { parent: "master", child: "weekly" },
  weekly: { parent: "monthly", child: "daily" },
  daily: { parent: "weekly", child: null },
};

// ─── 状态转换验证 ─────────────────────────────────────

export function validateTransition(
  from: PlanStatus,
  to: PlanStatus
): { valid: boolean; reason?: string } {
  if (!from || !to) return { valid: false, reason: "状态不能为空" };
  if (from === to) return { valid: false, reason: `已经是「${STATUS_LABELS[from]}」状态` };
  if (!VALID_TRANSITIONS[from]) {
    return { valid: false, reason: `未知来源状态: ${from}` };
  }
  if (!VALID_TRANSITIONS[from].includes(to)) {
    return {
      valid: false,
      reason: `不能从「${STATUS_LABELS[from]}」直接转换到「${STATUS_LABELS[to]}」`,
    };
  }
  return { valid: true };
}

// ─── 状态解析与写入 ────────────────────────────────────

export function parseStatusFromContent(content: string): PlanStatus {
  const match = content.match(/计划状态[：:]\s*([^\s\n]+)/);
  if (!match) return "draft";
  const raw = match[1].trim();
  // 先检查是否为当前有效状态
  if (isValidStatus(raw)) return raw;
  // 兼容旧状态
  if (LEGACY_STATUS_MAP[raw]) return LEGACY_STATUS_MAP[raw];
  return "draft";
}

export function isValidStatus(value: string): value is PlanStatus {
  return Object.keys(VALID_TRANSITIONS).includes(value);
}

export function replaceStatusInContent(content: string, newStatus: PlanStatus): string {
  if (content.match(/计划状态[：:]\s*[^\s\n]+/)) {
    return content.replace(/计划状态[：:]\s*[^\s\n]+/, `计划状态：${newStatus}`);
  }
  return content + `\n\n计划状态：${newStatus}\n`;
}

// ─── 周期提取 ──────────────────────────────────────────

export function extractPeriod(planType: string, content: string): PlanPeriod | null {
  const today = new Date();

  if (planType === "daily") {
    const m = content.match(/日期[：:]\s*(\d{4}-\d{2}-\d{2})/);
    if (m) {
      const d = new Date(m[1] + "T00:00:00");
      if (!isNaN(d.getTime())) return { start: d, end: new Date(m[1] + "T23:59:59") };
    }
    return { start: today, end: today };
  }

  if (planType === "weekly") {
    const m = content.match(/(\d{4}-\d{2}-\d{2})\s*至\s*(\d{4}-\d{2}-\d{2})/);
    if (m) {
      const s = new Date(m[1] + "T00:00:00");
      const e = new Date(m[2] + "T23:59:59");
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) return { start: s, end: e };
    }
    return null;
  }

  if (planType === "monthly") {
    // 格式1: 计划周期：2026-05
    let m = content.match(/计划周期[：:]\s*(\d{4}-\d{2})/);
    if (m) {
      const y = parseInt(m[1].slice(0, 4));
      const mo = parseInt(m[1].slice(5, 7));
      const s = new Date(y, mo - 1, 1);
      const e = new Date(y, mo, 0, 23, 59, 59);
      if (!isNaN(s.getTime())) return { start: s, end: e };
    }
    // 格式2: 月份：Month N（2026-05-07 至 2026-06-07）
    m = content.match(/月份[：:][^\n]*（(\d{4}-\d{2}-\d{2})\s*至\s*(\d{4}-\d{2}-\d{2})）/);
    if (m) {
      const s = new Date(m[1] + "T00:00:00");
      const e = new Date(m[2] + "T23:59:59");
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) return { start: s, end: e };
    }
    return null;
  }

  return null;
}

// ─── 时间阶段计算 ──────────────────────────────────────

export type PlanPhase = "before_period" | "in_period" | "review_window" | "after_window";

/**
 * 计算当前日期相对于计划的阶段。
 */
export function computePlanPhase(
  now: Date,
  planType: string,
  content: string
): PlanPhase {
  const period = extractPeriod(planType, content);
  if (!period) return "in_period"; // 无法解析周期，假设在执行中

  if (now < period.start) return "before_period";
  if (now <= period.end) return "in_period";

  // 周期已过，检查复盘窗口
  const window = getReviewWindow(planType, period.end);
  if (now <= window.closes) return "review_window";

  return "after_window";
}

// ─── 复盘窗口 ───────────────────────────────────────────

export interface ReviewWindow {
  opens: Date;
  closes: Date;
}

/**
 * 复盘窗口 = 周期结束日 ~ 窗口关闭日。
 *
 * daily: 到期日当天 ~ 次日 23:59
 * weekly: 到期日 ~ 下周日 23:59
 * monthly: 到期日 ~ 2个月后 23:59
 */
export function getReviewWindow(planType: string, periodEnd: Date): ReviewWindow {
  const opens = new Date(periodEnd);
  opens.setHours(0, 0, 0, 0);

  let closes = new Date(periodEnd);
  closes.setHours(23, 59, 59, 999);

  if (planType === "daily") {
    closes.setDate(closes.getDate() + 1);
  } else if (planType === "weekly") {
    closes.setDate(closes.getDate() + 7);
  } else if (planType === "monthly") {
    // setMonth 在 31 日会溢出（7/31+2mo→10/1），用日级天数并 cap 到月底
    const target = new Date(closes);
    target.setMonth(target.getMonth() + 2);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    if (target.getDate() < closes.getDate()) {
      target.setDate(lastDay);
    }
    closes = target;
  }

  return { opens, closes };
}

// ─── 逾期检测 ───────────────────────────────────────────

export interface ReviewTiming {
  isLate: boolean;
  latencyDays: number;
}

/**
 * 检查复盘是否逾期。
 * latencyDays = 0 表示按时（窗口内），>0 表示逾期天数。
 */
export function checkReviewTiming(
  planType: string,
  periodEnd: Date,
  reviewDate: Date
): ReviewTiming {
  const window = getReviewWindow(planType, periodEnd);

  if (reviewDate <= window.closes) {
    return { isLate: false, latencyDays: 0 };
  }

  // 计算逾期天数：reviewDate - closes
  const closesDay = new Date(window.closes);
  closesDay.setHours(0, 0, 0, 0);
  const reviewDay = new Date(reviewDate);
  reviewDay.setHours(0, 0, 0, 0);
  const diffMs = reviewDay.getTime() - closesDay.getTime();
  const latencyDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return { isLate: true, latencyDays };
}
