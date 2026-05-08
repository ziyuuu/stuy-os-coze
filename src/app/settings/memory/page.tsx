"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, CheckCircle, Loader2 } from "lucide-react";

interface MemoryStateData {
  currentGoal: string;
  currentPhase: string;
  currentPlanId: string;
  nextActions: string[];
}

export default function MemorySettingsPage() {
  const [currentGoal, setCurrentGoal] = useState("");
  const [currentPhase, setCurrentPhase] = useState("");
  const [currentPlanId, setCurrentPlanId] = useState("");
  const [nextActions, setNextActions] = useState<string[]>([""]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/memory-state");
        const data = await res.json();
        if (cancelled) return;
        if (data.success && data.data) {
          const state = data.data;
          setCurrentGoal(state.currentGoal || "");
          setCurrentPhase(state.currentPhase || "");
          setCurrentPlanId(state.currentPlanId || "");
          setNextActions(
            state.nextActions && state.nextActions.length > 0
              ? state.nextActions
              : [""]
          );
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

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const filteredActions = nextActions.filter((a) => a.trim().length > 0);
      const res = await fetch("/api/memory-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentGoal: currentGoal.trim() || undefined,
          currentPhase: currentPhase.trim() || undefined,
          currentPlanId: currentPlanId.trim() || undefined,
          nextActions: filteredActions.length > 0 ? filteredActions : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "保存失败");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const addAction = () => setNextActions([...nextActions, ""]);
  const removeAction = (i: number) => {
    if (nextActions.length <= 1) return;
    setNextActions(nextActions.filter((_, idx) => idx !== i));
  };
  const updateAction = (i: number, value: string) => {
    const updated = [...nextActions];
    updated[i] = value;
    setNextActions(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">MemoryState 设置</h1>
          <p className="text-muted-foreground text-sm">
            管理当前学习阶段、目标和下一步行动
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

      <Card>
        <CardHeader>
          <CardTitle>基础信息</CardTitle>
          <CardDescription>
            这些信息会显示在工作区首页的摘要卡片中
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPhase">当前阶段</Label>
            <Input
              id="currentPhase"
              value={currentPhase}
              onChange={(e) => setCurrentPhase(e.target.value)}
              placeholder='例如: "Phase 1: 基础恢复"'
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentGoal">当前目标</Label>
            <Textarea
              id="currentGoal"
              value={currentGoal}
              onChange={(e) => setCurrentGoal(e.target.value)}
              placeholder="描述当前阶段的总体目标..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentPlanId">当前计划 ID</Label>
            <Input
              id="currentPlanId"
              value={currentPlanId}
              onChange={(e) => setCurrentPlanId(e.target.value)}
              placeholder='例如: "month_plan_2026_05"'
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>下一步行动</CardTitle>
          <CardDescription>
            列出当前阶段需要完成的行动项
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {nextActions.map((action, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={action}
                onChange={(e) => updateAction(i, e.target.value)}
                placeholder={`行动 ${i + 1}...`}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeAction(i)}
                disabled={nextActions.length <= 1}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addAction} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            添加行动
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          保存
        </Button>
        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            已保存
          </span>
        )}
      </div>
    </div>
  );
}
