import { NextRequest, NextResponse } from "next/server";
import { applyRoleConfigOverrides, updateRoleConfig } from "@/lib/roles/config-persistence";
import { getRoles } from "@/lib/roles/config";

export async function GET() {
  try {
    await applyRoleConfigOverrides();
    return NextResponse.json({ success: true, data: getRoles() });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "获取角色配置失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roleId, systemPrompt, flowInstruction } = body;

    if (!roleId) {
      return NextResponse.json(
        { success: false, error: "缺少角色 ID" },
        { status: 400 }
      );
    }

    await applyRoleConfigOverrides();
    const success = await updateRoleConfig(roleId, systemPrompt, flowInstruction);

    if (success) {
      return NextResponse.json({
        success: true,
        message: "角色配置已更新",
      });
    } else {
      return NextResponse.json(
        { success: false, error: "角色不存在" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("更新角色配置失败:", error);
    return NextResponse.json(
      { success: false, error: "更新失败" },
      { status: 500 }
    );
  }
}
