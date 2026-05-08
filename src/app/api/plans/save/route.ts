import { NextRequest, NextResponse } from "next/server";
import { getWorkflowService } from "@/lib/harness/workflow";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planType, content } = body;

    if (!planType || !content) {
      return NextResponse.json(
        { success: false, error: "参数不完整" },
        { status: 400 }
      );
    }

    const normalizedType = normalizePlanType(planType);
    if (!normalizedType) {
      return NextResponse.json(
        { success: false, error: "无效的计划类型" },
        { status: 400 }
      );
    }

    const date = new Date().toISOString().split("T")[0];
    const artifact = await getWorkflowService().createAndCommitUserArtifact(
      {
        workflowType: "plan_edit",
        artifactKind: "plan",
        title: `${normalizedType} plan ${date}`,
        content,
        evidenceType: "user_fact",
        metadata: {
          planType: normalizedType,
          date,
          source: "compat_plans_save",
        },
      },
      "User saved a plan through the compatibility endpoint."
    );

    return NextResponse.json({
      success: true,
      data: {
        path: `artifact:${artifact.id}`,
        artifact,
        planType,
      },
    });
  } catch (error) {
    console.error("Save plan error:", error);
    return NextResponse.json(
      { success: false, error: "保存失败" },
      { status: 500 }
    );
  }
}

function normalizePlanType(planType: string): string | null {
  const map: Record<string, string> = {
    master: "master",
    month: "monthly",
    monthly: "monthly",
    week: "weekly",
    weekly: "weekly",
    daily: "daily",
  };
  return map[planType] || null;
}
