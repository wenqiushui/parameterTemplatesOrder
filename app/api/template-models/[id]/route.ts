import { NextRequest, NextResponse } from 'next/server';
import { templateModelService } from '@/lib/services/templateModelService';
import { ModelGenerationMode } from '@/lib/templates/baseTemplate';

// GET /api/template-models/:id - 获取模型
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const modelId = params.id;
    
    // 从数据库加载模型
    const template = await templateModelService.loadModel(modelId);
    
    if (!template) {
      return new NextResponse(JSON.stringify({ error: 'Model not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // 根据模板类型选择不同的处理方式
    switch (template.generationMode) {
      case ModelGenerationMode.BROWSER:
        // 简单模板：返回模板 JSON，让浏览器端生成模型
        return new NextResponse(JSON.stringify(template.toJson()), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
      case ModelGenerationMode.SERVER:
      case ModelGenerationMode.EXTERNAL:
        // 复杂模板或外部服务器模型：在服务器端生成模型，然后返回 GLB 文件
        const modelBuffer = await template.generateModel();
        
        return new NextResponse(modelBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'model/gltf-binary',
            'Content-Disposition': `attachment; filename="${template.id}_model.glb"`,
          },
        });
        
      default:
        throw new Error(`Unsupported generation mode: ${template.generationMode}`);
    }
  } catch (error: any) {
    console.error('Error loading model:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
