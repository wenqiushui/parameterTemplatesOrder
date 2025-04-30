import { NextRequest, NextResponse } from 'next/server';
import { templateRegistry } from '@/lib/templates/templateRegistry';
import { BoxesTemplate } from '@/lib/templates/boxesTemplate';
import { ChairTemplate } from '@/lib/templates/chairTemplate';
import { DoorTemplate } from '@/lib/templates/doorTemplate';
import { WindowTemplate } from '@/lib/templates/windowTemplate';
import { WallTemplate } from '@/lib/templates/wallTemplate';

// 确保所有模板都已注册
function ensureTemplatesRegistered() {
  const registeredIds = templateRegistry.getAllTemplateIds();
  console.log(`Currently registered templates: ${registeredIds.join(', ')}`);

  // 注册所有模板，无论是否已经注册
  console.log('Registering all templates...');

  // 注册所有模板
  templateRegistry.register(BoxesTemplate);
  templateRegistry.register(ChairTemplate);
  templateRegistry.register(DoorTemplate);
  templateRegistry.register(WindowTemplate);
  templateRegistry.register(WallTemplate);

  // 获取更新后的模板列表
  const updatedIds = templateRegistry.getAllTemplateIds();
  console.log(`After registration, template registry has ${updatedIds.length} templates:`, updatedIds);
}

// GET /api/templates/:id/direct-code - 直接从模板注册表中获取模板代码
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;
    console.log(`GET /api/templates/${templateId}/direct-code - Fetching template code directly from registry`);

    // 确保所有模板都已注册
    ensureTemplatesRegistered();

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
    console.error('Error fetching template code directly from registry:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
