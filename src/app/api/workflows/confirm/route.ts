import { NextRequest, NextResponse } from "next/server";
import { createStateUpdateSuggestion, getWorkflowService } from "@/lib/harness/workflow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.draftId) {
      return NextResponse.json(
        { success: false, error: "draftId 为必填" },
        { status: 400 }
      );
    }

    const result = await getWorkflowService().confirmDraft({
      draftId: body.draftId,
      confirmedBy: body.confirmedBy,
      note: body.note,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        stateUpdateSuggestion: createStateUpdateSuggestion(result.artifact.content),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Workflow confirm failed" },
      { status: 500 }
    );
  }
}
