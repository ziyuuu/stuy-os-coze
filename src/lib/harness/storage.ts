import fs from "fs";
import path from "path";
import os from "os";
import type {
  Artifact,
  ArtifactFilter,
  AuditLog,
  Confirmation,
  Draft,
  ImportBatch,
  MemoryState,
  StorageAdapter,
  WorkflowRun,
} from "./types";
import { createId, nowIso } from "./id";

const RUNTIME_DIR_NAME = ".study-os-runtime";

function safeFileName(id: string): string {
  return id.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function readJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (error) {
    const message = error instanceof SyntaxError
      ? `Storage: 无法解析 JSON 文件 ${filePath}: ${error.message}`
      : `Storage: 无法读取文件 ${filePath}: ${(error as Error).message}`;
    throw new Error(message);
  }
}

function writeJsonFile(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (error) {
    throw new Error(`Storage: 无法创建目录 ${dir}: ${(error as Error).message}`);
  }
  try {
    // Write to temp file first, then rename for atomicity
    const tmpPath = filePath + ".tmp." + Date.now();
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tmpPath, filePath);
  } catch (error) {
    throw new Error(`Storage: 无法写入文件 ${filePath}: ${(error as Error).message}`);
  }
}

function listJsonFiles<T>(dirPath: string): T[] {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((name) => name.endsWith(".json"))
    .map((name) => readJsonFile<T>(path.join(dirPath, name)))
    .filter((value): value is T => Boolean(value));
}

function isWritableDir(dirPath: string): boolean {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    const probePath = path.join(dirPath, ".write-test");
    fs.writeFileSync(probePath, "ok", "utf-8");
    fs.unlinkSync(probePath);
    return true;
  } catch {
    return false;
  }
}

function resolveRuntimeRoot(): string {
  const configured = process.env.STUDY_OS_STORAGE_DIR;
  if (configured && isWritableDir(configured)) return configured;

  const projectLocal = path.join(process.cwd(), RUNTIME_DIR_NAME);
  if (isWritableDir(projectLocal)) return projectLocal;

  const tmpFallback = path.join(os.tmpdir(), "study-os-runtime");
  fs.mkdirSync(tmpFallback, { recursive: true });
  return tmpFallback;
}

export class LocalFileStorageAdapter implements StorageAdapter {
  private readonly root: string;

  constructor(root = resolveRuntimeRoot()) {
    this.root = root;
  }

  private filePath(collection: string, id: string): string {
    return path.join(this.root, collection, `${safeFileName(id)}.json`);
  }

  private collectionPath(collection: string): string {
    return path.join(this.root, collection);
  }

  async readArtifact(id: string): Promise<Artifact | null> {
    return readJsonFile<Artifact>(this.filePath("artifacts", id));
  }

  async saveArtifact(artifact: Artifact): Promise<Artifact> {
    writeJsonFile(this.filePath("artifacts", artifact.id), artifact);
    await this.appendAuditLog({
      id: createId("audit"),
      eventType: "artifact_saved",
      targetId: artifact.id,
      targetType: "artifact",
      message: `Artifact saved: ${artifact.title}`,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      metadata: { kind: artifact.kind, status: artifact.status },
    });
    return artifact;
  }

  async listArtifacts(filter: ArtifactFilter = {}): Promise<Artifact[]> {
    return listJsonFiles<Artifact>(this.collectionPath("artifacts"))
      .filter((artifact) => !filter.kind || artifact.kind === filter.kind)
      .filter((artifact) => !filter.status || artifact.status === filter.status)
      .filter((artifact) => !filter.sourceDraftId || artifact.sourceDraftId === filter.sourceDraftId)
      .filter((artifact) => {
        if (!filter.date) return true;
        return artifact.metadata?.date === filter.date || artifact.createdAt.startsWith(filter.date);
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async saveDraft(draft: Draft): Promise<Draft> {
    writeJsonFile(this.filePath("drafts", draft.id), draft);
    await this.appendAuditLog({
      id: createId("audit"),
      eventType: "draft_saved",
      targetId: draft.id,
      targetType: "draft",
      message: `Draft saved: ${draft.title}`,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      metadata: { workflowType: draft.workflowType, artifactKind: draft.artifactKind },
    });
    return draft;
  }

  async readDraft(id: string): Promise<Draft | null> {
    return readJsonFile<Draft>(this.filePath("drafts", id));
  }

  async commitDraft(draftId: string, confirmation: Confirmation): Promise<Artifact> {
    const draft = await this.readDraft(draftId);
    if (!draft) {
      throw new Error(`Draft not found: ${draftId}`);
    }
    if (draft.status !== "confirmation_pending" && draft.status !== "draft") {
      throw new Error(`Draft cannot be committed from status: ${draft.status}`);
    }
    if (!confirmation.acceptedAt || confirmation.targetId !== draftId || confirmation.targetType !== "draft") {
      throw new Error("A valid user confirmation is required before commit");
    }

    const now = nowIso();
    const artifact: Artifact = {
      id: createId("artifact"),
      sourceDraftId: draft.id,
      workflowRunId: draft.workflowRunId,
      kind: draft.artifactKind,
      title: draft.title,
      content: draft.content,
      status: "committed",
      evidenceType: draft.evidenceType,
      evidenceItems: draft.evidenceItems,
      metadata: {
        ...draft.metadata,
        confirmationId: confirmation.id,
        confirmedBy: confirmation.confirmedBy,
      },
      createdAt: now,
      updatedAt: now,
    };

    const committedDraft: Draft = {
      ...draft,
      status: "committed",
      updatedAt: now,
    };

    writeJsonFile(this.filePath("drafts", draft.id), committedDraft);
    writeJsonFile(this.filePath("confirmations", confirmation.id), confirmation);
    writeJsonFile(this.filePath("artifacts", artifact.id), artifact);

    await this.appendAuditLog({
      id: createId("audit"),
      eventType: "draft_committed",
      targetId: artifact.id,
      targetType: "artifact",
      message: `Draft committed: ${draft.title}`,
      createdAt: now,
      updatedAt: now,
      metadata: { draftId, confirmationId: confirmation.id },
    });

    return artifact;
  }

  async saveWorkflowRun(run: WorkflowRun): Promise<WorkflowRun> {
    writeJsonFile(this.filePath("workflow-runs", run.id), run);
    await this.appendAuditLog({
      id: createId("audit"),
      eventType: "workflow_run_saved",
      targetId: run.id,
      targetType: "workflow_run",
      message: `Workflow run saved: ${run.workflowType}`,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      metadata: { status: run.status },
    });
    return run;
  }

  async readWorkflowRun(id: string): Promise<WorkflowRun | null> {
    return readJsonFile<WorkflowRun>(this.filePath("workflow-runs", id));
  }

  async saveImportBatch(batch: ImportBatch): Promise<ImportBatch> {
    writeJsonFile(this.filePath("import-batches", batch.id), batch);
    await this.appendAuditLog({
      id: createId("audit"),
      eventType: "import_batch_saved",
      targetId: batch.id,
      targetType: "import_batch",
      message: `Import batch saved with ${batch.items.length} item(s)`,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      metadata: { status: batch.status, total: batch.items.length },
    });
    return batch;
  }

  async readImportBatch(id: string): Promise<ImportBatch | null> {
    return readJsonFile<ImportBatch>(this.filePath("import-batches", id));
  }

  async listDrafts(filter: { status?: string } = {}): Promise<Draft[]> {
    return listJsonFiles<Draft>(this.collectionPath("drafts"))
      .filter((draft) => !filter.status || draft.status === filter.status)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async readMemoryState(): Promise<MemoryState | null> {
    return readJsonFile<MemoryState>(this.filePath("memory-state", "current"));
  }

  async saveMemoryState(state: MemoryState): Promise<MemoryState> {
    const now = nowIso();
    const saved: MemoryState = {
      ...state,
      updatedAt: now,
      createdAt: state.createdAt || now,
    };
    writeJsonFile(this.filePath("memory-state", "current"), saved);
    return saved;
  }

  async appendAuditLog(event: AuditLog): Promise<void> {
    fs.mkdirSync(this.root, { recursive: true });
    fs.appendFileSync(path.join(this.root, "audit-log.jsonl"), `${JSON.stringify(event)}\n`, "utf-8");
  }
}

let adapter: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (!adapter) adapter = new LocalFileStorageAdapter();
  return adapter;
}
