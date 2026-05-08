// API: /api/templates - 获取所有模板（从 harness storage 读取）
import { NextResponse } from "next/server";
import { getStorageAdapter } from "@/lib/harness/storage";
import { ensureSeedData } from "@/lib/harness/seed";
import { extractHeadings, parseFrontMatter } from "@/lib/file-utils";

export async function GET() {
  try {
    await ensureSeedData();
    const storage = getStorageAdapter();
    const artifacts = await storage.listArtifacts({ kind: "source_material" });
    const templateArtifacts = artifacts.filter(
      (a) => a.metadata?.seedType === "template"
    );

    const templates: {
      id: string;
      name: string;
      type: string;
      description: string;
    }[] = [];

    for (const artifact of templateArtifacts) {
      const content = artifact.content;
      if (!content) continue;

      const { metadata, body } = parseFrontMatter(content);
      const headings = extractHeadings(content);

      const fileName = artifact.title || "";
      let type = "general";
      if (fileName.includes("plan")) type = "plan";
      else if (fileName.includes("review")) type = "review";
      else if (fileName.includes("lesson_prep") || fileName.includes("prep"))
        type = "lesson_prep";
      else if (fileName.includes("evaluation")) type = "evaluation";
      else if (fileName.includes("output")) type = "output";
      else if (fileName.includes("portfolio")) type = "portfolio";
      else if (fileName.includes("closed_loop")) type = "closed_loop";

      templates.push({
        id: fileName,
        name:
          (metadata["名称"] as string) || headings[0]?.text || fileName,
        type,
        description: body.slice(0, 200).replace(/\n/g, " ").trim(),
      });
    }

    const groupedTemplates = {
      plan: templates.filter((t) => t.type === "plan"),
      review: templates.filter((t) => t.type === "review"),
      lesson_prep: templates.filter((t) => t.type === "lesson_prep"),
      evaluation: templates.filter((t) => t.type === "evaluation"),
      output: templates.filter((t) => t.type === "output"),
      portfolio: templates.filter((t) => t.type === "portfolio"),
      closed_loop: templates.filter((t) => t.type === "closed_loop"),
      general: templates.filter((t) => t.type === "general"),
    };

    return NextResponse.json({
      success: true,
      data: {
        templates,
        groupedTemplates,
        totalCount: templates.length,
      },
    });
  } catch (error) {
    console.error("获取模板列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取模板列表失败" },
      { status: 500 }
    );
  }
}
