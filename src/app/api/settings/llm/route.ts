import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

function resolveSettingsFile(): string {
  const candidates = [
    process.env.STUDY_OS_STORAGE_DIR,
    path.join(process.cwd(), ".study-os-runtime"),
    path.join(os.tmpdir(), "study-os-runtime"),
  ].filter((value): value is string => Boolean(value));

  for (const dir of candidates) {
    try {
      fs.mkdirSync(path.join(dir, "settings"), { recursive: true });
      const probe = path.join(dir, "settings", ".write-test");
      fs.writeFileSync(probe, "ok", "utf-8");
      fs.unlinkSync(probe);
      return path.join(dir, "settings", "llm-settings.json");
    } catch {
      continue;
    }
  }

  return path.join(os.tmpdir(), "study-os-runtime", "settings", "llm-settings.json");
}

export async function GET() {
  try {
    // 确保目录存在
    const settingsFile = resolveSettingsFile();
    const dir = path.dirname(settingsFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(settingsFile)) {
      const settings = JSON.parse(fs.readFileSync(settingsFile, "utf-8"));
      return NextResponse.json({ success: true, data: settings });
    }

    // 返回默认设置
    return NextResponse.json({
      success: true,
      data: {
        systemModel: "deepseek-v3-2-251201",
        customModel: "",
        customApiKey: "",
        customEndpoint: "",
      },
    });
  } catch (error) {
    console.error("Failed to read LLM settings:", error);
    return NextResponse.json(
      { success: false, error: "读取设置失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { systemModel, customModel, customApiKey, customEndpoint } = body;

    // 验证输入
    if (!systemModel) {
      return NextResponse.json(
        { success: false, error: "请选择模型" },
        { status: 400 }
      );
    }

    // 确保目录存在
    const settingsFile = resolveSettingsFile();
    const dir = path.dirname(settingsFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 保存设置
    const settings = {
      systemModel,
      customModel: customModel || "",
      customApiKey: customApiKey || "",
      customEndpoint: customEndpoint || "",
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Failed to save LLM settings:", error);
    return NextResponse.json(
      { success: false, error: "保存设置失败" },
      { status: 500 }
    );
  }
}
