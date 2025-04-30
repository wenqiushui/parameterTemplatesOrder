import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { templateRegistry } from '@/lib/templates';
import { ensureAllTemplatesRegistered, getAllRegisteredTemplates } from '@/lib/templates/discovery';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/templates - Fetching templates');

    // 使用新的模板发现和注册系统确保所有模板都已注册
    console.log('Ensuring all templates are registered...');
    const registeredIds = await ensureAllTemplatesRegistered();
    console.log('Registered template IDs:', registeredIds);

    // 获取数据库中的所有模板
    const dbTemplates = await db.template.findMany({
      orderBy: { name: 'asc' }
    });
    console.log('Database templates:', dbTemplates.map(t => t.id));

    // 获取本地注册表中的所有模板
    console.log('Getting templates from registry...');
    const localTemplates = getAllRegisteredTemplates().map(template => {
      console.log(`Processing template: ${template.id}`);
      return {
        id: template.id,
        name: template.name,
        description: template.description,
        parameterSchema: template.getParameterSchema(),
        isExternal: false
      };
    });
    console.log('Local templates:', localTemplates.map(t => t.id));

    // 合并模板列表，优先使用数据库中的模板
    const templates = [
      ...dbTemplates,
      ...localTemplates.filter(lt =>
        !dbTemplates.some(dbt => dbt.id === lt.id)
      )
    ];
    console.log('Combined templates:', templates.map(t => t.id));

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // 验证必要字段
    if (!data.id || !data.name || !data.parameterSchema) {
      return NextResponse.json(
        { error: '缺少必要的字段' },
        { status: 400 }
      );
    }

    // 检查 ID 是否已存在
    const existingTemplate = await db.template.findUnique({
      where: { id: data.id }
    });

    if (existingTemplate) {
      return NextResponse.json(
        { error: '模板 ID 已存在' },
        { status: 409 }
      );
    }

    // 创建新模板
    const template = await db.template.create({
      data: {
        id: data.id,
        name: data.name,
        description: data.description || '',
        isExternal: data.isExternal || false,
        serviceUrl: data.serviceUrl || null,
        parameterSchema: typeof data.parameterSchema === 'string'
          ? data.parameterSchema
          : JSON.stringify(data.parameterSchema)
      }
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
