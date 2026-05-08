// API: /api/plans/master - 获取 Master Plan
import { NextResponse } from 'next/server';
import { extractHeadings, extractListItems, parseFrontMatter } from '@/lib/file-utils';
import { getWorkflowService } from '@/lib/harness/workflow';
import { readLatestPlanContent } from '@/lib/harness/plan-overrides';
import { ensureSeedData } from '@/lib/harness/seed';

export async function PUT(request: Request) {
  try {
    await ensureSeedData();
    const { status } = await request.json();
    const content = await readLatestPlanContent('master');

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Master Plan 文件不存在' },
        { status: 404 }
      );
    }

    const artifact = await getWorkflowService().createAndCommitUserArtifact(
      {
        workflowType: 'state_adjust',
        artifactKind: 'plan',
        title: `master plan (status: ${status})`,
        content,
        evidenceType: 'user_fact',
        metadata: {
          planType: 'master',
          status,
          source: 'compat_plans_master_put',
        },
      },
      'User confirmed master plan status adjustment.'
    );

    return NextResponse.json({
      success: true,
      data: { status, artifact },
    });
  } catch (error) {
    console.error('更新 Master Plan 状态失败:', error);
    return NextResponse.json(
      { success: false, error: '更新 Master Plan 状态失败' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await ensureSeedData();
    const content = await readLatestPlanContent('master');
    
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Master Plan 文件不存在' },
        { status: 404 }
      );
    }

    const headings = extractHeadings(content);
    const { metadata, body } = parseFrontMatter(content);

    // 提取阶段结构
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

    // 提取能力模块
    const capabilityModules = headings
      .filter(h => h.level === 2 && h.text.includes('能力模块'))
      .map(h => h.text);

    // 提取长期目标
    const longTermGoals = extractListItems(body)
      .filter(item => item.includes('形成') || item.includes('具备') || item.includes('建立'));

    // 提取目标定位
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
        longTermGoals,
        targetPosition,
        phases,
        capabilityModules,
        content: body.slice(0, 5000) // 限制返回内容长度
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
