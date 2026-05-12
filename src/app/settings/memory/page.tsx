"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Brain, Target, MapPin, ListChecks } from "lucide-react";

interface MemoryStateData {
  currentGoal: string;
  currentPhase: string;
  currentPlanId: string;
  nextActions: string[];
  facts?: string[];
}

export default function MemorySettingsPage() {
  const [state, setState] = useState<MemoryStateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/memory-state");
        const data = await res.json();
        if (cancelled) return;
        if (data.success && data.data) {
          setState(data.data);
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

  const isEmpty =
    !state ||
    (!state.currentGoal &&
      !state.currentPhase &&
      !state.currentPlanId &&
      (!state.nextActions || state.nextActions.length === 0) &&
      (!state.facts || state.facts.length === 0));

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">MemoryState</h1>
          <p className="text-muted-foreground text-sm">
            由系统自动管理，反映当前学习状态
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <p className="text-red-500 text-center">{error}</p>
          </CardContent>
        </Card>
      )}

      {isEmpty ? (
        <Card>
          <CardContent className="pt-12 pb-12 flex flex-col items-center gap-3">
            <Brain className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">暂无 MemoryState 数据</p>
            <p className="text-muted-foreground text-xs">
              系统会在计划状态变更、复盘确认、AI 教练对话时自动更新此状态
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                当前目标
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">
                {state?.currentGoal || "—"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                当前阶段
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{state?.currentPhase || "—"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                当前计划
              </CardTitle>
              <CardDescription>当前活跃计划的 ID</CardDescription>
            </CardHeader>
            <CardContent>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {state?.currentPlanId || "—"}
              </code>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" />
                下一步行动
              </CardTitle>
              <CardDescription>系统建议的下一步行动项</CardDescription>
            </CardHeader>
            <CardContent>
              {state?.nextActions && state.nextActions.length > 0 ? (
                <ul className="space-y-2">
                  {state.nextActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Badge variant="secondary" className="mt-0.5 shrink-0">
                        {i + 1}
                      </Badge>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">暂无行动项</p>
              )}
            </CardContent>
          </Card>

          {state?.facts && state.facts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>已知事实</CardTitle>
                <CardDescription>系统从对话和操作中提取的事实</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {state.facts.map((fact, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      • {fact}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card className="border-dashed">
        <CardContent className="pt-6 pb-6">
          <p className="text-xs text-muted-foreground text-center">
            MemoryState 由系统自动管理。计划状态变更、复盘确认、AI
            教练对话产出均会自动更新此状态，无需手动编辑。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
