import { NextRequest, NextResponse } from 'next/server';
import { ModelService } from '@/lib/services/modelService';

const modelService = new ModelService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const modelId = params.id;
    console.log(`Fetching GLB for model ID: ${modelId}`);

    // 获取模型 GLB 数据
    const glbBuffer = await modelService.getModelGLB(modelId);

    // 检查 GLB 数据
    if (!glbBuffer || glbBuffer.length === 0) {
      console.error('Empty GLB buffer returned');
      return NextResponse.json(
        { error: 'Empty GLB data' },
        { status: 500 }
      );
    }

    console.log(`GLB buffer size: ${glbBuffer.length} bytes`);

    // 检查 GLB 文件头部
    if (glbBuffer.length >= 12) {
      const magic = glbBuffer.toString('ascii', 0, 4);
      const version = glbBuffer.readUInt32LE(4);
      const length = glbBuffer.readUInt32LE(8);

      console.log(`GLB header: magic=${magic}, version=${version}, length=${length}`);

      if (magic !== 'glTF' || version !== 2) {
        console.error('Invalid GLB header');
        return NextResponse.json(
          { error: 'Invalid GLB format' },
          { status: 500 }
        );
      }
    } else {
      console.error('GLB buffer too small');
      return NextResponse.json(
        { error: 'Invalid GLB data (too small)' },
        { status: 500 }
      );
    }

    // 返回 GLB 文件
    return new NextResponse(glbBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="model_${modelId}.glb"`,
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('Error fetching model GLB:', error);
    return NextResponse.json(
      { error: `Failed to fetch model GLB: ${error.message}` },
      { status: 500 }
    );
  }
}
