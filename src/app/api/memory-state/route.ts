import { NextRequest, NextResponse } from "next/server";
import { getStorageAdapter } from "@/lib/harness/storage";
import { createId, nowIso } from "@/lib/harness/id";
import type { MemoryState } from "@/lib/harness/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMPTY_STATE: MemoryState = {
  id: "memory-state_current",
  createdAt: "",
  updatedAt: "",
  currentGoal: "",
  currentPhase: "",
  currentPlanId: "",
  nextActions: [],
  facts: [],
};

export async function GET() {
  try {
    const state = await getStorageAdapter().readMemoryState();
    return NextResponse.json({
      success: true,
      data: state || EMPTY_STATE,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

interface MemoryStateUpdate {
  currentGoal?: string;
  currentPhase?: string;
  currentPlanId?: string;
  nextActions?: string[];
}

const MAX_STRING_LENGTH = 5000;
const MAX_ACTIONS = 20;
const MAX_ACTION_LENGTH = 500;

function validateStringField(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new Error(`${fieldName} 必须是字符串`);
  if (value.length > MAX_STRING_LENGTH) throw new Error(`${fieldName} 超过最大长度 ${MAX_STRING_LENGTH}`);
  return value.trim() || undefined;
}

function validateNextActions(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) throw new Error("nextActions 必须是字符串数组");
  if (value.length > MAX_ACTIONS) throw new Error(`nextActions 最多 ${MAX_ACTIONS} 条`);
  const result: string[] = [];
  for (let i = 0; i < value.length; i++) {
    if (typeof value[i] !== "string") throw new Error(`nextActions[${i}] 必须是字符串`);
    const trimmed = value[i].trim();
    if (trimmed.length > MAX_ACTION_LENGTH) throw new Error(`nextActions[${i}] 超过最大长度 ${MAX_ACTION_LENGTH}`);
    if (trimmed.length > 0) result.push(trimmed);
  }
  return result.length > 0 ? result : undefined;
}

/**
 * 内部接口 — 由计划状态变更、复盘确认、AI 教练对话等系统流程调用。
 * 前端 MemoryState 页面已改为只读展示，用户不应直接调用此接口。
 */
export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const body: MemoryStateUpdate = {};

    // Schema validation
    body.currentGoal = validateStringField(raw.currentGoal, "currentGoal");
    body.currentPhase = validateStringField(raw.currentPhase, "currentPhase");
    body.currentPlanId = validateStringField(raw.currentPlanId, "currentPlanId");
    body.nextActions = validateNextActions(raw.nextActions);

    // Reject empty body
    if (Object.values(body).every((v) => v === undefined)) {
      return NextResponse.json(
        { success: false, error: "至少需要一个有效字段" },
        { status: 400 }
      );
    }

    const storage = getStorageAdapter();
    const existing = await storage.readMemoryState();
    const now = nowIso();

    const state: MemoryState = existing
      ? {
          ...existing,
          currentGoal: body.currentGoal ?? existing.currentGoal,
          currentPhase: body.currentPhase ?? existing.currentPhase,
          currentPlanId: body.currentPlanId ?? existing.currentPlanId,
          nextActions: body.nextActions ?? existing.nextActions,
          updatedAt: now,
        }
      : {
          id: createId("memory-state"),
          createdAt: now,
          updatedAt: now,
          currentGoal: body.currentGoal ?? "",
          currentPhase: body.currentPhase ?? "",
          currentPlanId: body.currentPlanId ?? "",
          nextActions: body.nextActions ?? [],
          facts: [],
        };

    const saved = await storage.saveMemoryState(state);

    // Audit log
    await storage.appendAuditLog({
      id: createId("audit"),
      eventType: "memory_state_updated",
      targetId: saved.id,
      targetType: "memory_state",
      message: "MemoryState updated via internal system flow",
      metadata: { updatedFields: Object.keys(body).filter((k) => body[k as keyof MemoryStateUpdate] !== undefined) },
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
