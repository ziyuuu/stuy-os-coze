"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, AlertCircle, ArrowLeft, FileText, Loader2 } from "lucide-react";

interface FlowInfo {
  flowType: string;
  flowName: string;
}

interface ValidationResult {
  triggerAllowed: boolean;
  flowName: string;
  errors: string[];
  warnings: string[];
  context: Record<string, unknown>;
}

interface SavedDraftInfo {
  id: string;
}

interface ConfirmedArtifactInfo {
  id: string;
  kind: string;
  title: string;
}

export interface FlowTab {
  id: string;
  label: string;
  flowTypes: string[];
}

interface FlowExecutionWorkbenchProps {
  fetchCategories: string[];
  title: string;
  requireUserInput: boolean;
  tabs?: FlowTab[];
}

function deriveArtifactKind(flowType: string): string {
  if (flowType.includes("review")) return "review";
  if (flowType.includes("prep")) return "lesson_prep";
  return "plan";
}

function makeTitle(flowName: string): string {
  const date = new Date().toISOString().split("T")[0];
  return `${flowName} ${date}`;
}

export function FlowExecutionWorkbench({
  fetchCategories,
  title,
  requireUserInput,
  tabs,
}: FlowExecutionWorkbenchProps) {
  const [flows, setFlows] = useState<FlowInfo[]>([]);
  const [flowsLoading, setFlowsLoading] = useState(true);
  const [flowsError, setFlowsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(tabs?.[0]?.id ?? "");
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
  const [selectedFlowName, setSelectedFlowName] = useState<string>("");
  const [userInput, setUserInput] = useState("");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [savedDraft, setSavedDraft] = useState<SavedDraftInfo | null>(null);
  const [confirmedArtifact, setConfirmedArtifact] = useState<ConfirmedArtifactInfo | null>(null);
  const [stateUpdateSuggestion, setStateUpdateSuggestion] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setFlowsLoading(true);
      setFlowsError(null);
      try {
        const results = await Promise.all(
          fetchCategories.map(async (cat) => {
            const res = await fetch(`/api/flows/validate?category=${cat}`);
            const data = await res.json();
            return data.success ? (data.flows || []) : [];
          })
        );
        if (cancelled) return;
        const allFlows: FlowInfo[] = (results.flat() as Array<Record<string, unknown>>).map((f) => ({
          flowType: (f.flowType || f.type || "") as string,
          flowName: (f.flowName || f.name || "") as string,
        }));
        setFlows(allFlows);
      } catch {
        if (!cancelled) setFlowsError("加载流程列表失败");
      } finally {
        if (!cancelled) setFlowsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [fetchCategories]);

  const visibleFlows = tabs
    ? flows.filter((f) => {
        const tab = tabs.find((t) => t.id === activeTab);
        return tab ? tab.flowTypes.includes(f.flowType) : true;
      })
    : flows;

  const selectFlow = (flowType: string, flowName: string) => {
    setSelectedFlow(flowType);
    setSelectedFlowName(flowName);
    setValidation(null);
    setDraftContent("");
    setSavedDraft(null);
    setConfirmedArtifact(null);
    setStateUpdateSuggestion("");
    setError(null);
  };

  const handleValidate = async () => {
    if (!selectedFlow) return;
    setIsValidating(true);
    setError(null);
    setValidation(null);
    try {
      const res = await fetch("/api/flows/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flowType: selectedFlow, userInput: userInput || undefined }),
      });
      const data = await res.json();
      setValidation(data);
    } catch {
      setError("校验失败");
    } finally {
      setIsValidating(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedFlow) return;
    setIsGenerating(true);
    setError(null);
    setDraftContent("");
    setSavedDraft(null);
    setConfirmedArtifact(null);
    setStateUpdateSuggestion("");
    try {
      const response = await fetch("/api/flows/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flowType: selectedFlow, userInput: userInput || undefined }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "生成失败");
      }
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          setDraftContent((prev) => prev + decoder.decode(value));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成草稿失败");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedFlow || !draftContent) return;
    setIsSavingDraft(true);
    setError(null);
    try {
      const res = await fetch("/api/workflows/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowType: selectedFlow,
          artifactKind: deriveArtifactKind(selectedFlow),
          title: makeTitle(selectedFlowName),
          content: draftContent,
          evidenceType: "draft",
          metadata: {
            flowType: selectedFlow,
            userInput: userInput || "",
            source: "flow_execution_workbench",
          },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "保存失败");
      setSavedDraft({ id: data.data.draft.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存 Draft 失败");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleConfirm = async () => {
    if (!savedDraft) return;
    setIsConfirming(true);
    setError(null);
    try {
      const res = await fetch("/api/workflows/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: savedDraft.id,
          confirmedBy: "local-user",
          note: "User confirmed generated flow content in execution UI.",
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "确认失败");
      setConfirmedArtifact({
        id: data.data.artifact.id,
        kind: data.data.artifact.kind,
        title: data.data.artifact.title,
      });
      setSavedDraft(null);
      setStateUpdateSuggestion(data.data.stateUpdateSuggestion || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "确认提交失败");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClear = () => {
    setSelectedFlow(null);
    setSelectedFlowName("");
    setUserInput("");
    setValidation(null);
    setDraftContent("");
    setSavedDraft(null);
    setConfirmedArtifact(null);
    setStateUpdateSuggestion("");
    setError(null);
  };

  const getStatusText = () => {
    if (confirmedArtifact) return `已提交 Artifact (${confirmedArtifact.id})`;
    if (savedDraft) return `已保存 Draft (${savedDraft.id})，等待确认`;
    if (draftContent) return "草稿已生成，未保存";
    if (validation?.triggerAllowed) return "已校验通过，可生成草稿";
    if (selectedFlow) return `已选择: ${selectedFlowName}`;
    return "未开始";
  };

  const canValidate = Boolean(selectedFlow && (!requireUserInput || userInput.trim().length > 0));
  const canGenerate = validation?.triggerAllowed === true;
  const canSaveDraft = draftContent.length > 0 && !isGenerating;
  const canConfirm = savedDraft !== null && confirmedArtifact === null;
  const canRegenerate = selectedFlow !== null && !isGenerating;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">状态：{getStatusText()}</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Flow Selection */}
        <Card>
          <CardHeader>
            <CardTitle>选择流程</CardTitle>
            <CardDescription>选择一个流程类型开始执行</CardDescription>
          </CardHeader>
          <CardContent>
            {flowsLoading ? (
              <p className="text-muted-foreground text-center py-4">加载流程列表...</p>
            ) : flowsError ? (
              <p className="text-red-500 text-center py-4">{flowsError}</p>
            ) : visibleFlows.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">暂无可用流程</p>
            ) : tabs ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
                  {tabs.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
                  ))}
                </TabsList>
                {tabs.map((tab) => (
                  <TabsContent key={tab.id} value={tab.id} className="mt-4">
                    <FlowGrid
                      flows={flows.filter((f) => tab.flowTypes.includes(f.flowType))}
                      selectedFlow={selectedFlow}
                      onSelect={selectFlow}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <FlowGrid flows={visibleFlows} selectedFlow={selectedFlow} onSelect={selectFlow} />
            )}
          </CardContent>
        </Card>

        {/* User Input */}
        {selectedFlow && (
          <Card>
            <CardHeader>
              <CardTitle>
                {requireUserInput ? "用户事实输入（必填）" : "补充要求（可选）"}
              </CardTitle>
              <CardDescription>
                {requireUserInput
                  ? "复盘需要用户提供完成情况等事实，输入不能为空"
                  : "可补充特定要求或上下文，也可留空直接校验生成"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={userInput}
                onChange={(e) => {
                  setUserInput(e.target.value);
                  if (validation) setValidation(null);
                }}
                placeholder={
                  requireUserInput
                    ? "请输入您的完成情况、困难、阻塞、判断等事实..."
                    : "可选：补充要求或上下文..."
                }
                rows={4}
              />
              {requireUserInput && userInput.trim().length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  复盘流程必须提供用户事实输入后才能校验和生成
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {selectedFlow && (
          <Card>
            <CardHeader>
              <CardTitle>操作</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={handleValidate} disabled={!canValidate || isValidating}>
                {isValidating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                校验
              </Button>
              {canGenerate && (
                <Button onClick={handleGenerate} disabled={isGenerating} variant="secondary">
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  {isGenerating ? "生成中..." : "生成草稿"}
                </Button>
              )}
              {canRegenerate && draftContent && !canGenerate && (
                <Button onClick={handleGenerate} disabled={isGenerating} variant="outline">
                  重新生成
                </Button>
              )}
              {canSaveDraft && (
                <Button onClick={handleSaveDraft} disabled={isSavingDraft} variant="secondary">
                  {isSavingDraft && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  保存 Draft
                </Button>
              )}
              {canConfirm && (
                <Button onClick={handleConfirm} disabled={isConfirming}>
                  {isConfirming && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  确认提交 Artifact
                </Button>
              )}
              <Button onClick={handleClear} variant="outline">
                清空
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Validation Result */}
        {validation && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {validation.triggerAllowed ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                前置条件检查
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge variant={validation.triggerAllowed ? "default" : "destructive"}>
                {validation.triggerAllowed ? "可以执行" : "条件不满足"}
              </Badge>

              {validation.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-500 flex items-center gap-2">
                    <XCircle className="h-4 w-4" /> 错误
                  </h4>
                  <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                    {validation.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.warnings.length > 0 && (
                <div>
                  <h4 className="font-medium text-yellow-500 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> 警告
                  </h4>
                  <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                    {validation.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Draft Editor */}
        {draftContent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                草稿编辑
              </CardTitle>
              <CardDescription>
                {savedDraft
                  ? `Draft 已保存 (ID: ${savedDraft.id})。可继续编辑后再次保存（将创建新 Draft）。`
                  : "草稿已生成但未保存为 Draft。请检查内容后保存。"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={draftContent}
                onChange={(e) => {
                  setDraftContent(e.target.value);
                  if (savedDraft) setSavedDraft(null);
                }}
                rows={16}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
        )}

        {/* Artifact Confirmed */}
        {confirmedArtifact && (
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Artifact 已提交
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1 text-sm">
                <p><strong>Artifact ID:</strong> <code className="text-xs">{confirmedArtifact.id}</code></p>
                <p><strong>类型:</strong> {confirmedArtifact.kind}</p>
                <p><strong>标题:</strong> {confirmedArtifact.title}</p>
              </div>

              {stateUpdateSuggestion && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">状态更新建议（未写入 MemoryState）</h4>
                  <pre className="text-sm whitespace-pre-wrap">{stateUpdateSuggestion}</pre>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                内容已作为正式 Artifact 提交。可在 <Link href="/outputs" className="underline">产出记录</Link> 中查看。
              </p>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="border-red-500">
            <CardContent className="pt-6">
              <p className="text-red-500 text-center">{error}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function FlowGrid({
  flows,
  selectedFlow,
  onSelect,
}: {
  flows: FlowInfo[];
  selectedFlow: string | null;
  onSelect: (flowType: string, flowName: string) => void;
}) {
  if (flows.length === 0) {
    return <p className="text-muted-foreground text-center py-4">暂无此类流程</p>;
  }
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {flows.map((flow) => (
        <Button
          key={flow.flowType}
          variant={selectedFlow === flow.flowType ? "default" : "outline"}
          className="h-auto py-4 justify-start text-left"
          onClick={() => onSelect(flow.flowType, flow.flowName)}
        >
          <div className="text-left">
            <div className="font-medium">{flow.flowName}</div>
            <div className="text-xs text-muted-foreground mt-1">{flow.flowType}</div>
          </div>
        </Button>
      ))}
    </div>
  );
}
