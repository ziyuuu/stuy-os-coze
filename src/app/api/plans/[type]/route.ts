import { NextRequest, NextResponse } from 'next/server';

const PLAN_NAMES: Record<string, string> = {
  master: '总计划',
  month: '月计划',
  week: '周计划',
  daily: '日计划',
};

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  try {
    const params = await context.params;
    const planType = params.type.toLowerCase();

    if (!PLAN_NAMES[planType]) {
      return NextResponse.json(
        { success: false, error: '无效的计划类型' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: `${PLAN_NAMES[planType]}是种子/参考数据，V0.1 不允许直接删除源文件。请通过 artifact 归档能力处理运行时记录。`,
      },
      { status: 409 }
    );
  } catch (error) {
    console.error('删除计划失败:', error);
    return NextResponse.json(
      { success: false, error: '删除计划失败' },
      { status: 500 }
    );
  }
}
