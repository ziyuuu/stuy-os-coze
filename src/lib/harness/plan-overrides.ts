import { getStorageAdapter } from "./storage";

export async function readLatestPlanContent(planType: string): Promise<string | null> {
  const artifacts = await getStorageAdapter().listArtifacts({
    kind: "plan",
    status: "committed",
  });
  const latest = artifacts.find((artifact) => artifact.metadata?.planType === planType);
  return latest?.content || null;
}
