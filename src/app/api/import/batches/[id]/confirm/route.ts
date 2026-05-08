import { NextRequest, NextResponse } from "next/server";
import { createId, nowIso } from "@/lib/harness/id";
import { getStorageAdapter } from "@/lib/harness/storage";
import { WorkflowService } from "@/lib/harness/workflow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const storage = getStorageAdapter();
    const batch = await storage.readImportBatch(id);

    if (!batch) {
      return NextResponse.json({ success: false, error: "Import batch not found" }, { status: 404 });
    }
    if (batch.status === "committed" || batch.status === "indexed") {
      return NextResponse.json({ success: true, data: batch });
    }

    const service = new WorkflowService(storage);
    const alreadyCommitted: string[] = batch.committedArtifactIds || [];
    const committedArtifactIds: string[] = [...alreadyCommitted];
    const errors: string[] = [];

    for (let i = 0; i < batch.items.length; i++) {
      const item = batch.items[i];
      // Skip items already committed in a prior partial run (by index)
      if (i < alreadyCommitted.length) continue;

      try {
        const artifact = await service.createAndCommitUserArtifact(
          {
            workflowType: "asset_import",
            artifactKind: item.artifactKind,
            title: item.fileName,
            content: item.originalContent,
            evidenceType: item.evidenceType,
            evidenceItems: [
              {
                id: createId("evidence"),
                evidenceType: "imported",
                sourceId: batch.id,
                title: item.fileName,
                content: item.reason,
                metadata: {
                  importItemId: item.id,
                  classifiedAs: item.classifiedAs,
                  confidence: item.confidence,
                },
                createdAt: nowIso(),
                updatedAt: nowIso(),
              },
            ],
            metadata: {
              importBatchId: batch.id,
              importItemId: item.id,
              fileName: item.fileName,
              mediaType: item.mediaType,
              size: item.size,
              classifiedAs: item.classifiedAs,
            },
          },
          body.note || "Import batch confirmed by user."
        );
        committedArtifactIds.push(artifact.id);
      } catch (err) {
        errors.push(`[${item.id}] ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    const now = nowIso();
    const updatedBatch = {
      ...batch,
      status: "committed" as const,
      committedArtifactIds,
      errors: errors.length > 0 ? errors : batch.errors,
      updatedAt: now,
    };

    await storage.saveImportBatch(updatedBatch);
    await storage.appendAuditLog({
      id: createId("audit"),
      eventType: "import_batch_confirmed",
      targetId: batch.id,
      targetType: "import_batch",
      message: `Import batch confirmed with ${committedArtifactIds.length} artifact(s)`,
      metadata: { committedArtifactIds },
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, data: updatedBatch });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Import confirm failed" },
      { status: 500 }
    );
  }
}
