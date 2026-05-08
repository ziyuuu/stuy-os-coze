"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Edit3, X, Check, Loader2 } from "lucide-react";
import Link from "next/link";

interface FileContent {
  path: string;
  name: string;
  type: string;
  content: string;
}

function SettingsEditContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "flows";
  const fileId = searchParams.get("id");

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    async function fetchContent() {
      setIsLoading(true);
      try {
        const endpoints: Record<string, string> = {
          flows: fileId ? `/api/flows/${fileId}` : "/api/flows",
          templates: fileId ? `/api/templates/${fileId}` : "/api/templates",
          resources: "/api/resources",
          roles: "/api/resources",
          outputs: "/api/resources",
        };

        const response = await fetch(endpoints[type] || "/api/resources");
        const data = await response.json();

        if (data.success) {
          if (fileId && data.data.content) {
            setContent(data.data.content);
            setOriginalContent(data.data.content);
            setTitle(data.data.name || "详情");
          } else if (data.data.flows || data.data.templates) {
            const items = data.data.flows || data.data.templates || [];
            const list = items
              .map(
                (item: { id: string; name: string; description: string }) =>
                  `# ${item.name}\n\n${item.description || "无描述"}`
              )
              .join("\n\n---\n\n");
            setContent(list);
            setOriginalContent(list);
            setTitle(getTypeTitle(type));
          } else {
            setContent(JSON.stringify(data.data, null, 2));
            setOriginalContent(JSON.stringify(data.data, null, 2));
            setTitle(getTypeTitle(type));
          }
        }
      } catch (error) {
        console.error("Failed to fetch content:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, [type, fileId]);

  const handleSave = async () => {
    if (content === originalContent) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const response = await fetch("/api/settings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          id: fileId,
          content,
        }),
      });

      if (response.ok) {
        setOriginalContent(content);
        setIsEditing(false);
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

  const handleCancel = () => {
    setContent(originalContent);
    setIsEditing(false);
  };

  const hasChanges = content !== originalContent;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/settings/${type}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground mt-1">
              {isEditing ? "编辑模式" : "只读模式"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-500">
              有未保存的更改
            </Badge>
          )}

          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                取消
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
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
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              编辑
            </Button>
          )}
        </div>
      </div>

      {saveStatus === "success" && (
        <div className="p-3 bg-green-500/10 text-green-600 rounded-lg flex items-center gap-2">
          <Check className="h-4 w-4" />
          保存成功
        </div>
      )}
      {saveStatus === "error" && (
        <div className="p-3 bg-red-500/10 text-red-600 rounded-lg">
          保存失败，请重试
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">内容</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={30}
              className="font-mono text-sm min-h-[500px]"
            />
          ) : (
            <div className="bg-muted/50 p-4 rounded-lg min-h-[500px]">
              <pre className="whitespace-pre-wrap text-sm">{content}</pre>
            </div>
          )}
        </CardContent>
      </Card>
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

export default function SettingsEditPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SettingsEditContent />
    </Suspense>
  );
}

function getTypeTitle(type: string): string {
  const titles: Record<string, string> = {
    flows: "流程中心",
    templates: "模板库",
    resources: "资源管理",
    roles: "角色方法论",
    outputs: "产出记录",
    llm: "LLM API 管理",
  };
  return titles[type] || "设置";
}
