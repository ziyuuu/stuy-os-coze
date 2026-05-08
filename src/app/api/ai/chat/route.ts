import { NextRequest, NextResponse } from "next/server";
import { generateFromLLM } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, currentContent, planType } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: "消息不能为空" },
        { status: 400 }
      );
    }

    let result = "";
    const prompt = `## 当前计划类型
${planType || "unknown"}

## 当前内容
${currentContent || "(空)"}

## 用户请求
${message}

请只返回可操作的修改建议或可直接替换/追加的内容，不要声称已经保存。`;

    result = await generateFromLLM(
      [{ role: "user", content: prompt }],
      "你是 Study OS 的计划编辑助手。你只能给出草稿建议，正式写入必须由用户确认。",
      (chunk) => {
        result += chunk;
      }
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[AI Chat Error]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "AI chat failed" },
      { status: 500 }
    );
  }
}
