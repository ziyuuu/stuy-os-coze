// API: /api/plans/master - 获取和更新 Master Plan
import { NextResponse } from 'next/server';
import { extractHeadings, extractListItems, parseFrontMatter } from '@/lib/file-utils';
import { readLatestPlanContent } from '@/lib/harness/plan-overrides';
import { ensureSeedData } from '@/lib/harness/seed';
import { updatePlanStatus, autoTransitionOnGet } from '@/lib/plans/status-api';
import type { PlanStatus } from '@/lib/plans/lifecycle';

import { parseBody } from '@/lib/validation/helpers';
import { PlanStatusUpdateSchema } from '@/lib/validation/schemas';

export async function PUT(request: Request) {
  const parsed = await parseBody(request, PlanStatusUpdateSchema);
  if (!parsed.success) return parsed.errorResponse;
  const { status } = parsed.data;

  try {
    const result = await updatePlanStatus('master', status as PlanStatus);
    return NextResponse.json({
      success: true,
      data: { status, artifact: result.artifact },
    });
  } catch (error) {
    console.error('更新 Master Plan 状态失败:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || '更新 Master Plan 状态失败' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await ensureSeedData();
    const autoTransition = await autoTransitionOnGet('master').catch(() => ({ status: 'draft' as PlanStatus, transitioned: false, phase: 'in_period' as const, warnings: [] as string[] }));
    const content = await readLatestPlanContent('master');

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Master Plan 文件不存在' },
        { status: 404 }
      );
    }

    const headings = extractHeadings(content);
    const { metadata, body } = parseFrontMatter(content);
    const status = autoTransition.status;
    const warnings = autoTransition.warnings || [];

    const phases = headings
      .filter(h => h.level === 2 && (h.text.startsWith('Phase ') || h.text.includes('阶段')))
      .map((h, index) => {
        const match = h.text.match(/Phase\s+(\d+)[：:]\s*(.+)/);
        return {
          id: match ? match[1] : String(index),
          name: match ? match[2] : h.text,
          level: 2
        };
      });

    const capabilityModules = headings
      .filter(h => h.level === 2 && h.text.includes('能力模块'))
      .map(h => h.text);

    const longTermGoals = extractListItems(body)
      .filter(item => item.includes('形成') || item.includes('具备') || item.includes('建立'));

    const targetPosition = {
      primary: 'C 端 AI Product Manager',
      alternatives: ['企业级 AI', 'B 端 AI', '政企数据平台'],
      constraints: ['长沙优先', '接受远程']
    };

    return NextResponse.json({
      success: true,
      data: {
        metadata: {
          version: (metadata['当前版本'] as string) || 'V2.0',
          lastUpdated: new Date().toISOString()
        },
        status,
        longTermGoals,
        targetPosition,
        phases,
        capabilityModules,
        content: body.slice(0, 5000),
        truncated: body.length > 5000,
        contentLength: body.length,
        warnings
      }
    });
  } catch (error) {
    console.error('获取 Master Plan 失败:', error);
    return NextResponse.json(
      { success: false, error: '获取 Master Plan 失败' },
      { status: 500 }
    );
  }
}
