import { NextRequest, NextResponse } from "next/server";
import { createStateUpdateSuggestion, getWorkflowService } from "@/lib/harness/workflow";
import { getStorageAdapter } from "@/lib/harness/storage";
import { completePlanFromReview } from "@/lib/plans/status-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REVIEW_TO_PLAN_TYPE: Record<string, string> = {
  daily_review: "daily",
  week_review: "weekly",
  monthly_review: "monthly",
};

import { parseBody } from '@/lib/validation/helpers';
import { WorkflowConfirmSchema } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  const parsed = await parseBody(request, WorkflowConfirmSchema);
  if (!parsed.success) return parsed.errorResponse;
  const body = parsed.data;

  try {
    const result = await getWorkflowService().confirmDraft({
      draftId: body.draftId,
      confirmedBy: body.confirmedBy,
      note: body.note,
    });

    // 复盘确认 → 联动计划状态（自底向上级联）
    let planResult: {
      planType: string;
      completed: boolean;
      cascadeSuggestion?: string;
      isLateReview?: boolean;
      latencyDays?: number;
      error?: string;
    } | null = null;

    if (result.artifact.kind === "review") {
      const draft = await getStorageAdapter().readDraft(body.draftId);
      const workflowType = draft?.workflowType || "";
      const planType = REVIEW_TO_PLAN_TYPE[workflowType];
      if (planType) {
        const completed = await completePlanFromReview(planType);
        planResult = {
          planType,
          completed: completed.completed,
          cascadeSuggestion: completed.cascadeSuggestion,
          isLateReview: completed.isLateReview,
          latencyDays: completed.latencyDays,
          error: completed.error,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        artifact: result.artifact,
        confirmation: result.confirmation,
        stateUpdateSuggestion: createStateUpdateSuggestion(result.artifact.content),
        planResult,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Workflow confirm failed" },
      { status: 500 }
    );
  }
}
