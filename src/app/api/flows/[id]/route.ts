// API: /api/flows/[id] - 获取流程详情
import { NextResponse } from 'next/server';
import { readFile, extractHeadings, extractListItems, parseFrontMatter, extractCodeBlocks } from '@/lib/file-utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const content = await readFile(`flows/${id}.md`);
    
    if (!content) {
      return NextResponse.json(
        { success: false, error: '流程文件不存在' },
        { status: 404 }
      );
    }

    const headings = extractHeadings(content);
    const { metadata, body } = parseFrontMatter(content);
    const listItems = extractListItems(content);
    const codeBlocks = extractCodeBlocks(content);

    // 提取步骤
    const stepsSection = headings.find(h => 
      h.text.includes('步骤') || 
      h.text.includes('流程') ||
      h.text.includes('Steps')
    );
    
    let steps: { order: number; name: string; description: string }[] = [];
    if (stepsSection) {
      const stepHeadings = headings.filter(h => 
        h.level > stepsSection.level && 
        h.level <= stepsSection.level + 2
      );
      
      steps = stepHeadings.map((h, index) => ({
        order: index + 1,
        name: h.text,
        description: ''
      }));
    }

    // 提取前置条件
    const prerequisitesSection = headings.find(h => h.text.includes('前置'));
    let prerequisites: string[] = [];
    if (prerequisitesSection) {
      prerequisites = listItems.slice(0, 5);
    }

    // 提取输入
    const inputsSection = headings.find(h => h.text.includes('输入') || h.text.includes('必读'));
    let inputs: string[] = [];
    if (inputsSection) {
      inputs = listItems;
    }

    // 根据文件名推断类型
    let type = 'general';
    if (id.includes('plan')) type = 'plan_generation';
    else if (id.includes('review')) type = 'review';
    else if (id.includes('lesson_prep')) type = 'lesson_prep';
    else if (id.includes('evaluation')) type = 'evaluation';

    return NextResponse.json({
      success: true,
      data: {
        id,
        name: headings[0]?.text || id,
        type,
        description: listItems[0] || '',
        metadata,
        steps,
        prerequisites,
        inputs,
        codeBlocks,
        content: body.slice(0, 10000)
      }
    });
  } catch (error) {
    console.error('获取流程详情失败:', error);
    return NextResponse.json(
      { success: false, error: '获取流程详情失败' },
      { status: 500 }
    );
  }
}
