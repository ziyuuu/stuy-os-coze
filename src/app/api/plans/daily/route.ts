// API: /api/plans/daily - 获取和更新当前日计划
import { NextResponse } from 'next/server';
import { extractListItems, parseFrontMatter } from '@/lib/file-utils';
import { readLatestPlanContent } from '@/lib/harness/plan-overrides';
import { ensureSeedData } from '@/lib/harness/seed';
import { updatePlanStatus, autoTransitionOnGet } from '@/lib/plans/status-api';
import type { PlanStatus } from '@/lib/plans/lifecycle';

export async function GET() {
  try {
    await ensureSeedData();
    const autoTransition = await autoTransitionOnGet('daily').catch(() => ({ status: 'draft' as PlanStatus, transitioned: false, phase: 'in_period' as const, warnings: [] as string[] }));
    const content = await readLatestPlanContent('daily');

    if (!content) {
      return NextResponse.json(
        { success: false, error: '日计划文件不存在' },
        { status: 404 }
      );
    }

    const { metadata, body } = parseFrontMatter(content);
    const listItems = extractListItems(body);
    const status = autoTransition.status;
    const warnings = autoTransition.warnings || [];

    const dailyInfo = {
      date: (metadata['日期'] as string) || '',
      status,
      weekPlan: (metadata['对应周计划'] as string) || '',
      phase: (metadata['对应阶段'] as string) || ''
    };

    const tasks = listItems
      .filter(item => item.length > 0)
      .slice(0, 5)
      .map(item => ({
        description: item,
        completed: false
      }));

    return NextResponse.json({
      success: true,
      data: {
        ...dailyInfo,
        tasks,
        warnings
      }
    });
  } catch (error) {
    console.error('Error reading daily plan:', error);
    return NextResponse.json(
      { success: false, error: '读取日计划失败' },
      { status: 500 }
    );
  }
}

import { parseBody } from '@/lib/validation/helpers';
import { PlanStatusUpdateSchema } from '@/lib/validation/schemas';

export async function PUT(request: Request) {
  const parsed = await parseBody(request, PlanStatusUpdateSchema);
  if (!parsed.success) return parsed.errorResponse;
  const { status } = parsed.data;

  try {
    const result = await updatePlanStatus('daily', status as PlanStatus);
    return NextResponse.json({
      success: true,
      data: { status, artifact: result.artifact },
    });
  } catch (error) {
    console.error('更新日计划状态失败:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || '更新日计划状态失败' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: 'current_daily_plan.md 是种子/参考数据，V0.1 不允许直接删除源文件。',
    },
    { status: 409 }
  );
}
