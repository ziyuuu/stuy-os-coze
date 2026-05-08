import { NextRequest, NextResponse } from "next/server";
import { generateFromLLM } from "@/lib/llm";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planType, instruction, planContent } = body;

    if (!instruction) {
      return NextResponse.json(
        { success: false, error: "指令不能为空" },
        { status: 400 }
      );
    }

    // 构建系统提示
    const systemPrompt = `你是一个专业的 AI PM 学习教练，正在帮助用户调整学习计划。

调整原则：
1. 严格遵循原始计划的结构和格式
2. 只修改用户明确指定的部分
3. 保持计划的逻辑性和连贯性
4. 确保调整后的计划仍然符合 Master Plan 的总体目标

请根据用户的调整指令，修改计划内容，输出完整的调整后版本。`;

    // 构建用户消息
    const userMessage = `当前计划类型: ${planType}

当前计划内容:
${planContent || "暂无内容"}

调整指令:
${instruction}

请输出调整后的完整计划内容。`;

    // 生成调整内容
    const adjusted = await generateFromLLM(
      [{ role: "user", content: userMessage }],
      systemPrompt,
      () => {}
    );

    return NextResponse.json({
      success: true,
      data: {
        adjusted,
        instruction,
      },
    });
  } catch (error) {
    console.error("Plan adjustment error:", error);
    return NextResponse.json(
      { success: false, error: "调整失败" },
      { status: 500 }
    );
  }
}
