import { NextRequest, NextResponse } from 'next/server';
import { templateRegistry } from '@/lib/templates/templateRegistry';
import { registerTemplate } from '@/lib/templates/discovery';

// GET /api/templates/:id/registry-code - 从注册表中获取模板代码
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;
    console.log(`GET /api/templates/${templateId}/registry-code - Fetching template code from registry`);

    // 尝试注册模板
    await registerTemplate(templateId);

    // 获取所有已注册的模板ID
    const registeredIds = templateRegistry.getAllTemplateIds();
    console.log(`Registered template IDs: ${registeredIds.join(', ')}`);

    // 从注册表中获取模板
    const template = templateRegistry.get(templateId);
    if (!template) {
      console.error(`Template not found in registry: ${templateId}`);
      return NextResponse.json({ error: 'Template not found in registry' }, { status: 404 });
    }

    console.log(`Template found in registry: ${template.id} (${template.name}), generationMode: ${template.generationMode}`);

    // 获取模板的生成函数
    const generateFunction = template.generate.toString();
    console.log(`Found generate function for template ${templateId}`);

    // 构建模板代码对象
    const templateCode = {
      id: template.id,
      name: template.name,
      description: template.description,
      parameterSchema: template.getParameterSchema(),
      defaultParameters: template.getDefaultParameters(),
      version: '1.0.0', // 默认版本
      generateFunction,
    };

    return NextResponse.json(templateCode, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching template code from registry:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
