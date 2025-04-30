import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取会话
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 获取模型
    const model = await db.model.findUnique({
      where: { id: params.id },
      include: {
        configs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }
    
    // 检查权限
    if (model.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // 返回配置列表
    const configs = model.configs.map(config => ({
      id: config.id,
      name: config.name,
      modelId: config.modelId,
      createdAt: config.createdAt
    }));
    
    return NextResponse.json(configs);
  } catch (error) {
    console.error('Error fetching model configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch model configs' },
      { status: 500 }
    );
  }
}
