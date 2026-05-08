import { NextRequest, NextResponse } from "next/server";
import { getWorkflowService } from "@/lib/harness/workflow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const run = await getWorkflowService().preflight({
      workflowType: body.workflowType,
      input: body.input,
      contextRefs: body.contextRefs,
    });

    return NextResponse.json({ success: true, data: run });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Preflight failed" },
      { status: 500 }
    );
  }
}
