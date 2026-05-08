import { NextRequest, NextResponse } from "next/server";
import { getStorageAdapter } from "@/lib/harness/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || undefined;
    const drafts = await getStorageAdapter().listDrafts(status ? { status } : {});
    return NextResponse.json({ success: true, data: drafts });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
