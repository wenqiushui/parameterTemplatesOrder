import { NextRequest, NextResponse } from 'next/server';
import { ModelService } from '@/lib/services/modelService';
import { MaterialService } from '@/lib/services/materialService';
import { ConfigService } from '@/lib/services/configService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// 初始化服务
const modelService = new ModelService();
const materialService = new MaterialService();
const configService = new ConfigService(modelService, materialService);

export async function GET(request: NextRequest) {
  try {
    // 获取会话
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 获取用户的所有配置
    const configs = await configService.getUserConfigurations(session.user.id);
    
    return NextResponse.json(configs);
  } catch (error) {
    console.error('Error fetching configurations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configurations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 获取会话
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { modelId, name, materialOverrides } = await request.json();
    
    // 验证请求数据
    if (!modelId || !name) {
      return NextResponse.json(
        { error: '缺少必要的参数' },
        { status: 400 }
      );
    }
    
    // 创建配置
    const configId = await configService.createConfiguration(
      modelId,
      session.user.id,
      name,
      materialOverrides || {}
    );
    
    return NextResponse.json({ configId });
  } catch (error) {
    console.error('Error creating configuration:', error);
    return NextResponse.json(
      { error: 'Failed to create configuration: ' + error.message },
      { status: 500 }
    );
  }
}
