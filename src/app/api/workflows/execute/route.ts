import { NextRequest, NextResponse } from "next/server";
import { getWorkflowService } from "@/lib/harness/workflow";
import { parseBody } from "@/lib/validation/helpers";
import { WorkflowExecuteSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const parsed = await parseBody(request, WorkflowExecuteSchema);
  if (!parsed.success) return parsed.errorResponse;
  const body = parsed.data;

  try {
    const result = await getWorkflowService().createDraft({
      workflowType: body.workflowType,
      artifactKind: body.artifactKind,
      title: body.title,
      content: body.content,
      evidenceType: body.evidenceType || "draft",
      evidenceItems: [],
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
