import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { templateRegistry } from '@/lib/templates';
import { registerTemplate } from '@/lib/templates/discovery';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;
    console.log(`GET /api/templates/${templateId} - Fetching template`);

    // 先从数据库中查找
    const dbTemplate = await db.template.findUnique({
      where: { id: templateId }
    });

    if (dbTemplate) {
      console.log(`Found template ${templateId} in database`);
      return NextResponse.json({
        ...dbTemplate,
        parameterSchema: JSON.parse(dbTemplate.parameterSchema)
      });
    }

    // 如果数据库中没有，尝试注册并从本地注册表中查找
    console.log(`Template ${templateId} not found in database, trying to register it`);
    await registerTemplate(templateId);

    // 从注册表中获取模板
    const localTemplate = templateRegistry.get(templateId);
    if (localTemplate) {
      console.log(`Found template ${templateId} in registry after registration`);
      return NextResponse.json({
        id: localTemplate.id,
        name: localTemplate.name,
        description: localTemplate.description,
        parameterSchema: localTemplate.getParameterSchema(),
        isExternal: false
      });
    }

    return NextResponse.json(
      { error: 'Template not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;
    const data = await request.json();

    // 验证必要字段
    if (!data.name || !data.parameterSchema) {
      return NextResponse.json(
        { error: '缺少必要的字段' },
        { status: 400 }
      );
    }

    // 检查模板是否存在
    const existingTemplate = await db.template.findUnique({
      where: { id: templateId }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // 更新模板
    const template = await db.template.update({
      where: { id: templateId },
      data: {
        name: data.name,
        description: data.description || '',
        isExternal: data.isExternal || false,
        serviceUrl: data.serviceUrl || null,
        parameterSchema: typeof data.parameterSchema === 'string'
          ? data.parameterSchema
          : JSON.stringify(data.parameterSchema)
      }
    });

    return NextResponse.json({
      ...template,
      parameterSchema: JSON.parse(template.parameterSchema)
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;

    // 检查模板是否存在
    const existingTemplate = await db.template.findUnique({
      where: { id: templateId }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // 检查是否有依赖此模板的模型
    const dependentModels = await db.model.findMany({
      where: { templateId },
      take: 1
    });

    if (dependentModels.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete template with dependent models' },
        { status: 409 }
      );
    }

    // 删除模板
    await db.template.delete({
      where: { id: templateId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
