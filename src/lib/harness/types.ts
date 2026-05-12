export type WorkflowType =
  | "goal_setup"
  | "plan_generate"
  | "plan_edit"
  | "daily_startup"
  | "review_submit"
  | "output_archive"
  | "state_adjust"
  | "evaluation"
  | "asset_import"
  | string;

export type WorkflowStatus =
  | "requested"
  | "preflight"
  | "context_loaded"
  | "draft_generated"
  | "user_editing"
  | "confirmation_pending"
  | "committed"
  | "state_updated"
  | "archived"
  | "blocked_missing_context"
  | "blocked_need_user_input"
  | "rejected"
  | "superseded"
  | "failed";

export type ArtifactKind =
  | "plan"
  | "review"
  | "output"
  | "lesson_prep"
  | "evaluation"
  | "source_material"
  | "learning_record"
  | "idea_pool"
  | "coach_chat"
  | "unknown";

export type ArtifactStatus = "draft" | "committed" | "archived" | "superseded";

export type EvidenceType =
  | "user_fact"
  | "file_evidence"
  | "ai_inference"
  | "plan_intent"
  | "draft"
  | "system_event"
  | "imported"
  | "coach_conversation";

export type ImportItemKind =
  | "source_material"
  | "learning_record"
  | "output_artifact"
  | "review_record"
  | "idea_pool"
  | "unknown";

export type ImportBatchStatus =
  | "uploaded"
  | "parsed"
  | "classified"
  | "mapped"
  | "user_reviewing"
  | "confirmed"
  | "committed"
  | "indexed"
  | "failed";

export interface HarnessRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceItem extends HarnessRecord {
  evidenceType: EvidenceType;
  sourceId?: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface Draft extends HarnessRecord {
  workflowRunId: string;
  workflowType: WorkflowType;
  artifactKind: ArtifactKind;
  title: string;
  content: string;
  status: "draft" | "confirmation_pending" | "committed" | "rejected";
  evidenceType: EvidenceType;
  evidenceItems: EvidenceItem[];
  metadata?: Record<string, unknown>;
}

export interface Artifact extends HarnessRecord {
  sourceDraftId?: string;
  workflowRunId?: string;
  kind: ArtifactKind;
  title: string;
  content: string;
  status: ArtifactStatus;
  evidenceType: EvidenceType;
  evidenceItems: EvidenceItem[];
  metadata?: Record<string, unknown>;
}

export interface Confirmation extends HarnessRecord {
  targetId: string;
  targetType: "draft" | "import_batch" | "state_update";
  confirmedBy: string;
  note?: string;
  acceptedAt: string;
}

export interface WorkflowRun extends HarnessRecord {
  workflowType: WorkflowType;
  status: WorkflowStatus;
  input?: Record<string, unknown>;
  contextRefs: string[];
  draftId?: string;
  artifactId?: string;
  errors: string[];
  warnings: string[];
  metadata?: Record<string, unknown>;
}

export interface ImportBatchItem {
  id: string;
  fileName: string;
  mediaType: string;
  size: number;
  originalContent: string;
  classifiedAs: ImportItemKind;
  artifactKind: ArtifactKind;
  evidenceType: EvidenceType;
  confidence: number;
  reason: string;
}

export interface ImportBatch extends HarnessRecord {
  status: ImportBatchStatus;
  items: ImportBatchItem[];
  summary: {
    total: number;
    byType: Record<string, number>;
  };
  committedArtifactIds: string[];
  errors: string[];
  metadata?: Record<string, unknown>;
}

export interface AuditLog extends HarnessRecord {
  eventType:
    | "draft_saved"
    | "draft_committed"
    | "artifact_saved"
    | "artifact_overwritten"
    | "artifact_deleted"
    | "workflow_run_saved"
    | "import_batch_saved"
    | "import_batch_confirmed"
    | "state_update_suggested"
    | "memory_state_updated"
    | "plan_status_changed";
  targetId: string;
  targetType: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryState extends HarnessRecord {
  currentGoal?: string;
  currentPhase?: string;
  currentPlanId?: string;
  nextActions: string[];
  facts: EvidenceItem[];
  metadata?: Record<string, unknown>;
}

export interface ArtifactFilter {
  kind?: ArtifactKind;
  status?: ArtifactStatus;
  date?: string;
  sourceDraftId?: string;
}

export interface StorageAdapter {
  readArtifact(id: string): Promise<Artifact | null>;
  saveArtifact(artifact: Artifact): Promise<Artifact>;
  listArtifacts(filter?: ArtifactFilter): Promise<Artifact[]>;
  listDrafts(filter?: { status?: string }): Promise<Draft[]>;
  saveDraft(draft: Draft): Promise<Draft>;
  readDraft(id: string): Promise<Draft | null>;
  commitDraft(draftId: string, confirmation: Confirmation): Promise<Artifact>;
  saveWorkflowRun(run: WorkflowRun): Promise<WorkflowRun>;
  readWorkflowRun(id: string): Promise<WorkflowRun | null>;
  saveImportBatch(batch: ImportBatch): Promise<ImportBatch>;
  readImportBatch(id: string): Promise<ImportBatch | null>;
  appendAuditLog(event: AuditLog): Promise<void>;
  readMemoryState(): Promise<MemoryState | null>;
  saveMemoryState(state: MemoryState): Promise<MemoryState>;
}
