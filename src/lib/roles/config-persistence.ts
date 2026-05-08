/**
 * 角色配置持久化 — 服务端模块（依赖 harness storage，禁止客户端导入）
 */

import { getStorageAdapter } from "@/lib/harness/storage";
import { nowIso } from "@/lib/harness/id";
import { ROLES, type RoleOverrides } from "./config";

const ROLE_OVERRIDE_ARTIFACT_ID = "role-config-overrides";

export async function loadRoleConfigOverrides(): Promise<RoleOverrides> {
  try {
    const artifact = await getStorageAdapter().readArtifact(
      ROLE_OVERRIDE_ARTIFACT_ID
    );
    if (artifact?.content) {
      return JSON.parse(artifact.content) as RoleOverrides;
    }
  } catch {
    /* 首次访问或数据损坏，返回空 */
  }
  return {};
}

async function saveRoleConfigOverrides(overrides: RoleOverrides): Promise<void> {
  const storage = getStorageAdapter();
  const existing = await storage.readArtifact(ROLE_OVERRIDE_ARTIFACT_ID);
  const now = nowIso();
  await storage.saveArtifact({
    id: ROLE_OVERRIDE_ARTIFACT_ID,
    kind: "source_material",
    title: "Role Config Overrides",
    content: JSON.stringify(overrides, null, 2),
    status: "committed",
    evidenceType: "system_event",
    evidenceItems: [],
    metadata: { seedType: "role_config_overrides" },
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  });
}

/** 内存 + harness 持久化 */
export async function updateRoleConfig(
  roleId: string,
  systemPrompt: string,
  flowInstruction: string
): Promise<boolean> {
  const role = ROLES.find((r) => r.id === roleId);
  if (!role) return false;

  role.systemPrompt = systemPrompt;
  role.ragConfig.instruction = flowInstruction;

  const overrides = await loadRoleConfigOverrides();
  overrides[roleId] = { systemPrompt, flowInstruction };
  await saveRoleConfigOverrides(overrides);

  return true;
}

/** 启动时从 harness 加载覆盖配置到内存 */
export async function applyRoleConfigOverrides(): Promise<void> {
  const overrides = await loadRoleConfigOverrides();
  for (const [roleId, cfg] of Object.entries(overrides)) {
    const role = ROLES.find((r) => r.id === roleId);
    if (role) {
      role.systemPrompt = cfg.systemPrompt;
      role.ragConfig.instruction = cfg.flowInstruction;
    }
  }
}
