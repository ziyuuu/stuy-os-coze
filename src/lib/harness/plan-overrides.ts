import { getStorageAdapter } from "./storage";

export async function readLatestPlanContent(planType: string): Promise<string | null> {
  const artifacts = await getStorageAdapter().listArtifacts({
    kind: "plan",
    status: "committed",
  });
  // Prefer the latest artifact with matching planType.
  // Old status-change artifacts (before the fix) have only a short status message
  // as content — skip those in favor of the next match that has real plan content.
  const latest = artifacts.find(
    (artifact) =>
      artifact.metadata?.planType === planType &&
      (artifact.content?.length || 0) > 100
  );
  return latest?.content || null;
}
