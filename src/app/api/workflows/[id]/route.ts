import { NextResponse } from "next/server";
import { getStorageAdapter } from "@/lib/harness/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const run = await getStorageAdapter().readWorkflowRun(id);
  if (!run) {
    return NextResponse.json({ success: false, error: "Workflow run not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: run });
}
