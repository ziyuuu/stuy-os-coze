/**
 * 流程验证 API
 */

import { NextRequest, NextResponse } from "next/server";
import { validateFlow, getAvailableFlows, FlowType } from "@/lib/flow-engine";

function normalizeValidation(validation: Awaited<ReturnType<typeof validateFlow>>) {
  return {
    ...validation,
    triggerAllowed: validation.canProceed,
    errors: validation.missingFiles.map((file) => `缺少文件: ${file}`),
    context: {
      readFiles: validation.readFiles,
      missingFiles: validation.missingFiles,
      preconditions: validation.preconditions,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const flowType = searchParams.get("type") as FlowType | null;

    // 如果指定了具体流程类型，只验证该流程
    if (flowType) {
      const validation = await validateFlow(flowType);
      return NextResponse.json({
        success: true,
        flow: normalizeValidation(validation),
      });
    }

    // 获取所有流程
    const flows = getAvailableFlows();

    // 如果指定了类别，筛选
    const filteredFlows = category === "plan"
      ? flows.filter((f) => f.type === "plan_generation")
      : category === "review"
        ? flows.filter((f) => f.type === "review")
        : category === "prep"
          ? flows.filter((f) => f.type === "prep")
          : flows;

    // 验证每个流程
    const validations = await Promise.all(
      filteredFlows.map(async (flow) => normalizeValidation(await validateFlow(flow.id)))
    );

    return NextResponse.json({
      success: true,
      flows: validations,
      category: category || "all",
    });
  } catch (error) {
    console.error("[Flow Validate Error]", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

import { parseBody } from '@/lib/validation/helpers';
import { FlowValidateSchema } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  const parsed = await parseBody(request, FlowValidateSchema);
  if (!parsed.success) return parsed.errorResponse;
  const { flowType, userInput } = parsed.data;

  try {
    const validation = normalizeValidation(await validateFlow(flowType as FlowType, userInput));
    return NextResponse.json(validation);
  } catch (error) {
    console.error("[Flow Validate Error]", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
