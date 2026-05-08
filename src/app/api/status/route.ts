// API: /api/status - 获取系统当前状态
import { NextResponse } from 'next/server';
import { readFile, parseFrontMatter, extractHeadings, simplifyContent } from '@/lib/file-utils';

export async function GET() {
  try {
    // 读取当前状态文件
    const statusContent = await readFile('current_status.md');
    const masterPlanContent = await readFile('master_plan.md');
    const annualPlanContent = await readFile('annual_plan.md');
    const monthPlanContent = await readFile('current_month_plan.md');
    const weekPlanContent = await readFile('current_week_plan.md');
    const stageContent = await readFile('current_stage.md');

    // 解析 Master Plan
    let phases: { id: string; name: string }[] = [];
    if (masterPlanContent) {
      const headings = extractHeadings(masterPlanContent);
      phases = headings
        .filter(h => h.level === 2 && h.text.startsWith('Phase '))
        .map(h => {
          const match = h.text.match(/Phase\s+(\d+):\s*(.+)/);
          return match ? { id: match[1], name: match[2] } : null;
        })
        .filter((p): p is { id: string; name: string } => p !== null);
    }

    // 解析年度计划
    let currentYearPhase = '';
    if (annualPlanContent) {
      const headings = extractHeadings(annualPlanContent);
      const currentPhaseHeading = headings.find(h => h.text.includes('当前阶段') || h.text.includes('Phase 0'));
      if (currentPhaseHeading) {
        currentYearPhase = currentPhaseHeading.text;
      }
    }

    // 解析月份计划
    let currentMonth = {
      period: '',
      goals: 0,
      modules: 0
    };
    if (monthPlanContent) {
      const { metadata } = parseFrontMatter(monthPlanContent);
      const headings = extractHeadings(monthPlanContent);
      const goalsHeading = headings.find(h => h.text.includes('本月目标'));
      currentMonth = {
        period: (metadata['计划周期'] as string) || '',
        goals: goalsHeading ? 3 : 0, // 从模板推断
        modules: 4 // 从模板推断
      };
    }

    // 解析周计划
    let currentWeek = {
      period: '',
      status: 'pending'
    };
    if (weekPlanContent) {
      const { metadata } = parseFrontMatter(weekPlanContent);
      currentWeek = {
        period: (metadata['周期'] as string) || '',
        status: ((metadata['计划状态'] as string) || 'pending').toLowerCase().includes('current') ? 'current' : 'pending'
      };
    }

    // 解析阶段
    let currentPhase = {
      id: '',
      name: '',
      description: ''
    };
    if (stageContent) {
      const headings = extractHeadings(stageContent);
      if (headings.length > 0) {
        currentPhase = {
          id: 'Phase 0',
          name: headings[0]?.text || 'Phase 0',
          description: simplifyContent(stageContent, 200)
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        currentPhase,
        currentMonth,
        currentWeek,
        phases,
        overview: {
          totalPhases: phases.length,
          currentPhaseIndex: 0,
          workspaceStatus: statusContent ? 'active' : 'inactive'
        },
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('获取状态失败:', error);
    return NextResponse.json(
      { success: false, error: '获取状态失败' },
      { status: 500 }
    );
  }
}
