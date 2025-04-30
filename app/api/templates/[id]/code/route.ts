import { NextRequest, NextResponse } from 'next/server';
import { templateService } from '@/lib/services/templateService';

// GET /api/templates/:id/code - 获取特定模板的代码
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;

    // 获取模板元数据
    const metadata = await templateService.getTemplateMetadata(templateId);

    if (!metadata) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // 只有浏览器端生成的模板才需要返回代码
    if (metadata.generationMode !== 'browser') {
      return NextResponse.json({
        error: 'Template code is only available for browser-generated templates'
      }, { status: 400 });
    }

    // 获取模板代码
    const code = await templateService.getTemplateCode(templateId, metadata.version);

    if (!code) {
      return NextResponse.json({
        error: `Template code not found for ${templateId} (version ${metadata.version})`
      }, { status: 404 });
    }

    // 构建模板代码对象
    const templateCode = {
      id: metadata.id,
      name: metadata.name,
      description: metadata.description,
      parameterSchema: metadata.parameterSchema,
      defaultParameters: metadata.defaultParameters,
      version: metadata.version,
      generateFunction: code,
    };

    return NextResponse.json(templateCode, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching template code:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
