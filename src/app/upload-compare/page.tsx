"use client";

import { useState } from "react";
import { Upload, FileText, Brain, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type PeriodType = "daily" | "weekly" | "monthly";

export default function UploadComparePage() {
  const [periodType, setPeriodType] = useState<PeriodType>("daily");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // 上传计划
  const [planContent, setPlanContent] = useState("");
  const [planStatus, setPlanStatus] = useState<"idle" | "success" | "error">("idle");

  // 上传复盘
  const [reviewContent, setReviewContent] = useState("");
  const [reviewStatus, setReviewStatus] = useState<"idle" | "success" | "error">("idle");

  // 对比分析
  const [analysisResult, setAnalysisResult] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasPlan, setHasPlan] = useState(false);
  const [hasReview, setHasReview] = useState(false);

  const periodName = { daily: "日", weekly: "周", monthly: "月" }[periodType];

  const handleUploadPlan = async () => {
    if (!planContent.trim()) return;

    setPlanStatus("idle");
    try {
      const response = await fetch("/api/upload/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType: periodType,
          date,
          content: planContent,
        }),
      });

      if (response.ok) {
        setPlanStatus("success");
        setHasPlan(true);
      } else {
        setPlanStatus("error");
      }
    } catch {
      setPlanStatus("error");
    }
  };

  const handleUploadReview = async () => {
    if (!reviewContent.trim()) return;

    setReviewStatus("idle");
    try {
      const response = await fetch("/api/upload/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewType: periodType,
          date,
          content: reviewContent,
        }),
      });

      if (response.ok) {
        setReviewStatus("success");
        setHasReview(true);
      } else {
        setReviewStatus("error");
      }
    } catch {
      setReviewStatus("error");
    }
  };

  const handleCompare = async () => {
    setIsAnalyzing(true);
    setAnalysisResult("");

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: periodType, date }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  setAnalysisResult((prev) => prev + data.content);
                }
                if (data.error) {
                  setAnalysisResult(`分析失败: ${data.error}`);
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      }
    } catch (error) {
      setAnalysisResult(`分析失败: ${error}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">计划与复盘</h1>
        <p className="text-muted-foreground mt-2">
          上传计划或复盘内容，对比分析执行情况
        </p>
      </div>

      {/* 类型选择 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="space-y-1">
              <Label>周期类型</Label>
              <Tabs value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)}>
                <TabsList>
                  <TabsTrigger value="daily">日</TabsTrigger>
                  <TabsTrigger value="weekly">周</TabsTrigger>
                  <TabsTrigger value="monthly">月</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="space-y-1">
              <Label htmlFor="date">日期</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 上传计划 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {periodName}计划
            </CardTitle>
            <CardDescription>
              粘贴或输入 {periodName}计划 内容
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={planContent}
              onChange={(e) => setPlanContent(e.target.value)}
              placeholder={`粘贴 ${periodName}计划 内容...`}
              className="min-h-[300px] font-mono text-sm"
            />
            <div className="flex items-center gap-4">
              <Button onClick={handleUploadPlan} disabled={!planContent.trim()}>
                <Upload className="h-4 w-4 mr-2" />
                上传计划
              </Button>
              {planStatus === "success" && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  上传成功
                </span>
              )}
              {planStatus === "error" && (
                <span className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  上传失败
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 上传复盘 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {periodName}复盘
            </CardTitle>
            <CardDescription>
              粘贴或输入 {periodName}复盘 内容
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              placeholder={`粘贴 ${periodName}复盘 内容...`}
              className="min-h-[300px] font-mono text-sm"
            />
            <div className="flex items-center gap-4">
              <Button onClick={handleUploadReview} disabled={!reviewContent.trim()}>
                <Upload className="h-4 w-4 mr-2" />
                上传复盘
              </Button>
              {reviewStatus === "success" && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  上传成功
                </span>
              )}
              {reviewStatus === "error" && (
                <span className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  上传失败
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 对比分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            对比分析
          </CardTitle>
          <CardDescription>
            由 AI 分析计划与复盘的异同，并给出评价
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleCompare}
            disabled={isAnalyzing}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Brain className="h-4 w-4 mr-2 animate-pulse" />
                正在分析...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                开始对比分析
              </>
            )}
          </Button>

          {analysisResult && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                {analysisResult}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
