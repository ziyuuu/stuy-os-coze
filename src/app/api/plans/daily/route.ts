// API: /api/plans/daily - 获取和更新当前日计划
import { NextResponse } from 'next/server';
import { extractListItems, parseFrontMatter } from '@/lib/file-utils';
import { getWorkflowService } from '@/lib/harness/workflow';
import { readLatestPlanContent } from '@/lib/harness/plan-overrides';
import { ensureSeedData } from '@/lib/harness/seed';

export async function GET() {
  try {
    await ensureSeedData();
    const content = await readLatestPlanContent('daily');
    
    if (!content) {
      return NextResponse.json(
        { success: false, error: '日计划文件不存在' },
        { status: 404 }
      );
    }

    const { metadata, body } = parseFrontMatter(content);
    const listItems = extractListItems(body);

    // 提取日信息
    const dailyInfo = {
      date: (metadata['日期'] as string) || '',
      status: (metadata['计划状态'] as string) || 'pending',
      weekPlan: (metadata['对应周计划'] as string) || '',
      phase: (metadata['对应阶段'] as string) || ''
    };

    // 提取今日任务
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
        tasks
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

// PUT: 更新日计划状态
export async function PUT(request: Request) {
  try {
    await ensureSeedData();
    const { status } = await request.json();
    const content = await readLatestPlanContent('daily');
    
    if (!content) {
      return NextResponse.json(
        { success: false, error: '日计划文件不存在' },
        { status: 404 }
      );
    }

    // 替换内容中的状态行
    const updatedContent = content.replace(
      /计划状态[：:]\s*[^\s\n]+/,
      `计划状态：${status}`
    );

    const artifact = await getWorkflowService().createAndCommitUserArtifact(
      {
        workflowType: 'state_adjust',
        artifactKind: 'plan',
        title: `daily plan (status: ${status})`,
        content: updatedContent,
        evidenceType: 'user_fact',
        metadata: {
          planType: 'daily',
          status,
          source: 'compat_plans_daily_put',
        },
      },
      'User confirmed daily plan status adjustment.'
    );

    return NextResponse.json({
      success: true,
      data: { status, artifact }
    });
  } catch (error) {
    console.error('更新日计划状态失败:', error);
    return NextResponse.json(
      { success: false, error: '更新日计划状态失败' },
      { status: 500 }
    );
  }
}

// DELETE: 删除日计划
export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: 'current_daily_plan.md 是种子/参考数据，V0.1 不允许直接删除源文件。',
    },
    { status: 409 }
  );
}
