/**
 * 对比计划与复盘 API
 * 分析异同并由大模型评判
 */

import { NextRequest, NextResponse } from "next/server";
import { generateFromLLM } from "@/lib/llm";
import { getStorageAdapter } from "@/lib/harness/storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, date } = body;

    if (!type || !date) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const storage = getStorageAdapter();
    const plans = await storage.listArtifacts({ kind: "plan", status: "committed", date });
    const reviews = await storage.listArtifacts({ kind: "review", status: "committed", date });
    const plan = plans.find((item) => item.metadata?.planType === type) || plans[0];
    const review = reviews.find((item) => item.metadata?.reviewType === type) || reviews[0];
    const planContent = plan?.content || "";
    const reviewContent = review?.content || "";

    if (!planContent && !reviewContent) {
      return NextResponse.json(
        { success: false, error: "未找到计划和复盘文件" },
        { status: 404 }
      );
    }

    const typeMap: Record<string, string> = { daily: "日", weekly: "周", monthly: "月" };
    const typeName = typeMap[type] || type;
    const analysisPrompt = `## 任务
对比分析 ${typeName}计划 与 ${typeName}复盘 的执行情况，并给出客观评价。

## 计划内容
${planContent || "(未找到计划)"}

## 复盘内容
${reviewContent || "(未找到复盘)"}

## 分析要求
请从以下维度进行对比分析：

### 1. 计划完成情况
- 计划的任务完成率
- 完成与未完成的任务列表

### 2. 执行差异分析
- 计划与实际执行的差异
- 新增的任务（计划外）
- 未执行的任务（计划内）

### 3. 原因分析
- 完成好的原因
- 未完成的原因

### 4. 综合评价
- 执行力评分（1-10分）
- 优点总结
- 改进建议

请用结构化的 Markdown 格式输出分析结果。`;

    // 使用流式输出
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          await generateFromLLM(
            [{ role: "user", content: analysisPrompt }],
            "你是一位专业的学习教练，擅长分析计划执行情况并给出改进建议。",
            (chunk) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
            }
          );

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        } catch (error) {
          console.error("Analysis error:", error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "分析失败" })}\n\n`));
        } finally {
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
    console.error("Compare API error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
