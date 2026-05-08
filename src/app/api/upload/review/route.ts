/**
 * 上传复盘 API
 * 支持日/周/月复盘上传
 */

import { NextRequest, NextResponse } from "next/server";
import { getWorkflowService } from "@/lib/harness/workflow";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewType, date, content } = body;

    if (!reviewType || !content) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const today = date || new Date().toISOString().split("T")[0];
    const normalizedType = normalizeReviewType(reviewType);

    if (!normalizedType) {
        return NextResponse.json(
          { success: false, error: "无效的复盘类型" },
          { status: 400 }
        );
    }

    const artifact = await getWorkflowService().createAndCommitUserArtifact(
      {
        workflowType: "review_submit",
        artifactKind: "review",
        title: `${normalizedType} review ${today}`,
        content,
        evidenceType: "user_fact",
        metadata: {
          date: today,
          reviewType: normalizedType,
          source: "compat_upload_review",
        },
      },
      "User submitted a review through the compatibility endpoint."
    );

    return NextResponse.json({
      success: true,
      data: {
        path: `artifact:${artifact.id}`,
        artifact,
        reviewType: normalizedType,
        date: today,
      },
    });
  } catch (error) {
    console.error("Upload review error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

function normalizeReviewType(reviewType: string): string | null {
  const map: Record<string, string> = {
    daily: "daily",
    week: "weekly",
    weekly: "weekly",
    month: "monthly",
    monthly: "monthly",
  };
  return map[reviewType] || null;
}
