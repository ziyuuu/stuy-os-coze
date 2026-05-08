import { NextRequest, NextResponse } from "next/server";
import { getStorageAdapter } from "@/lib/harness/storage";
import type { ArtifactKind, ArtifactStatus } from "@/lib/harness/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const artifacts = await getStorageAdapter().listArtifacts({
    kind: (searchParams.get("kind") || undefined) as ArtifactKind | undefined,
    status: (searchParams.get("status") || undefined) as ArtifactStatus | undefined,
    date: searchParams.get("date") || undefined,
  });

  return NextResponse.json({ success: true, data: artifacts });
}
