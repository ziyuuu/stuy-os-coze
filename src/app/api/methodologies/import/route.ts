import { NextRequest, NextResponse } from "next/server";
import { getWorkflowService } from "@/lib/harness/workflow";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, filename } = body;

    if (!content || !filename) {
      return NextResponse.json(
        { success: false, error: "缺少内容或文件名" },
        { status: 400 }
      );
    }

    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const artifact = await getWorkflowService().createAndCommitUserArtifact(
      {
        workflowType: "asset_import",
        artifactKind: "source_material",
        title: safeName,
        content,
        evidenceType: "imported",
        metadata: {
          originalFileName: filename,
          source: "compat_methodologies_import",
        },
      },
      "User imported methodology content through compatibility endpoint."
    );

    return NextResponse.json({
      success: true,
      data: {
        path: `artifact:${artifact.id}`,
        artifact,
        filename: safeName
      }
    });
  } catch (error) {
    console.error("导入方法论失败:", error);
    return NextResponse.json(
      { success: false, error: "导入失败" },
      { status: 500 }
    );
  }
}
