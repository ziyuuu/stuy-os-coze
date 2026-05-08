/**
 * 流程执行 API
 */

import { NextRequest, NextResponse } from "next/server";
import {
  validateFlow,
  readFlowFiles,
  getFlowDefinition,
} from "@/lib/flow-engine";
import { generateFromLLM } from "@/lib/llm";
import type { FlowType } from "@/lib/flow-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flowType, userInput } = body as {
      flowType: FlowType;
      userInput?: string;
    };

    if (!flowType) {
      return new NextResponse(
        "data: {\"error\": \"缺少 flowType 参数\"}\n\n",
        {
          status: 400,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        }
      );
    }

    const flowDef = getFlowDefinition(flowType);
    if (!flowDef) {
      return NextResponse.json({ error: `未知的流程类型: ${flowType}` }, { status: 400 });
    }

    const validation = await validateFlow(flowType, userInput);
    if (!validation.canProceed) {
      return new Response("前置条件不满足，请先补齐上下文或用户事实输入。", {
        status: 400,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const files = await readFlowFiles(flowType);
          const prompt = `## 角色
你是一个专业的 AI PM 学习助手，帮助用户执行 ${flowDef.name} 流程。

## 用户输入
${userInput || "请按照流程执行"}

## 流程说明
${flowDef.instructions}

## 需要读取的文件内容
${Object.entries(files).map(([name, content]) => `### ${name}\n${content}`).join("\n\n")}

请严格按照流程定义执行，生成符合模板要求的内容。`;
          await generateFromLLM(
            [{ role: "user", content: prompt }],
            "你是 Study OS 的受控流程执行 agent。你只能生成草稿，不得声称已经写入正式状态。",
            (chunk) => {
              controller.enqueue(encoder.encode(chunk));
            }
          );
        } catch (error) {
          console.error("Flow execution error:", error);
          controller.enqueue(encoder.encode(`生成失败: ${String(error)}`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
