// API: /api/plans/week - 获取和更新当前周计划
import { NextResponse } from 'next/server';
import { extractHeadings, extractListItems, parseFrontMatter } from '@/lib/file-utils';
import { getWorkflowService } from '@/lib/harness/workflow';
import { readLatestPlanContent } from '@/lib/harness/plan-overrides';
import { ensureSeedData } from '@/lib/harness/seed';

// PUT: 更新周计划状态
export async function PUT(request: Request) {
  try {
    await ensureSeedData();
    const { status } = await request.json();
    const content = await readLatestPlanContent('weekly');
    
    if (!content) {
      return NextResponse.json(
        { success: false, error: '周计划文件不存在' },
        { status: 404 }
      );
    }

    const artifact = await getWorkflowService().createAndCommitUserArtifact(
      {
        workflowType: 'state_adjust',
        artifactKind: 'plan',
        title: `weekly plan status ${status}`,
        content: `用户将当前周计划状态调整为：${status}`,
        evidenceType: 'user_fact',
        metadata: {
          planType: 'weekly',
          status,
          source: 'compat_plans_week_put',
        },
      },
      'User confirmed weekly plan status adjustment.'
    );

    return NextResponse.json({
      success: true,
      data: { status, artifact }
    });
  } catch (error) {
    console.error('更新周计划状态失败:', error);
    return NextResponse.json(
      { success: false, error: '更新周计划状态失败' },
      { status: 500 }
    );
  }
}

// GET: 获取当前周计划
export async function GET() {
  try {
    await ensureSeedData();
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

    // 提取周信息 - 从 markdown 内容中提取
    const periodMatch = content.match(/-\s*(\d{4}-\d{2}-\d{2}\s*至\s*\d{4}-\d{2}-\d{2})/);
    const statusMatch = content.match(/计划状态[：:]\s*([^\n]+)/);
    const dateMatch = content.match(/生成日期[：:]\s*(\d{4}-\d{2}-\d{2})/);
    
    const weekInfo = {
      period: periodMatch ? periodMatch[1].trim() : '',
      status: statusMatch ? statusMatch[1].trim() : 'pending',
      createdAt: dateMatch ? dateMatch[1].trim() : '',
      phase: ''
    };

    // 提取本周目标
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

    // 提取练习
    const exercisesSection = headings.find(h => h.text.includes('本周练习'));
    let exercises: string[] = [];
    if (exercisesSection) {
      exercises = listItems
        .filter(item => item.includes('练习') || item.includes('练习：'))
        .map(item => item.replace(/^[练习:：]+/, '').trim());
    }

    // 提取产出
    const deliverablesSection = headings.find(h => h.text.includes('本周产出'));
    let deliverables: string[] = [];
    if (deliverablesSection) {
      deliverables = listItems
        .filter(item => item.includes('.') || item.includes('框架') || item.includes('清单'))
        .slice(0, 4);
    }

    // 提取边界规则
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
        content: body.slice(0, 5000)
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
