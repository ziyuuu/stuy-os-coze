// API: /api/resources - 获取所有资源（从 harness storage 读取）
import { NextResponse } from "next/server";
import { getStorageAdapter } from "@/lib/harness/storage";
import { ensureSeedData } from "@/lib/harness/seed";
import {
  extractHeadings,
  extractListItems,
  parseFrontMatter,
  parseMarkdownTable,
} from "@/lib/file-utils";

export async function GET() {
  try {
    await ensureSeedData();
    const storage = getStorageAdapter();

    // 读取 resource catalog artifact
    const catalogArtifact = await storage.readArtifact(
      "seed-data-resources_resource_catalog"
    );
    const resourceCatalog = catalogArtifact?.content || "";

    let resources: {
      id: string;
      name: string;
      type: string;
      status: string;
      priority: string;
    }[] = [];

    if (resourceCatalog) {
      const table = parseMarkdownTable(resourceCatalog);
      if (table) {
        resources = table.rows
          .filter((row) => {
            const id = row[0] || "";
            return id !== "---" && id !== "Resource ID" && id !== "Module";
          })
          .map((row) => ({
            id: row[0] || "",
            name: row[1] || "",
            type: row[3] || "",
            status: row[6] || "pending",
            priority: row[15] || "",
          }));
      }
    }

    // 列出所有 seed 源材料 artifacts
    const allArtifacts = await storage.listArtifacts({
      kind: "source_material",
    });

    // 源材料
    const sourceMaterialArtifacts = allArtifacts.filter(
      (a) =>
        a.metadata?.seedType === "source_material" &&
        typeof a.metadata?.seedPath === "string" &&
        (a.metadata.seedPath as string).startsWith("resources/source_materials/") &&
        !(a.metadata.seedPath as string).includes("notion_exports")
    );

    const sourceMaterials: {
      id: string;
      name: string;
      type: string;
    }[] = sourceMaterialArtifacts.map((a) => {
      const { metadata } = parseFrontMatter(a.content);
      return {
        id: a.title,
        name: (metadata["名称"] as string) || a.title,
        type: (metadata["类型"] as string) || "document",
      };
    });

    // Notion exports — 从 harness 中读取（扁平化为文件列表，无目录结构）
    const notionArtifacts = allArtifacts.filter(
      (a) =>
        a.metadata?.seedType === "source_material" &&
        typeof a.metadata?.seedPath === "string" &&
        (a.metadata.seedPath as string).includes("notion_exports")
    );
    const notionExports: { id: string; name: string; count: number }[] =
      notionArtifacts.length > 0
        ? [
            {
              id: "notion_exports",
              name: "notion exports",
              count: notionArtifacts.length,
            },
          ]
        : [];

    // 方法论
    const methodologyArtifact = await storage.readArtifact(
      "seed-data-methodologies_methodology_index"
    );
    const methodologyContent = methodologyArtifact?.content || "";
    let methodologies: string[] = [];
    if (methodologyContent) {
      const headings = extractHeadings(methodologyContent);
      methodologies = headings
        .filter((h) => h.level === 2)
        .map((h) => h.text);
    }

    // 角色
    const roleArtifacts = allArtifacts.filter(
      (a) => a.metadata?.seedType === "role"
    );
    const roles: { id: string; name: string; description: string }[] =
      roleArtifacts.map((a) => {
        const headings = extractHeadings(a.content);
        const listItems = extractListItems(a.content);
        return {
          id: a.title,
          name: headings[0]?.text || a.title,
          description: listItems[0] || "",
        };
      });

    return NextResponse.json({
      success: true,
      data: {
        resources,
        sourceMaterials,
        notionExports,
        methodologies,
        roles,
        summary: {
          totalResources: resources.length,
          totalSourceMaterials: sourceMaterials.length,
          totalMethodologies: methodologies.length,
          totalRoles: roles.length,
        },
      },
    });
  } catch (error) {
    console.error("获取资源列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取资源列表失败" },
      { status: 500 }
    );
  }
}
