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
    
    const { configIds } = await request.json();
    
    if (!configIds || !Array.isArray(configIds) || configIds.length < 2) {
      return NextResponse.json(
        { error: 'At least two configuration IDs are required' },
        { status: 400 }
      );
    }
    
    // 比较配置
    const comparison = await configService.compareConfigurations(configIds);
    
    return NextResponse.json(comparison);
  } catch (error) {
    console.error('Error comparing configurations:', error);
    return NextResponse.json(
      { error: 'Failed to compare configurations: ' + error.message },
      { status: 500 }
    );
  }
}
