import { NextRequest, NextResponse } from 'next/server';
import { ModelService } from '@/lib/services/modelService';
import { MaterialService } from '@/lib/services/materialService';
import { ConfigService } from '@/lib/services/configService';

// 初始化服务
const modelService = new ModelService();
const materialService = new MaterialService();
const configService = new ConfigService(modelService, materialService);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const configId = params.id;
    
    // 获取配置 GLB 数据
    const glbBuffer = await configService.getConfigurationGLB(configId);
    
    // 返回 GLB 文件
    return new NextResponse(glbBuffer, {
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Content-Disposition': `attachment; filename="config_${configId}.glb"`
      }
    });
  } catch (error) {
    console.error('Error fetching configuration GLB:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration GLB' },
      { status: 404 }
    );
  }
}
