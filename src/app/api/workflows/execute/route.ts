import { NextRequest, NextResponse } from "next/server";
import { getWorkflowService } from "@/lib/harness/workflow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.workflowType || !body.artifactKind || !body.title || !body.content) {
      return NextResponse.json(
        { success: false, error: "workflowType、artifactKind、title、content 为必填" },
        { status: 400 }
      );
    }

    const result = await getWorkflowService().createDraft({
      workflowType: body.workflowType,
      artifactKind: body.artifactKind,
      title: body.title,
      content: body.content,
      evidenceType: body.evidenceType || "draft",
      evidenceItems: body.evidenceItems || [],
      input: body.input,
      contextRefs: body.contextRefs,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Workflow execution failed" },
      { status: 500 }
    );
  }
}
