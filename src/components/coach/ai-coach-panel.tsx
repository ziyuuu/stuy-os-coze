"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getRoleOptions, type RoleConfig } from "@/lib/roles/config";
import { Send, Archive, ChevronDown, Loader2, Bot, User, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const roleOptions = getRoleOptions();

export function AICoachPanel() {
  const [selectedRole, setSelectedRole] = useState(roleOptions[1]?.id || "practice_coach");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 获取当前选中角色信息
  const currentRole = roleOptions.find((r) => r.id === selectedRole);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // 发送消息
  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setStreaming(true);
    setSaved(false);
    setStreamingContent("");

    try {
      const response = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error("请求失败");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");

      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.chunk) {
                assistantContent += parsed.chunk;
                setStreamingContent(assistantContent);
              }
            } catch {}
          }
        }
      }

      setMessages((prev) => [...prev, { role: "assistant", content: assistantContent }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: `[错误] ${error instanceof Error ? error.message : "请求失败，请重试"}` }]);
    } finally {
      setStreaming(false);
      setStreamingContent("");
    }
  };

  // 存档对话
  const handleSave = async () => {
    if (messages.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/coach/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          summary: "",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
      }
    } catch {} finally {
      setSaving(false);
    }
  };

  // 键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <aside className="sticky top-0 h-screen flex flex-col border-l bg-background/95 backdrop-blur w-80 shrink-0">
      {/* 角色选择器 */}
      <div className="border-b px-3 py-3 shrink-0">
        <div className="relative">
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setMessages([]);
              setSaved(false);
            }}
            className="w-full appearance-none bg-muted rounded-md px-3 py-2 pr-8 text-sm font-medium cursor-pointer border-0 outline-none focus:ring-2 focus:ring-primary"
          >
            {roleOptions.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name} — {role.description}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        {currentRole && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
            {currentRole.description}
          </p>
        )}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {messages.length === 0 && !streaming && (
          <div className="text-center text-muted-foreground py-12">
            <Bot className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">选择角色后开始对话</p>
            <p className="text-xs mt-1 opacity-70">
              AI 教练会读取你的当前计划和复盘上下文
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-2.5",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div
              className={cn(
                "rounded-lg px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap break-words",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-4 w-4 text-secondary-foreground" />
              </div>
            )}
          </div>
        ))}

        {/* 流式输出 */}
        {streaming && streamingContent && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="rounded-lg px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap break-words bg-muted">
              {streamingContent}
            </div>
          </div>
        )}

        {streaming && !streamingContent && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="rounded-lg px-3 py-2 bg-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 底部操作区 */}
      <div className="border-t p-3 space-y-2 shrink-0">
        {/* 存档 */}
        {messages.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saving || saved}
              className="text-xs"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : saved ? (
                <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-500" />
              ) : (
                <Archive className="h-3.5 w-3.5 mr-1" />
              )}
              {saved ? "已存档" : saving ? "存档中..." : "存档对话"}
            </Button>
            {saved && (
              <span className="text-xs text-green-600">对话已归档为学习产出</span>
            )}
          </div>
        )}

        {/* 输入框 */}
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Enter 发送)"
            rows={2}
            className="min-h-0 resize-none text-sm"
            disabled={streaming}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className="shrink-0"
          >
            {streaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
