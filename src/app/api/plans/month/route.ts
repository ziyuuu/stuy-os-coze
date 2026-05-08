// API: /api/plans/month - 获取和更新当前月计划
import { NextResponse } from 'next/server';
import { extractHeadings, parseFrontMatter, parseMarkdownTable } from '@/lib/file-utils';
import { getWorkflowService } from '@/lib/harness/workflow';
import { readLatestPlanContent } from '@/lib/harness/plan-overrides';
import { ensureSeedData } from '@/lib/harness/seed';

// PUT: 更新月计划状态
export async function PUT(request: Request) {
  try {
    await ensureSeedData();
    const { status } = await request.json();
    const content = await readLatestPlanContent('monthly');
    
    if (!content) {
      return NextResponse.json(
        { success: false, error: '月计划文件不存在' },
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
        title: `monthly plan (status: ${status})`,
        content: updatedContent,
        evidenceType: 'user_fact',
        metadata: {
          planType: 'monthly',
          status,
          source: 'compat_plans_month_put',
        },
      },
      'User confirmed monthly plan status adjustment.'
    );

    return NextResponse.json({
      success: true,
      data: { status, artifact }
    });
  } catch (error) {
    console.error('更新月计划状态失败:', error);
    return NextResponse.json(
      { success: false, error: '更新月计划状态失败' },
      { status: 500 }
    );
  }
}

// GET: 获取当前月计划
export async function GET() {
  try {
    await ensureSeedData();
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

    // 提取月份信息
    const monthNumber = (metadata['月份'] as string) || 'Month 1';
    const index = parseInt(monthNumber.replace(/[^0-9]/g, ''), 10) || 1;

    // 优先从内容中读取状态，其次从 metadata 读取
    const statusMatch = content.match(/计划状态[：:]\s*([^\s\n]+)/);
    const status = statusMatch ? statusMatch[1] : (metadata['计划状态'] as string) || 'draft';

    const monthInfo = {
      monthNumber,
      index, // 添加下标
      phase: (metadata['对应阶段'] as string) || 'Phase 0',
      period: (metadata['计划周期'] as string) || '',
      status,
      createdAt: (metadata['生成日期'] as string) || ''
    };

    // 提取目标表格
    let goalsTable = null;
    const goalsSectionStart = lines.findIndex(l => l.includes('本月目标'));
    if (goalsSectionStart >= 0) {
      const tableSection = lines.slice(goalsSectionStart, goalsSectionStart + 20).join('\n');
      goalsTable = parseMarkdownTable(tableSection);
    }

    // 提取学习模块
    const modulesSection = headings.find(h => h.text.includes('本月学习模块'));
    const modules: { id: string; name: string; description: string }[] = [];
    if (modulesSection) {
      const moduleLines = body
        .split('\n')
        .filter(line => line.includes('模块') && (line.includes('：') || line.includes(':')));
      
      moduleLines.forEach((line, index) => {
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

    // 提取资源列表
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
        content: body.slice(0, 8000)
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
