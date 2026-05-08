// API: /api/templates/[id] - 获取模板详情
import { NextResponse } from 'next/server';
import { readFile, extractHeadings, extractListItems, parseFrontMatter } from '@/lib/file-utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const content = await readFile(`templates/${id}.md`);
    
    if (!content) {
      return NextResponse.json(
        { success: false, error: '模板文件不存在' },
        { status: 404 }
      );
    }

    const headings = extractHeadings(content);
    const { metadata, body } = parseFrontMatter(content);
    const listItems = extractListItems(body);

    // 提取变量
    const variablesSection = headings.find(h => h.text.includes('变量') || h.text.includes('字段'));
    const variables: { name: string; description: string; required: boolean }[] = [];
    if (variablesSection) {
      const varLines = body
        .split('\n')
        .filter(line => line.includes('|') && !line.includes('---'));
      
      varLines.forEach(line => {
        const cells = line.split('|').map(c => c.trim()).filter(c => c);
        if (cells.length >= 2) {
          variables.push({
            name: cells[0],
            description: cells[1],
            required: !cells[2]?.toLowerCase().includes('optional')
          });
        }
      });
    }

    // 根据文件名推断类型
    let type = 'general';
    if (id.includes('plan')) type = 'plan';
    else if (id.includes('review')) type = 'review';
    else if (id.includes('lesson_prep')) type = 'lesson_prep';
    else if (id.includes('evaluation')) type = 'evaluation';
    else if (id.includes('output')) type = 'output';

    return NextResponse.json({
      success: true,
      data: {
        id,
        name: headings[0]?.text || id,
        type,
        description: listItems[0] || '',
        metadata,
        variables,
        content: body.slice(0, 15000)
      }
    });
  } catch (error) {
    console.error('获取模板详情失败:', error);
    return NextResponse.json(
      { success: false, error: '获取模板详情失败' },
      { status: 500 }
    );
  }
}
