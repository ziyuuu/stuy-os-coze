import { NextRequest, NextResponse } from "next/server";
import { buildImportBatch, isSupportedImportFile } from "@/lib/harness/import-classifier";
import { getStorageAdapter } from "@/lib/harness/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "请至少上传一个 .md/.txt/.json 文件" },
        { status: 400 }
      );
    }

    const accepted = [];
    const rejected: string[] = [];

    for (const file of files) {
      if (!isSupportedImportFile(file.name)) {
        rejected.push(`${file.name}: unsupported type`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name}: exceeds 2MB limit`);
        continue;
      }
      accepted.push({
        fileName: file.name,
        mediaType: file.type || "text/plain",
        size: file.size,
        content: await file.text(),
      });
    }

    if (accepted.length === 0) {
      return NextResponse.json(
        { success: false, error: "没有可导入的文件", rejected },
        { status: 400 }
      );
    }

    const batch = buildImportBatch(accepted);
    batch.errors = rejected;
    const saved = await getStorageAdapter().saveImportBatch(batch);

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}
