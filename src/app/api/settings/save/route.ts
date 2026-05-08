import { NextRequest, NextResponse } from "next/server";
import { getWorkflowService } from "@/lib/harness/workflow";
import type { ArtifactKind } from "@/lib/harness/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, id, content } = body;

    if (!type || content === undefined) {
      return NextResponse.json(
        { success: false, error: "参数不完整" },
        { status: 400 }
      );
    }

    const artifactKind = artifactKindForSettingsType(type);
    if (!artifactKind) {
      return NextResponse.json(
        { success: false, error: "无效的类型" },
        { status: 400 }
      );
    }

    const artifact = await getWorkflowService().createAndCommitUserArtifact(
      {
        workflowType: "plan_edit",
        artifactKind,
        title: id || `${type}_${new Date().toISOString().split("T")[0]}`,
        content,
        evidenceType: "user_fact",
        metadata: {
          settingsType: type,
          originalId: id,
          source: "compat_settings_save",
        },
      },
      "User saved content through settings editor compatibility endpoint."
    );

    return NextResponse.json({
      success: true,
      data: {
        path: `artifact:${artifact.id}`,
        artifact,
        type,
        id,
      },
    });
  } catch (error) {
    console.error("Settings save error:", error);
    return NextResponse.json(
      { success: false, error: "保存失败" },
      { status: 500 }
    );
  }
}

function artifactKindForSettingsType(type: string): ArtifactKind | null {
  const map: Record<string, ArtifactKind> = {
    flows: "source_material",
    templates: "source_material",
    resources: "source_material",
    roles: "source_material",
    outputs: "output",
  };
  return map[type] || null;
}
