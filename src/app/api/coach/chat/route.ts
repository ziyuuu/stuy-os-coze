import { NextRequest } from "next/server";
import { getRoleById } from "@/lib/roles/config";
import { generateFromLLM } from "@/lib/llm";
import { getStorageAdapter } from "@/lib/harness/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function buildContext(): Promise<string> {
  const storage = getStorageAdapter();
  const parts: string[] = [];

  try {
    // 读取当前记忆状态
    const memory = await storage.readMemoryState();
    if (memory) {
      parts.push(`## 当前阶段\n目标: ${memory.currentGoal || "未设置"}\n阶段: ${memory.currentPhase || "未设置"}\n计划ID: ${memory.currentPlanId || "未设置"}`);
      if (memory.nextActions?.length) {
        parts.push(`## 下一步行动\n${memory.nextActions.map((a, i) => `${i + 1}. ${a}`).join("\n")}`);
      }
    }
  } catch {}

  try {
    // 读取最近的计划 artifact
    const plans = await storage.listArtifacts({ kind: "plan" });
    if (plans.length > 0) {
      const latest = plans.slice(0, 3);
      parts.push("## 最近计划\n" + latest.map((p) => `### ${p.title}\n${p.content?.slice(0, 2000) || "(空)"}`).join("\n\n"));
    }
  } catch {}

  try {
    // 读取最近的复盘
    const reviews = await storage.listArtifacts({ kind: "review" });
    if (reviews.length > 0) {
      const latest = reviews[0];
      parts.push(`## 最近复盘: ${latest.title}\n${latest.content?.slice(0, 1500) || "(空)"}`);
    }
  } catch {}

  return parts.join("\n\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, messages } = body;

    if (!role || !messages?.length) {
      return new Response(
        JSON.stringify({ success: false, error: "role 和 messages 不能为空" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 获取角色人设
    const roleConfig = getRoleById(role);
    const systemPrompt = roleConfig?.systemPrompt || "你是一个 AI 学习教练。";

    // 构建上下文
    const context = await buildContext();

    // 构建完整系统提示
    const fullSystemPrompt = `${systemPrompt}

## 当前用户的学习上下文
${context || "(暂无上下文数据)"}

## 重要原则
- 你是用户的学习教练，始终围绕用户的学习目标和计划展开对话
- 基于上文中的计划、复盘等实际数据给出具体建议
- 对话风格自然、鼓励，但也要诚实指出问题
- 不需要每次回复都提及所有上下文，只有在相关时才引用`;

    // 流式生成
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = "";
          await generateFromLLM(
            messages,
            fullSystemPrompt,
            (chunk: string) => {
              fullContent += chunk;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk, fullContent })}\n\n`));
            },
            { temperature: 0.8 }
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : "生成失败" })}\n\n`)
          );
          controller.close();
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
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
