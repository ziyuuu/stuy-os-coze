/**
 * 流程保存 API
 * 保存流程执行结果。AI 生成内容必须经过用户点击确认后才提交为 artifact；
 * 本接口不再自动修改当前状态，只返回状态更新建议。
 */

import { NextRequest, NextResponse } from "next/server";
import { getFlowDefinition, getNextRecommendedFlow, type FlowType } from "@/lib/flow-engine";
import { createStateUpdateSuggestion, getWorkflowService } from "@/lib/harness/workflow";
import type { ArtifactKind } from "@/lib/harness/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flowType, content, outputPath } = body as {
      flowType: FlowType;
      content: string;
      outputPath?: string;
    };

    if (!flowType || !content) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const flowDef = getFlowDefinition(flowType);
    const service = getWorkflowService();
    const { draft } = await service.createDraft({
      workflowType: flowType,
      artifactKind: artifactKindForFlow(flowType),
      title: `${flowDef?.name || flowType} ${new Date().toISOString().split("T")[0]}`,
      content,
      evidenceType: "draft",
      metadata: {
        flowType,
        outputPath,
        source: "compat_flows_save",
      },
    });

    const { artifact } = await service.confirmDraft({
      draftId: draft.id,
      confirmedBy: "local-user",
      note: "User confirmed generated flow content in the execution UI.",
    });

    const nextFlow = getNextRecommendedFlow(flowType);

    return NextResponse.json({
      success: true,
      data: {
        path: `artifact:${artifact.id}`,
        artifact,
        draftId: draft.id,
        updated: [],
        stateUpdateSuggestion: createStateUpdateSuggestion(content),
        nextFlow,
      },
    });
  } catch (error) {
    console.error("[Flow Save Error]", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

function artifactKindForFlow(flowType: FlowType): ArtifactKind {
  if (flowType.includes("review")) return "review";
  if (flowType.includes("prep")) return "lesson_prep";
  return "plan";
}
