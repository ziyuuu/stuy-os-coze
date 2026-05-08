import type {
  Artifact,
  ArtifactKind,
  Confirmation,
  Draft,
  EvidenceItem,
  EvidenceType,
  StorageAdapter,
  WorkflowRun,
  WorkflowStatus,
  WorkflowType,
} from "./types";
import { createId, nowIso } from "./id";
import { getStorageAdapter } from "./storage";

const COMMITTABLE_DRAFT_STATUSES = new Set<WorkflowStatus>([
  "draft_generated",
  "user_editing",
  "confirmation_pending",
]);

export interface WorkflowPreflightInput {
  workflowType: WorkflowType;
  input?: Record<string, unknown>;
  contextRefs?: string[];
}

export interface WorkflowDraftInput extends WorkflowPreflightInput {
  artifactKind: ArtifactKind;
  title: string;
  content: string;
  evidenceType?: EvidenceType;
  evidenceItems?: EvidenceItem[];
  metadata?: Record<string, unknown>;
}

export interface WorkflowConfirmInput {
  draftId: string;
  confirmedBy?: string;
  note?: string;
}

export function canCommitStatus(status: WorkflowStatus): boolean {
  return COMMITTABLE_DRAFT_STATUSES.has(status);
}

export function createStateUpdateSuggestion(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return "";
  return [
    "以下是可选状态更新建议，尚未写入当前状态：",
    "",
    "- 将本次已确认 artifact 记录为可引用材料。",
    "- 如内容包含用户完成事实，可在复盘确认后再更新当前状态。",
    "- 不要把计划意图或 AI 草稿直接写成已完成事实。",
  ].join("\n");
}

export class WorkflowService {
  constructor(private readonly storage: StorageAdapter = getStorageAdapter()) {}

  async preflight(input: WorkflowPreflightInput): Promise<WorkflowRun> {
    const now = nowIso();
    const run: WorkflowRun = {
      id: createId("workflow"),
      workflowType: input.workflowType,
      status: "preflight",
      input: input.input,
      contextRefs: input.contextRefs || [],
      errors: [],
      warnings: [],
      metadata: {
        harnessVersion: "v0.1",
      },
      createdAt: now,
      updatedAt: now,
    };

    return this.storage.saveWorkflowRun(run);
  }

  async createDraft(input: WorkflowDraftInput): Promise<{ run: WorkflowRun; draft: Draft }> {
    const run = await this.preflight(input);
    const now = nowIso();
    const draft: Draft = {
      id: createId("draft"),
      workflowRunId: run.id,
      workflowType: input.workflowType,
      artifactKind: input.artifactKind,
      title: input.title,
      content: input.content,
      status: "confirmation_pending",
      evidenceType: input.evidenceType || "draft",
      evidenceItems: input.evidenceItems || [],
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
    };

    const savedDraft = await this.storage.saveDraft(draft);
    const updatedRun: WorkflowRun = {
      ...run,
      status: "confirmation_pending",
      draftId: savedDraft.id,
      updatedAt: nowIso(),
    };
    await this.storage.saveWorkflowRun(updatedRun);

    return { run: updatedRun, draft: savedDraft };
  }

  async confirmDraft(input: WorkflowConfirmInput): Promise<{ artifact: Artifact; confirmation: Confirmation }> {
    const draft = await this.storage.readDraft(input.draftId);
    if (!draft) {
      throw new Error(`Draft not found: ${input.draftId}`);
    }

    const run = await this.storage.readWorkflowRun(draft.workflowRunId);
    if (run && !canCommitStatus(run.status)) {
      throw new Error(`Workflow run cannot be committed from status: ${run.status}`);
    }

    const now = nowIso();
    const confirmation: Confirmation = {
      id: createId("confirmation"),
      targetId: input.draftId,
      targetType: "draft",
      confirmedBy: input.confirmedBy || "local-user",
      note: input.note,
      acceptedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const artifact = await this.storage.commitDraft(input.draftId, confirmation);

    if (run) {
      await this.storage.saveWorkflowRun({
        ...run,
        status: "committed",
        artifactId: artifact.id,
        updatedAt: nowIso(),
      });
    }

    return { artifact, confirmation };
  }

  async createAndCommitUserArtifact(input: WorkflowDraftInput, note?: string): Promise<Artifact> {
    const { draft } = await this.createDraft({
      ...input,
      evidenceType: input.evidenceType || "user_fact",
    });
    const { artifact } = await this.confirmDraft({
      draftId: draft.id,
      confirmedBy: "local-user",
      note: note || "User-submitted content committed through compatibility endpoint.",
    });
    return artifact;
  }
}

export function getWorkflowService(): WorkflowService {
  return new WorkflowService();
}
