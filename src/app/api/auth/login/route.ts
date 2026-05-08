import { NextRequest, NextResponse } from "next/server";
import { authCookieHeader } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "请输入密码" },
        { status: 400 }
      );
    }

    const expected = process.env.ACCESS_PASSWORD;
    if (!expected) {
      return NextResponse.json(
        { success: false, error: "服务端未配置 ACCESS_PASSWORD" },
        { status: 500 }
      );
    }

    if (password !== expected) {
      return NextResponse.json(
        { success: false, error: "密码错误" },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ success: true });
    res.headers.set("Set-Cookie", await authCookieHeader());
    return res;
  } catch {
    return NextResponse.json(
      { success: false, error: "登录失败" },
      { status: 500 }
    );
  }
}
