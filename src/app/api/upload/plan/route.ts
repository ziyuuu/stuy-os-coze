/**
 * 上传计划 API
 * 支持日/周/月计划上传
 */

import { NextRequest, NextResponse } from "next/server";
import { getWorkflowService } from "@/lib/harness/workflow";
import type { ArtifactKind } from "@/lib/harness/types";
import { PLAN_TYPE_TO_STORAGE_KEY, normalizePlanType } from "@/lib/plans/lifecycle";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planType, date, content } = body;

    if (!planType || !content) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数" },
        { status: 400 }
      );
    }

    if (!PLAN_TYPE_TO_STORAGE_KEY[planType]) {
      return NextResponse.json(
        { success: false, error: "无效的计划类型" },
        { status: 400 }
      );
    }

    const today = date || new Date().toISOString().split("T")[0];
    const normalizedType = normalizePlanType(planType);

    const artifact = await getWorkflowService().createAndCommitUserArtifact(
      {
        workflowType: "plan_edit",
        artifactKind: "plan" satisfies ArtifactKind,
        title: `${normalizedType} plan ${today}`,
        content,
        evidenceType: "user_fact",
        metadata: {
          date: today,
          planType: normalizedType,
          source: "compat_upload_plan",
        },
      },
      "User uploaded or edited a plan through the compatibility endpoint."
    );

    return NextResponse.json({
      success: true,
      data: {
        path: `artifact:${artifact.id}`,
        artifact,
        planType: normalizedType,
        date: today,
      },
    });
  } catch (error) {
    console.error("Upload plan error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
