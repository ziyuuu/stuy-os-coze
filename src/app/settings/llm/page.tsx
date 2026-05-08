"use client";

import { useState } from "react";
import { Save, RefreshCw, CheckCircle, AlertCircle, Key, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const AVAILABLE_MODELS = [
  {
    id: "doubao-seed-1-8-251228",
    name: "豆包 1.8",
    description: "豆包默认模型，适合日常使用",
    provider: "Coze",
  },
];

export default function LLMSettingsPage() {
  const [systemModel, setSystemModel] = useState("doubao-seed-1-8-251228");
  const [customModel, setCustomModel] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [customEndpoint, setCustomEndpoint] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const response = await fetch("/api/settings/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemModel,
          customModel,
          customApiKey,
          customEndpoint,
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

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/settings/llm/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: customModel || systemModel,
          apiKey: customApiKey,
          endpoint: customEndpoint,
        }),
      });

      const data = await response.json();
      setTestResult({
        success: data.success,
        message: data.success ? "连接成功" : data.error || "测试失败",
      });
    } catch {
      setTestResult({
        success: false,
        message: "网络错误",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">LLM API 管理</h1>
        <p className="text-muted-foreground mt-2">
          配置 AI 模型服务，支持系统默认和自定义模型
        </p>
      </div>

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList>
          <TabsTrigger value="system">默认模型</TabsTrigger>
          <TabsTrigger value="custom">模型设置</TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                默认模型
              </CardTitle>
              <CardDescription>
                选择系统预置的 AI 模型，无需额外配置
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {AVAILABLE_MODELS.map((model) => (
                  <div
                    key={model.id}
                    className={cn(
                      "flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors",
                      systemModel === model.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setSystemModel(model.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {model.provider}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {model.description}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        systemModel === model.id
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      )}
                    >
                      {systemModel === model.id && (
                        <CheckCircle className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 pt-4 border-t">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      正在保存
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      保存设置
                    </>
                  )}
                </Button>
                {saveStatus === "success" && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    保存成功
                  </span>
                )}
                {saveStatus === "error" && (
                  <span className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    保存失败
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                模型模型
              </CardTitle>
              <CardDescription>
                使用自己的 API Key 和模型，支持 OpenAI 兼容接口
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customModel">模型标识</Label>
                <Input
                  id="customModel"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="例如: deepseek-chat, gpt-4"
                />
                <p className="text-xs text-muted-foreground">
                  输入模型的 API ID，如 deepseek-chat、gpt-4 等
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customEndpoint">接口地址</Label>
                <Input
                  id="customEndpoint"
                  value={customEndpoint}
                  onChange={(e) => setCustomEndpoint(e.target.value)}
                  placeholder="例如: https://api.deepseek.com"
                />
                <p className="text-xs text-muted-foreground">
                  模型服务的 API 地址
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customApiKey">密钥</Label>
                <Input
                  id="customApiKey"
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="输入您的 API Key"
                />
                <p className="text-xs text-muted-foreground">
                  您的个人 API Key，将安全存储
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t">
                <Button variant="outline" onClick={handleTest} disabled={isTesting}>
                  {isTesting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      正在测试
                    </>
                  ) : (
                    "测试连接"
                  )}
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      正在保存
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      保存设置
                    </>
                  )}
                </Button>
              </div>

              {testResult && (
                <div
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg",
                    testResult.success
                      ? "bg-green-500/10 text-green-600"
                      : "bg-red-500/10 text-red-600"
                  )}
                >
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
