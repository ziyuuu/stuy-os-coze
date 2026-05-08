// API: /api/flows - 获取所有流程
import { NextResponse } from 'next/server';
import { readFile, listDirectory, extractHeadings, extractListItems, parseFrontMatter } from '@/lib/file-utils';

export async function GET() {
  try {
    const flowsDir = 'flows';
    const files = await listDirectory(flowsDir);
    
    const flows: {
      id: string;
      name: string;
      type: string;
      description: string;
      steps: number;
    }[] = [];

    for (const file of files) {
      if (!file.endsWith('.md') || file === 'README.md') continue;
      
      const content = await readFile(`${flowsDir}/${file}`);
      if (!content) continue;

      const { metadata } = parseFrontMatter(content);
      const headings = extractHeadings(content);
      const listItems = extractListItems(content);
      
      // 提取步骤数
      const stepsCount = listItems.filter(item => 
        item.includes('步骤') || 
        item.includes('Step') ||
        item.includes('流程')
      ).length;

      // 根据文件名推断类型
      const fileName = file.replace('.md', '');
      let type = 'general';
      if (fileName.includes('plan')) type = 'plan_generation';
      else if (fileName.includes('review')) type = 'review';
      else if (fileName.includes('lesson_prep')) type = 'lesson_prep';
      else if (fileName.includes('evaluation')) type = 'evaluation';

      flows.push({
        id: fileName,
        name: (metadata['名称'] as string) || headings[0]?.text || fileName,
        type,
        description: listItems[0] || '',
        steps: Math.max(stepsCount, 1)
      });
    }

    // 按类型分组
    const groupedFlows = {
      plan_generation: flows.filter(f => f.type === 'plan_generation'),
      review: flows.filter(f => f.type === 'review'),
      lesson_prep: flows.filter(f => f.type === 'lesson_prep'),
      evaluation: flows.filter(f => f.type === 'evaluation'),
      general: flows.filter(f => f.type === 'general')
    };

    return NextResponse.json({
      success: true,
      data: {
        flows,
        groupedFlows,
        totalCount: flows.length
      }
    });
  } catch (error) {
    console.error('获取流程列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取流程列表失败' },
      { status: 500 }
    );
  }
}
