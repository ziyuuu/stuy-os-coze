import { NextRequest, NextResponse } from "next/server";
import { testLLMConnection } from "@/lib/llm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, apiKey, endpoint } = body;

    // 传递所有参数，支持 Coze 平台和自定义 API 测试
    const result = await testLLMConnection({ model, apiKey, endpoint });

    return NextResponse.json(result);
  } catch (error) {
    console.error("LLM test failed:", error);
    return NextResponse.json(
      { success: false, error: "测试失败，请检查配置" },
      { status: 500 }
    );
  }
}
