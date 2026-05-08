"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, FileUp, Loader2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ImportBatch } from "@/lib/harness/types";

const typeLabels: Record<string, string> = {
  source_material: "资料",
  learning_record: "学习记录",
  output_artifact: "产出",
  review_record: "复盘",
  idea_pool: "想法池",
  unknown: "未分类",
};

export default function ImportPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canConfirm = batch && batch.status !== "committed" && batch.status !== "indexed";
  const summaryEntries = useMemo(() => Object.entries(batch?.summary.byType || {}), [batch]);

  const handleUpload = async () => {
    if (files.length === 0) return;
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      const response = await fetch("/api/import/batches", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "导入失败");
      setBatch(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "导入失败");
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!batch) return;
    setError(null);
    setIsConfirming(true);

    try {
      const response = await fetch(`/api/import/batches/${batch.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: "Batch import confirmed in Import Center." }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "确认失败");
      setBatch(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "确认失败");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">导入中心</h1>
        <p className="text-muted-foreground mt-2">
          导入 AI-PM 历史学习资产，先生成分类报告，确认后再进入正式记忆
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            上传文件
          </CardTitle>
          <CardDescription>支持多个 .md、.txt、.json 文件；ZIP 导入后续再接入</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="files">选择文件</Label>
            <Input
              id="files"
              type="file"
              multiple
              accept=".md,.txt,.json,text/markdown,text/plain,application/json"
              onChange={(event) => setFiles(Array.from(event.target.files || []))}
            />
          </div>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file) => (
                <Badge key={`${file.name}-${file.size}`} variant="secondary">
                  {file.name}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={handleUpload} disabled={files.length === 0 || isUploading}>
              {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              生成导入报告
            </Button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </CardContent>
      </Card>

      {batch && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              导入报告
            </CardTitle>
            <CardDescription>
              批次 {batch.id}，状态：{batch.status}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {summaryEntries.map(([type, count]) => (
                <Badge key={type} variant="outline">
                  {typeLabels[type] || type}: {count}
                </Badge>
              ))}
            </div>

            {batch.errors.length > 0 && (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                {batch.errors.join("；")}
              </div>
            )}

            <div className="space-y-3">
              {batch.items.map((item) => (
                <div key={item.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">{item.fileName}</div>
                      <div className="text-sm text-muted-foreground mt-1">{item.reason}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge>{typeLabels[item.classifiedAs] || item.classifiedAs}</Badge>
                      <Badge variant="outline">{Math.round(item.confidence * 100)}%</Badge>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                    {item.originalContent}
                  </p>
                </div>
              ))}
            </div>

            <Button onClick={handleConfirm} disabled={!canConfirm || isConfirming}>
              {isConfirming && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {batch.status === "committed" || batch.status === "indexed"
                ? "已提交"
                : "确认并提交到正式记忆"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
