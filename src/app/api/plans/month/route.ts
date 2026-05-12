// API: /api/plans/month - 获取和更新当前月计划
import { NextResponse } from 'next/server';
import { extractHeadings, parseFrontMatter, parseMarkdownTable } from '@/lib/file-utils';
import { readLatestPlanContent } from '@/lib/harness/plan-overrides';
import { ensureSeedData } from '@/lib/harness/seed';
import { updatePlanStatus, autoTransitionOnGet, getMonthlyProgress } from '@/lib/plans/status-api';
import { getReviewWindow, extractPeriod } from '@/lib/plans/lifecycle';
import type { PlanStatus } from '@/lib/plans/lifecycle';

import { parseBody } from '@/lib/validation/helpers';
import { PlanStatusUpdateSchema } from '@/lib/validation/schemas';

export async function PUT(request: Request) {
  const parsed = await parseBody(request, PlanStatusUpdateSchema);
  if (!parsed.success) return parsed.errorResponse;
  const { status } = parsed.data;

  try {
    const result = await updatePlanStatus('monthly', status as PlanStatus);
    return NextResponse.json({
      success: true,
      data: { status, artifact: result.artifact },
    });
  } catch (error) {
    console.error('更新月计划状态失败:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || '更新月计划状态失败' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await ensureSeedData();
    const autoTransition = await autoTransitionOnGet('monthly').catch(() => ({ status: 'draft' as PlanStatus, transitioned: false, phase: 'in_period' as const, warnings: [] as string[] }));
    const content = await readLatestPlanContent('monthly');

    if (!content) {
      return NextResponse.json(
        { success: false, error: '月计划文件不存在' },
        { status: 404 }
      );
    }

    const headings = extractHeadings(content);
    const { metadata, body } = parseFrontMatter(content);
    const lines = content.split('\n');
    const status = autoTransition.status;
    const warnings = autoTransition.warnings || [];

    // 进度查询 + 复盘窗口
    const progress = await getMonthlyProgress(content).catch(() => null);
    const period = extractPeriod('monthly', content);
    const now = new Date();
    const reviewWindow = period
      ? (() => {
          const w = getReviewWindow('monthly', period.end);
          return {
            canReview: now.toISOString().slice(0, 10) >= period.end.toISOString().slice(0, 10),
            isLate: now > w.closes,
            opens: w.opens.toISOString().slice(0, 10),
            closes: w.closes.toISOString().slice(0, 10),
          };
        })()
      : null;

    const monthNumber = (metadata['月份'] as string) || 'Month 1';
    const index = parseInt(monthNumber.replace(/[^0-9]/g, ''), 10) || 1;

    const monthInfo = {
      monthNumber,
      index,
      phase: (metadata['对应阶段'] as string) || 'Phase 0',
      period: (metadata['计划周期'] as string) || '',
      status,
      createdAt: (metadata['生成日期'] as string) || ''
    };

    let goalsTable = null;
    const goalsSectionStart = lines.findIndex(l => l.includes('本月目标'));
    if (goalsSectionStart >= 0) {
      const tableSection = lines.slice(goalsSectionStart, goalsSectionStart + 20).join('\n');
      goalsTable = parseMarkdownTable(tableSection);
    }

    const modulesSection = headings.find(h => h.text.includes('本月学习模块'));
    const modules: { id: string; name: string; description: string }[] = [];
    if (modulesSection) {
      const moduleLines = body
        .split('\n')
        .filter(line => line.includes('模块') && (line.includes('：') || line.includes(':')));

      moduleLines.forEach((line, idx) => {
        const match = line.match(/模块\s*(\d+)[：:]\s*(.+)/);
        if (match) {
          modules.push({
            id: match[1],
            name: match[2].trim(),
            description: ''
          });
        }
      });
    }

    const resourceSection = headings.find(h => h.text.includes('本月确认使用资源'));
    let resources: { id: string; name: string; status: string }[] = [];
    if (resourceSection) {
      const resourceStart = lines.findIndex(l => l.includes('本月确认使用资源'));
      if (resourceStart >= 0) {
        const resourceSection2 = lines.slice(resourceStart, resourceStart + 30).join('\n');
        const resourceTable = parseMarkdownTable(resourceSection2);
        if (resourceTable) {
          resources = resourceTable.rows.map(row => ({
            id: row[0] || '',
            name: row[1] || '',
            status: row[3] || 'pending'
          }));
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...monthInfo,
        goals: goalsTable ? {
          headers: goalsTable.headers,
          rows: goalsTable.rows
        } : null,
        modules,
        resources,
        content: body.slice(0, 8000),
        truncated: body.length > 8000,
        contentLength: body.length,
        progress,
        reviewWindow,
        warnings
      }
    });
  } catch (error) {
    console.error('获取月计划失败:', error);
    return NextResponse.json(
      { success: false, error: '获取月计划失败' },
      { status: 500 }
    );
  }
}
