"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Calendar,
  FileText,
  ClipboardList,
  Upload,
  Archive,
  ArrowRight,
  Loader2,
  Clock,
} from "lucide-react";
import type { Artifact, Draft } from "@/lib/harness/types";

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function QuickAction({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
    >
      <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">{icon}</div>
      <div className="space-y-1 flex-1 min-w-0">
        <h3 className="font-medium leading-none group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 self-center" />
    </Link>
  );
}

const typeLabel: Record<string, string> = {
  plan: "计划",
  review: "复盘",
  lesson_prep: "备课",
  output: "产出",
  source_material: "资料",
  learning_record: "学习记录",
  idea_pool: "想法池",
  evaluation: "评估",
  unknown: "未分类",
};

export function HarnessDashboard() {
  const [currentGoal, setCurrentGoal] = useState("");
  const [currentPhase, setCurrentPhase] = useState("");
  const [currentPlanId, setCurrentPlanId] = useState("");
  const [nextActions, setNextActions] = useState<string[]>([]);
  const [totalArtifacts, setTotalArtifacts] = useState(0);
  const [recentArtifacts, setRecentArtifacts] = useState<Artifact[]>([]);
  const [pendingDrafts, setPendingDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [msRes, artRes, draftRes] = await Promise.all([
          fetch("/api/memory-state"),
          fetch("/api/artifacts?status=committed"),
          fetch("/api/drafts?status=confirmation_pending"),
        ]);
        const msData = await msRes.json();
        const artData = await artRes.json();
        const draftData = await draftRes.json();

        if (cancelled) return;

        if (msData.success && msData.data) {
          const state = msData.data;
          setCurrentGoal(state.currentGoal || "");
          setCurrentPhase(state.currentPhase || "");
          setCurrentPlanId(state.currentPlanId || "");
          setNextActions(state.nextActions || []);
        }

        if (artData.success) {
          const all = artData.data || [];
          setTotalArtifacts(all.length);
          setRecentArtifacts(all.slice(0, 5));
        }

        if (draftData.success) {
          setPendingDrafts(draftData.data || []);
        }
      } catch {
        if (!cancelled) setError("加载失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI PM 转型工作区</h1>
        <p className="text-muted-foreground mt-2">
          基于 harness 的受控学习流程管理系统
        </p>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <p className="text-red-500 text-center">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="当前阶段"
          value={currentPhase || "未设置"}
          description={currentGoal || "尚未设置目标"}
          icon={<Target className="h-4 w-4" />}
        />
        <StatCard
          title="当前计划"
          value={currentPlanId || "无"}
          description="当前活跃的 plan ID"
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          title="已确认产出"
          value={totalArtifacts}
          description={totalArtifacts > 0 ? `共 ${totalArtifacts} 条正式记录` : "尚无正式记录"}
          icon={<Archive className="h-4 w-4" />}
        />
      </div>

      <div className="text-right">
        <Link
          href="/settings/memory"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          编辑 MemoryState →
        </Link>
      </div>

      {/* Next actions */}
      {nextActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">下一步行动</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              {nextActions.map((action, i) => (
                <li key={i} className="text-sm">{action}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Pending drafts */}
      {pendingDrafts.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                待确认 Drafts
              </CardTitle>
              <CardDescription>
                这些草稿已保存但尚未确认提交为正式 Artifact
              </CardDescription>
            </div>
            <Badge variant="secondary">{pendingDrafts.length} 条</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{draft.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {draft.workflowType} · {draft.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {typeLabel[draft.artifactKind] || draft.artifactKind}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {draft.createdAt.slice(0, 10)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent artifacts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">最近产出</CardTitle>
            <CardDescription>通过 harness 确认提交的正式记录</CardDescription>
          </div>
          <Link href="/outputs" className="text-sm text-primary hover:underline">
            查看全部 ({totalArtifacts})
          </Link>
        </CardHeader>
        <CardContent>
          {recentArtifacts.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">
              暂无正式记录。执行计划或复盘流程并确认后，内容会出现在这里。
            </p>
          ) : (
            <div className="space-y-2">
              {recentArtifacts.map((artifact) => (
                <div
                  key={artifact.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{artifact.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {artifact.content.slice(0, 80)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {typeLabel[artifact.kind] || artifact.kind}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {artifact.createdAt.slice(0, 10)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">快速入口</CardTitle>
          <CardDescription>执行学习流程或管理内容</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <QuickAction
            href="/plans-execute"
            title="计划与备课"
            description="生成日/周/月计划和备课内容"
            icon={<Calendar className="h-5 w-5 text-primary" />}
          />
          <QuickAction
            href="/reviews-execute"
            title="复盘执行"
            description="提交复盘事实，生成复盘记录"
            icon={<ClipboardList className="h-5 w-5 text-primary" />}
          />
          <QuickAction
            href="/import"
            title="导入中心"
            description="上传文件并提交为正式资料"
            icon={<Upload className="h-5 w-5 text-primary" />}
          />
          <QuickAction
            href="/outputs"
            title="产出记录"
            description="查看所有已确认的正式产出"
            icon={<Archive className="h-5 w-5 text-primary" />}
          />
        </CardContent>
      </Card>
    </div>
  );
}
