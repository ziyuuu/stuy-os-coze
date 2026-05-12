/**
 * Chat Bridge — 文件桥接方案（仅用于开发/Demo 测试）
 *
 * @demo 此功能通过共享 JSON 文件借用 Claude Code session 的 LLM 能力，
 * 用于本地开发和演示验证。正式上线前需要移除。
 *
 * @removal 删除清单：
 *   - 本文件 (src/app/api/chat-bridge/route.ts)
 *   - chat-bridge 数据目录 (.study-os-runtime/chat-bridge/)
 *
 * 使用方法（仅开发）：
 *   Web UI → POST /api/chat-bridge → 写入 prompt-{id}.json
 *   → Claude Code Session Monitor 轮询读取 → 调用 LLM → 写入 result-{id}.json
 *   → POST /api/chat-bridge 轮询读到结果后返回
 *
 * POST /api/chat-bridge
 *   body: { messages: [{ role, content }], model?, temperature?, max_tokens? }
 *   response: { content: string, model: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BRIDGE_DIR = path.join(process.cwd(), ".study-os-runtime", "chat-bridge");

interface ChatBridgeRequest {
  messages: { role: string; content: string }[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

async function pollForResult(id: string, timeoutMs: number): Promise<{ content: string; model: string } | null> {
  const resultFile = path.join(BRIDGE_DIR, `result-${id}.json`);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      if (fs.existsSync(resultFile)) {
        const raw = fs.readFileSync(resultFile, "utf-8");
        const parsed = JSON.parse(raw);
        return { content: parsed.content, model: parsed.model || "claude-code-bridge" };
      }
    } catch {
      // 文件可能正在写入，稍后重试
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatBridgeRequest;

    if (!body.messages || body.messages.length === 0) {
      return NextResponse.json(
        { error: { message: "messages 为必填" } },
        { status: 400 }
      );
    }

    // 不支持流式
    if (body.stream) {
      return NextResponse.json(
        { error: { message: "Chat Bridge 不支持流式输出" } },
        { status: 400 }
      );
    }

    // 确保目录存在
    if (!fs.existsSync(BRIDGE_DIR)) {
      fs.mkdirSync(BRIDGE_DIR, { recursive: true });
    }

    const id = randomUUID().slice(0, 8);
    const promptFile = path.join(BRIDGE_DIR, `prompt-${id}.json`);

    // 写入 prompt
    fs.writeFileSync(
      promptFile,
      JSON.stringify(
        {
          id,
          messages: body.messages,
          model: body.model,
          temperature: body.temperature,
          max_tokens: body.max_tokens,
          createdAt: new Date().toISOString(),
        },
        null,
        2
      ),
      "utf-8"
    );

    // 轮询结果（最长等 120 秒）
    const result = await pollForResult(id, 120_000);

    if (!result) {
      return NextResponse.json(
        { error: { message: "Claude Code session 未响应，请确认会话存活且 Monitor 在运行" } },
        { status: 504 }
      );
    }

    return NextResponse.json({
      id: `chatcmpl-bridge-${id}`,
      object: "chat.completion",
      created: Date.now(),
      model: result.model,
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
  } catch (error) {
    return NextResponse.json(
      { error: { message: `Chat Bridge error: ${(error as Error).message}` } },
      { status: 500 }
    );
  }
}

/** 状态检查 endpoint — 验证 bridge 是否可用 */
export async function GET() {
  if (!fs.existsSync(BRIDGE_DIR)) {
    return NextResponse.json({ status: "not_ready", reason: "bridge 目录不存在" });
  }

  const pending = fs
    .readdirSync(BRIDGE_DIR)
    .filter((f) => f.startsWith("prompt-"))
    .filter((f) => {
      const id = f.replace("prompt-", "").replace(".json", "");
      return !fs.existsSync(path.join(BRIDGE_DIR, `result-${id}.json`));
    });

  return NextResponse.json({
    status: "ready",
    pendingCount: pending.length,
  });
}
