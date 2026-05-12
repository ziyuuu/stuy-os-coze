/**
 * LLM Proxy — 开发/Demo 用文件桥接方案
 *
 * @demo 此功能通过共享 JSON 文件借用 Claude Code session 的 LLM 能力，
 * 用于本地开发和演示验证。正式上线前需替换为真实 LLM API 调用。
 *
 * @removal 正式上线前，将此文件恢复为直连 Anthropic API 的实现，
 * 或替换为其他 LLM 后端（DeepSeek / OpenAI 等）。
 *
 * 使用方法：
 *   Web UI → POST /api/llm-proxy/chat/completions
 *   → 写入 .study-os-runtime/chat-bridge/prompt-{id}.json
 *   → Claude Code Monitor 轮询读取 → 处理 LLM 请求 → 写入 result-{id}.json
 *   → 本 Proxy 轮询读到结果 → 流式返回前端
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import { parseBody } from "@/lib/validation/helpers";
import { LLMChatRequestSchema } from "@/lib/validation/schemas";
import type { LLMChatRequest } from "@/lib/validation/schemas";

const BRIDGE_DIR = path.join(process.cwd(), ".study-os-runtime", "chat-bridge");

interface BridgePrompt {
  id: string;
  messages: { role: string; content: string }[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  createdAt: string;
}

interface BridgeResult {
  content: string;
  model: string;
  error?: string;
}

function ensureBridgeDir(): void {
  if (!fs.existsSync(BRIDGE_DIR)) {
    fs.mkdirSync(BRIDGE_DIR, { recursive: true });
  }
}

function cleanupBridgeFiles(id: string): void {
  try {
    const promptFile = path.join(BRIDGE_DIR, `prompt-${id}.json`);
    const resultFile = path.join(BRIDGE_DIR, `result-${id}.json`);
    if (fs.existsSync(promptFile)) fs.unlinkSync(promptFile);
    if (fs.existsSync(resultFile)) fs.unlinkSync(resultFile);
  } catch {
    // best-effort cleanup
  }
}

function cleanupStaleFiles(maxAgeMs: number = 3600_000): void {
  try {
    if (!fs.existsSync(BRIDGE_DIR)) return;
    const now = Date.now();
    for (const entry of fs.readdirSync(BRIDGE_DIR)) {
      const filePath = path.join(BRIDGE_DIR, entry);
      try {
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > maxAgeMs) {
          fs.unlinkSync(filePath);
        }
      } catch {
        // skip unreadable files
      }
    }
  } catch {
    // best-effort
  }
}

/** 轮询等待 result 文件，最长 timeoutMs 毫秒 */
async function pollForResult(
  id: string,
  timeoutMs: number
): Promise<BridgeResult | null> {
  const resultFile = path.join(BRIDGE_DIR, `result-${id}.json`);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      if (fs.existsSync(resultFile)) {
        const raw = fs.readFileSync(resultFile, "utf-8");
        const parsed = JSON.parse(raw) as BridgeResult;
        return parsed;
      }
    } catch {
      // 文件可能正在写入，稍后重试
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  return null;
}

/** 轮询等待 result 文件，同时每 200ms yield 一次以检查是否就绪（用于流式） */
async function* pollForResultStream(
  id: string,
  timeoutMs: number
): AsyncGenerator<{ done: boolean; result?: BridgeResult }> {
  const resultFile = path.join(BRIDGE_DIR, `result-${id}.json`);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      if (fs.existsSync(resultFile)) {
        const raw = fs.readFileSync(resultFile, "utf-8");
        const parsed = JSON.parse(raw) as BridgeResult;
        yield { done: true, result: parsed };
        return;
      }
    } catch {
      // 文件可能正在写入
    }
    yield { done: false };
    await new Promise((r) => setTimeout(r, 200));
  }

  yield { done: true, result: undefined };
}

/**
 * POST /api/llm-proxy/chat/completions
 *
 * OpenAI 兼容格式 → 文件桥接 → Claude Code 处理 → 返回结果
 */
export async function POST(request: Request) {
  const parsed = await parseBody(request, LLMChatRequestSchema);
  if (!parsed.success) {
    const err = await parsed.errorResponse.json();
    return Response.json(
      { error: { message: (err as { error?: string }).error || "Invalid request body" } },
      { status: 400 }
    );
  }
  const body: LLMChatRequest = parsed.data;

  ensureBridgeDir();
  cleanupStaleFiles();

  const id = randomUUID();
  const prompt: BridgePrompt = {
    id,
    messages: body.messages.map((m) => ({ role: m.role, content: m.content })),
    model: body.model || "claude-code-bridge",
    temperature: body.temperature ?? 0.7,
    max_tokens: body.max_tokens || 4096,
    stream: body.stream ?? true,
    createdAt: new Date().toISOString(),
  };

  const promptFile = path.join(BRIDGE_DIR, `prompt-${id}.json`);
  fs.writeFileSync(promptFile, JSON.stringify(prompt, null, 2), "utf-8");

  const timeoutMs = 180_000; // 3 分钟超时

  if (!body.stream) {
    // 非流式：直接等待结果
    const result = await pollForResult(id, timeoutMs);

    if (!result) {
      return Response.json(
        {
          error: {
            message:
              "Claude Code session 未响应。请确认会话存活且 Monitor 在运行。",
          },
        },
        { status: 504 }
      );
    }

    if (result.error) {
      cleanupBridgeFiles(id);
      return Response.json(
        { error: { message: result.error } },
        { status: 500 }
      );
    }

    cleanupBridgeFiles(id);
    return Response.json({
      id: `chatcmpl-bridge-${id}`,
      object: "chat.completion",
      created: Date.now(),
      model: result.model || "claude-code-bridge",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: result.content,
          },
          finish_reason: "stop",
        },
      ],
    });
  }

  // 流式：轮询等待结果，获取后模拟字符流式输出
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 轮询等待
        for await (const tick of pollForResultStream(id, timeoutMs)) {
          if (tick.done) {
            const result = tick.result;

            if (!result) {
              const err = {
                error: {
                  message:
                    "Claude Code session 未响应（3 分钟超时）。请确认 Monitor 在运行。",
                },
              };
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(err)}\n\n`)
              );
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              cleanupBridgeFiles(id);
              return;
            }

            if (result.error) {
              const err = { error: { message: result.error } };
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(err)}\n\n`)
              );
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              cleanupBridgeFiles(id);
              return;
            }

            // 模拟流式：逐字符输出（每 15ms 一个字符，模拟打字效果）
            const content = result.content;
            const chunkSize = 3; // 每次输出 3 个字符
            for (let i = 0; i < content.length; i += chunkSize) {
              const chunk = content.slice(i, i + chunkSize);
              const openaiChunk = {
                id: `chatcmpl-bridge-${id}`,
                object: "chat.completion.chunk",
                created: Date.now(),
                model: result.model || "claude-code-bridge",
                choices: [
                  {
                    index: 0,
                    delta: { content: chunk },
                    finish_reason: null,
                  },
                ],
              };
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`)
              );
              await new Promise((r) => setTimeout(r, 15));
            }

            // 最终帧
            const finalChunk = {
              id: `chatcmpl-bridge-${id}`,
              object: "chat.completion.chunk",
              created: Date.now(),
              model: result.model || "claude-code-bridge",
              choices: [
                {
                  index: 0,
                  delta: {},
                  finish_reason: "stop",
                },
              ],
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(finalChunk)}\n\n`)
            );
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            cleanupBridgeFiles(id);
            return;
          }
        }
      } catch (error) {
        const err = {
          error: { message: `Stream error: ${(error as Error).message}` },
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(err)}\n\n`));
        controller.close();
        cleanupBridgeFiles(id);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/** 状态检查 — 验证 bridge 是否可用 */
export async function GET() {
  if (!fs.existsSync(BRIDGE_DIR)) {
    return Response.json({
      status: "not_ready",
      reason: "bridge 目录不存在",
    });
  }

  const pending = fs
    .readdirSync(BRIDGE_DIR)
    .filter((f) => f.startsWith("prompt-"))
    .filter((f) => {
      const id = f.replace("prompt-", "").replace(".json", "");
      return !fs.existsSync(path.join(BRIDGE_DIR, `result-${id}.json`));
    });

  return Response.json({
    status: "ready",
    pendingCount: pending.length,
  });
}
