/**
 * Zod schemas — 核心类型 & API 请求体验证
 */
import { z } from "zod";

// ─── 基础枚举 ──────────────────────────────────────

export const PlanStatusSchema = z.enum(["draft", "active", "completed", "expired"]);

export const PlanTypeSchema = z.enum([
  "master",
  "monthly",
  "weekly",
  "daily",
  "month",
  "week",
]);

export const ArtifactKindSchema = z.enum([
  "plan",
  "review",
  "output",
  "lesson_prep",
  "evaluation",
  "source_material",
  "learning_record",
  "idea_pool",
  "coach_chat",
  "unknown",
]);

export const EvidenceTypeSchema = z.enum([
  "user_fact",
  "file_evidence",
  "ai_inference",
  "plan_intent",
  "draft",
  "system_event",
  "imported",
  "coach_conversation",
]);

export const WorkflowStatusSchema = z.enum([
  "requested",
  "preflight",
  "context_loaded",
  "draft_generated",
  "user_editing",
  "confirmation_pending",
  "committed",
  "state_updated",
  "archived",
  "blocked_missing_context",
  "blocked_need_user_input",
  "rejected",
  "superseded",
  "failed",
]);

// ─── Harness 实体 ──────────────────────────────────

export const MetadataSchema = z.record(z.string(), z.unknown());

export const EvidenceItemSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  evidenceType: EvidenceTypeSchema,
  sourceId: z.string().optional(),
  title: z.string(),
  content: z.string(),
  metadata: MetadataSchema.optional(),
});

export const ArtifactSchema = z.object({
  id: z.string(),
  sourceDraftId: z.string().optional(),
  workflowRunId: z.string().optional(),
  kind: ArtifactKindSchema,
  title: z.string().min(1),
  content: z.string(),
  status: z.enum(["draft", "committed", "archived", "superseded"]),
  evidenceType: EvidenceTypeSchema,
  evidenceItems: z.array(EvidenceItemSchema).default([]),
  metadata: MetadataSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const DraftSchema = z.object({
  id: z.string(),
  workflowRunId: z.string(),
  workflowType: z.string(),
  artifactKind: ArtifactKindSchema,
  title: z.string().min(1),
  content: z.string(),
  status: z.enum(["draft", "confirmation_pending", "committed", "rejected"]),
  evidenceType: EvidenceTypeSchema,
  evidenceItems: z.array(EvidenceItemSchema).default([]),
  metadata: MetadataSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ConfirmationSchema = z.object({
  id: z.string(),
  targetId: z.string(),
  targetType: z.enum(["draft", "import_batch", "state_update"]),
  confirmedBy: z.string(),
  note: z.string().optional(),
  acceptedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ─── API 请求体 ────────────────────────────────────

export const PlanStatusUpdateSchema = z.object({
  status: PlanStatusSchema,
});

export const PlanSaveSchema = z.object({
  planType: z.string().min(1),
  content: z.string().min(1),
  date: z.string().optional(),
});

export const FlowValidateSchema = z.object({
  flowType: z.string().min(1),
  userInput: z.string().optional(),
});

export const FlowExecuteSchema = z.object({
  flowType: z.string().min(1),
  userInput: z.string().optional(),
});

export const WorkflowExecuteSchema = z.object({
  workflowType: z.string().min(1),
  artifactKind: ArtifactKindSchema,
  title: z.string().min(1),
  content: z.string(),
  evidenceType: EvidenceTypeSchema,
  metadata: MetadataSchema.optional(),
});

export const WorkflowConfirmSchema = z.object({
  draftId: z.string().min(1),
  confirmedBy: z.string().min(1),
  note: z.string().optional(),
});

export const LLMChatRequestSchema = z.object({
  model: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string(),
      })
    )
    .min(1),
  temperature: z.number().optional(),
  stream: z.boolean().optional(),
  max_tokens: z.number().optional(),
});

export const MemoryStateSchema = z.object({
  currentGoal: z.string().optional(),
  currentPhase: z.string().optional(),
  currentPlanId: z.string().optional(),
  nextActions: z.array(z.string()).default([]),
});

// ─── 类型导出 (从 schema 派生) ─────────────────────

export type PlanStatusUpdate = z.infer<typeof PlanStatusUpdateSchema>;
export type PlanSave = z.infer<typeof PlanSaveSchema>;
export type FlowValidate = z.infer<typeof FlowValidateSchema>;
export type FlowExecute = z.infer<typeof FlowExecuteSchema>;
export type WorkflowExecute = z.infer<typeof WorkflowExecuteSchema>;
export type WorkflowConfirm = z.infer<typeof WorkflowConfirmSchema>;
export type LLMChatRequest = z.infer<typeof LLMChatRequestSchema>;
export type MemoryStateUpdate = z.infer<typeof MemoryStateSchema>;
