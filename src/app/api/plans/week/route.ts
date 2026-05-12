// API: /api/plans/week - 获取和更新当前周计划
import { NextResponse } from 'next/server';
import { extractHeadings, extractListItems, parseFrontMatter } from '@/lib/file-utils';
import { readLatestPlanContent } from '@/lib/harness/plan-overrides';
import { ensureSeedData } from '@/lib/harness/seed';
import { updatePlanStatus, autoTransitionOnGet, getWeeklyProgress } from '@/lib/plans/status-api';
import { getReviewWindow, extractPeriod } from '@/lib/plans/lifecycle';
import type { PlanStatus } from '@/lib/plans/lifecycle';

import { parseBody } from '@/lib/validation/helpers';
import { PlanStatusUpdateSchema } from '@/lib/validation/schemas';

export async function PUT(request: Request) {
  const parsed = await parseBody(request, PlanStatusUpdateSchema);
  if (!parsed.success) return parsed.errorResponse;
  const { status } = parsed.data;

  try {
    const result = await updatePlanStatus('weekly', status as PlanStatus);
    return NextResponse.json({
      success: true,
      data: { status, artifact: result.artifact },
    });
  } catch (error) {
    console.error('更新周计划状态失败:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || '更新周计划状态失败' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await ensureSeedData();
    const autoTransition = await autoTransitionOnGet('weekly').catch(() => ({ status: 'draft' as PlanStatus, transitioned: false, phase: 'in_period' as const, warnings: [] as string[] }));
    const content = await readLatestPlanContent('weekly');

    if (!content) {
      return NextResponse.json(
        { success: false, error: '周计划文件不存在' },
        { status: 404 }
      );
    }

    const headings = extractHeadings(content);
    const { metadata, body } = parseFrontMatter(content);
    const listItems = extractListItems(body);
    const status = autoTransition.status;
    const warnings = autoTransition.warnings || [];

    // 进度查询 + 复盘窗口
    const progress = await getWeeklyProgress(content).catch(() => null);
    const period = extractPeriod('weekly', content);
    const now = new Date();
    const reviewWindow = period
      ? (() => {
          const w = getReviewWindow('weekly', period.end);
          return {
            canReview: now.toISOString().slice(0, 10) >= period.end.toISOString().slice(0, 10),
            isLate: now > w.closes,
            opens: w.opens.toISOString().slice(0, 10),
            closes: w.closes.toISOString().slice(0, 10),
          };
        })()
      : null;

    const periodMatch = content.match(/(\d{4}-\d{2}-\d{2})\s*至\s*(\d{4}-\d{2}-\d{2})/);
    const dateMatch = content.match(/生成日期[：:]\s*(\d{4}-\d{2}-\d{2})/);

    const weekInfo = {
      period: periodMatch ? `${periodMatch[1]} 至 ${periodMatch[2]}` : '',
      status,
      createdAt: dateMatch ? dateMatch[1].trim() : '',
      phase: (metadata['对应阶段'] as string) || ''
    };

    const goalsSection = headings.find(h => h.text.includes('本周目标'));
    let goals: { description: string; source: string; expected: string }[] = [];
    if (goalsSection) {
      const goalItems = listItems.filter(item =>
        item.includes('建立') ||
        item.includes('确认') ||
        item.includes('开始') ||
        item.includes('形成')
      );
      goals = goalItems.slice(0, 3).map(item => ({
        description: item,
        source: '月计划',
        expected: ''
      }));
    }

    const exercisesSection = headings.find(h => h.text.includes('本周练习'));
    let exercises: string[] = [];
    if (exercisesSection) {
      exercises = listItems
        .filter(item => item.includes('练习') || item.includes('练习：'))
        .map(item => item.replace(/^[练习:：]+/, '').trim());
    }

    const deliverablesSection = headings.find(h => h.text.includes('本周产出'));
    let deliverables: string[] = [];
    if (deliverablesSection) {
      deliverables = listItems
        .filter(item => item.includes('.') || item.includes('框架') || item.includes('清单'))
        .slice(0, 4);
    }

    const boundarySection = headings.find(h => h.text.includes('边界'));
    let boundaries: string[] = [];
    if (boundarySection) {
      boundaries = listItems
        .filter(item => item.includes('不') || item.includes('禁止'))
        .slice(0, 5);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...weekInfo,
        goals,
        exercises,
        deliverables,
        boundaries,
        content: body.slice(0, 5000),
        truncated: body.length > 5000,
        contentLength: body.length,
        progress,
        reviewWindow,
        warnings
      }
    });
  } catch (error) {
    console.error('获取周计划失败:', error);
    return NextResponse.json(
      { success: false, error: '获取周计划失败' },
      { status: 500 }
    );
  }
}
