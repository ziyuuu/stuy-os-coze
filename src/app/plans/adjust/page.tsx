"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Loader2, Save, ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";

interface PlanContent {
  type: "master" | "month" | "week" | "daily";
  content: string;
  title: string;
}

interface AdjustmentDraft {
  original: string;
  adjusted: string;
  instruction: string;
}

function PlanAdjustContent() {
  const searchParams = useSearchParams();
  const planType = searchParams.get("type") || "month";
  const [instruction, setInstruction] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState<AdjustmentDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [planContent, setPlanContent] = useState<PlanContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchPlan() {
      try {
        const endpoints: Record<string, string> = {
          master: "/api/plans/master",
          month: "/api/plans/month",
          week: "/api/plans/week",
          daily: "/api/plans/week",
        };

        const response = await fetch(endpoints[planType] || endpoints.month);
        const data = await response.json();

        if (data.success) {
          setPlanContent({
            type: planType as "master" | "month" | "week" | "daily",
            content: JSON.stringify(data.data, null, 2),
            title: getPlanTitle(planType),
          });
        }
      } catch (error) {
        console.error("Failed to fetch plan:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlan();
  }, [planType]);

  const handleGenerate = async () => {
    if (!instruction.trim()) return;

    setIsGenerating(true);
    setDraft(null);

    try {
      const response = await fetch("/api/flows/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType,
          instruction,
          planContent: planContent?.content,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setDraft({
          original: planContent?.content || "",
          adjusted: data.data.adjusted,
          instruction,
        });

        setTimeout(() => {
          outputRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!draft?.adjusted) return;

    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const response = await fetch("/api/plans/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType,
          content: draft.adjusted,
        }),
      });

      if (response.ok) {
        setSaveStatus("success");
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/plans">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            {planContent?.title || "计划调整"}
          </h1>
          <p className="text-muted-foreground mt-1">
            通过 AI 调整计划内容
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>调整指令</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instruction">描述你想要如何调整计划</Label>
            <Textarea
              id="instruction"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="例如：将第一周的学习目标改为更注重产品基础..."
              rows={4}
              className="resize-none"
            />
          </div>
          <Button onClick={handleGenerate} disabled={!instruction.trim() || isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                生成调整
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {draft && (
        <div ref={outputRef} className="space-y-4">
          <Tabs defaultValue="adjusted" className="space-y-4">
            <TabsList>
              <TabsTrigger value="adjusted">调整后</TabsTrigger>
              <TabsTrigger value="compare">对比</TabsTrigger>
            </TabsList>

            <TabsContent value="adjusted">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>调整后的计划</CardTitle>
                  <Button onClick={handleSave} disabled={isSaving} size="sm">
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        保存
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  {saveStatus === "success" && (
                    <div className="mb-4 p-3 bg-green-500/10 text-green-600 rounded-lg text-sm">
                      保存成功
                    </div>
                  )}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {draft.adjusted}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compare">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">原始版本</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm font-mono max-h-[500px] overflow-y-auto">
                        {draft.original}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base text-green-600">调整后</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-green-500/5 border border-green-500/20 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm font-mono max-h-[500px] overflow-y-auto">
                        {draft.adjusted}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function PlanAdjustPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PlanAdjustContent />
    </Suspense>
  );
}

function getPlanTitle(type: string): string {
  const titles: Record<string, string> = {
    master: "Master Plan 调整",
    month: "月计划调整",
    week: "周计划调整",
    daily: "日计划调整",
  };
  return titles[type] || "计划调整";
}
