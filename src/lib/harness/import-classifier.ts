import type {
  ArtifactKind,
  EvidenceType,
  ImportBatch,
  ImportBatchItem,
  ImportItemKind,
} from "./types";
import { createId, nowIso } from "./id";

export interface ImportFileInput {
  fileName: string;
  mediaType: string;
  size: number;
  content: string;
}

const SUPPORTED_EXTENSIONS = new Set([".md", ".txt", ".json"]);

export function isSupportedImportFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return Array.from(SUPPORTED_EXTENSIONS).some((ext) => lower.endsWith(ext));
}

function artifactKindFromImportKind(kind: ImportItemKind): ArtifactKind {
  switch (kind) {
    case "output_artifact":
      return "output";
    case "review_record":
      return "review";
    case "idea_pool":
      return "idea_pool";
    case "learning_record":
      return "learning_record";
    case "source_material":
      return "source_material";
    default:
      return "unknown";
  }
}

function classifyText(fileName: string, content: string): {
  kind: ImportItemKind;
  confidence: number;
  reason: string;
} {
  const haystack = `${fileName}\n${content.slice(0, 5000)}`.toLowerCase();

  if (/复盘|review|retrospective|reflection/.test(haystack)) {
    return { kind: "review_record", confidence: 0.84, reason: "文件名或正文包含复盘/回顾信号。" };
  }
  if (/作品集|产出|output|artifact|demo|case study|案例/.test(haystack)) {
    return { kind: "output_artifact", confidence: 0.82, reason: "文件名或正文包含产出/作品集信号。" };
  }
  if (/idea|想法|点子|候选|机会|opportunity/.test(haystack)) {
    return { kind: "idea_pool", confidence: 0.78, reason: "文件名或正文包含 idea/机会池信号。" };
  }
  if (/学习|课程|course|lesson|day\s*\d+|笔记|训练|training/.test(haystack)) {
    return { kind: "learning_record", confidence: 0.74, reason: "文件名或正文包含学习记录/课程信号。" };
  }
  if (/resource|source|资料|材料|catalog|index|readme/.test(haystack)) {
    return { kind: "source_material", confidence: 0.68, reason: "文件名或正文包含资料/索引信号。" };
  }

  return { kind: "unknown", confidence: 0.2, reason: "没有足够信号，保守归类为 unknown。" };
}

export function buildImportBatch(files: ImportFileInput[]): ImportBatch {
  const now = nowIso();
  const items: ImportBatchItem[] = files.map((file) => {
    const classified = classifyText(file.fileName, file.content);
    return {
      id: createId("import_item"),
      fileName: file.fileName,
      mediaType: file.mediaType,
      size: file.size,
      originalContent: file.content,
      classifiedAs: classified.kind,
      artifactKind: artifactKindFromImportKind(classified.kind),
      evidenceType: "imported" satisfies EvidenceType,
      confidence: classified.confidence,
      reason: classified.reason,
    };
  });

  const byType = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.classifiedAs] = (acc[item.classifiedAs] || 0) + 1;
    return acc;
  }, {});

  return {
    id: createId("import_batch"),
    status: "user_reviewing",
    items,
    summary: {
      total: items.length,
      byType,
    },
    committedArtifactIds: [],
    errors: [],
    createdAt: now,
    updatedAt: now,
  };
}
