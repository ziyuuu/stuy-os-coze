/**
 * Seed 机制：将 src/data/ai_pm_transition/ 中的种子 Markdown 文件导入 harness storage。
 * 仅在本地开发时首次运行（有 src/data 目录），Coze 上跳过（无源码目录）。
 * 幂等：通过 sentinel artifact 确保只执行一次。
 */

import fs from "fs";
import path from "path";
import { getStorageAdapter } from "./storage";
import { nowIso } from "./id";
import type { Artifact } from "./types";

const DATA_DIR = path.join(process.cwd(), "src/data/ai_pm_transition");
const SEED_SENTINEL_ID = "seed-completed";

const PLAN_TYPE_MAP: Record<string, string> = {
  "master_plan.md": "master",
  "current_month_plan.md": "monthly",
  "current_week_plan.md": "weekly",
  "current_daily_plan.md": "daily",
};

interface SeedFile {
  relativePath: string;
  seedType: string;
  artifactKind: Artifact["kind"];
  extraMeta?: Record<string, unknown>;
}

function safeArtifactId(prefix: string, relativePath: string): string {
  const safe = relativePath
    .replace(/[^a-zA-Z0-9_.-]+/g, "_")
    .replace(/\.md$/, "")
    .replace(/^[_.-]+|[_.-]+$/g, "");
  return `seed-${prefix}-${safe}`;
}

function collectSeedFiles(): SeedFile[] {
  const files: SeedFile[] = [];

  // Plan seed files
  const plans = [
    "master_plan.md",
    "current_month_plan.md",
    "current_week_plan.md",
    "current_daily_plan.md",
  ];
  for (const f of plans) {
    files.push({
      relativePath: f,
      seedType: "plan",
      artifactKind: "plan",
      extraMeta: { planType: PLAN_TYPE_MAP[f] || f.replace(".md", "") },
    });
  }

  // Templates
  const templatesDir = path.join(DATA_DIR, "templates");
  if (fs.existsSync(templatesDir)) {
    for (const f of fs.readdirSync(templatesDir)) {
      if (f.endsWith(".md") && f !== "README.md") {
        files.push({
          relativePath: `templates/${f}`,
          seedType: "template",
          artifactKind: "source_material",
        });
      }
    }
  }

  // Resource catalog/index/review
  const resourcesDir = path.join(DATA_DIR, "resources");
  if (fs.existsSync(resourcesDir)) {
    for (const f of fs.readdirSync(resourcesDir)) {
      if (f.endsWith(".md")) {
        files.push({
          relativePath: `resources/${f}`,
          seedType: f.replace(/\.md$/, ""),
          artifactKind: "source_material",
        });
      }
    }

    // Source materials
    const sourceMaterialsDir = path.join(resourcesDir, "source_materials");
    if (fs.existsSync(sourceMaterialsDir)) {
      for (const f of fs.readdirSync(sourceMaterialsDir)) {
        if (f.endsWith(".md") && f !== "README.md") {
          files.push({
            relativePath: `resources/source_materials/${f}`,
            seedType: "source_material",
            artifactKind: "source_material",
          });
        }
      }
    }
  }

  // Methodologies
  const methodologiesDir = path.join(DATA_DIR, "methodologies");
  if (fs.existsSync(methodologiesDir)) {
    for (const f of fs.readdirSync(methodologiesDir)) {
      if (f.endsWith(".md") && f !== "README.md") {
        files.push({
          relativePath: `methodologies/${f}`,
          seedType: "methodology",
          artifactKind: "source_material",
        });
      }
    }
  }

  // Roles
  const rolesDir = path.join(DATA_DIR, "roles");
  if (fs.existsSync(rolesDir)) {
    for (const f of fs.readdirSync(rolesDir)) {
      if (f.endsWith(".md") && f !== "README.md") {
        files.push({
          relativePath: `roles/${f}`,
          seedType: "role",
          artifactKind: "source_material",
        });
      }
    }
  }

  return files;
}

export async function ensureSeedData(): Promise<number> {
  const storage = getStorageAdapter();

  // 已执行过 seed，跳过
  const sentinel = await storage.readArtifact(SEED_SENTINEL_ID);
  if (sentinel) return 0;

  // 无 src/data 目录（Coze 环境），跳过
  if (!fs.existsSync(DATA_DIR)) return 0;

  const files = collectSeedFiles();
  let count = 0;

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file.relativePath);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf-8");
    const artifactId = safeArtifactId("data", file.relativePath);
    const now = nowIso();

    await storage.saveArtifact({
      id: artifactId,
      kind: file.artifactKind,
      title: path.basename(file.relativePath, ".md"),
      content,
      status: "committed",
      evidenceType: "imported",
      evidenceItems: [],
      metadata: {
        seedType: file.seedType,
        seedPath: file.relativePath,
        ...(file.extraMeta || {}),
      },
      createdAt: now,
      updatedAt: now,
    });
    count++;
  }

  // 写入 sentinel
  await storage.saveArtifact({
    id: SEED_SENTINEL_ID,
    kind: "source_material",
    title: "Seed Completed Sentinel",
    content: JSON.stringify({ seededAt: nowIso(), fileCount: count }),
    status: "committed",
    evidenceType: "system_event",
    evidenceItems: [],
    metadata: { seedType: "sentinel" },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  return count;
}
