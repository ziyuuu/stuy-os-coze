import { NextRequest, NextResponse } from "next/server";
import { createId, nowIso } from "@/lib/harness/id";
import { getStorageAdapter } from "@/lib/harness/storage";
import { getRoleById } from "@/lib/roles/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, messages, summary } = body;

    if (!messages?.length) {
      return NextResponse.json({ success: false, error: "对话内容不能为空" }, { status: 400 });
    }

    const roleConfig = getRoleById(role || "");
    const roleName = roleConfig?.name || "AI 教练";
    const now = nowIso();
    const date = now.slice(0, 10);

    // 生成对话文档
    const content = `# ${roleName} 对话记录 - ${date}

${summary ? `## AI 总结\n${summary}\n\n` : ""}
## 完整对话

${messages.map((m: { role: string; content: string }) => {
  const label = m.role === "user" ? "👤 用户" : `🤖 ${roleName}`;
  return `### ${label}\n${m.content}`;
}).join("\n\n")}

---
*存档时间: ${now}*
*角色: ${roleName}*
`;

    const storage = getStorageAdapter();
    const id = createId("artifact");

    const artifact = await storage.saveArtifact({
      id,
      kind: "coach_chat",
      title: `${roleName} 对话 - ${date}`,
      content,
      status: "committed",
      evidenceType: "coach_conversation",
      evidenceItems: [
        {
          id: createId("evidence"),
          evidenceType: "coach_conversation",
          sourceId: id,
          title: `${roleName} 对话记录`,
          content: summary || `与${roleName}的对话，共${messages.length}条消息`,
          metadata: { role, messageCount: messages.length, date },
          createdAt: now,
          updatedAt: now,
        },
      ],
      metadata: { role, messageCount: messages.length, date },
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, data: artifact });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "保存失败" },
      { status: 500 }
    );
  }
}
