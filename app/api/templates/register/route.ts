import { NextRequest, NextResponse } from 'next/server';
import { scanTemplateFiles, registerAllTemplates } from '@/lib/templates/discovery';
import { templateRegistry } from '@/lib/templates';

// POST /api/templates/register - 强制重新注册所有模板
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/templates/register - Registering all templates');

    // 扫描模板文件
    console.log('Scanning template files...');
    const templateFiles = await scanTemplateFiles();
    console.log('Found template files:', templateFiles);

    // 获取当前注册的模板
    const beforeIds = templateRegistry.getAllTemplateIds();
    console.log('Templates before registration:', beforeIds);

    // 注册所有模板
    const registeredIds = await registerAllTemplates();
    console.log('Registered templates:', registeredIds);

    // 获取注册后的模板
    const afterIds = templateRegistry.getAllTemplateIds();
    console.log('Templates after registration:', afterIds);

    // 返回结果
    return NextResponse.json({
      success: true,
      before: beforeIds,
      registered: registeredIds,
      after: afterIds,
      newTemplates: afterIds.filter(id => !beforeIds.includes(id))
    });
  } catch (error) {
    console.error('Error registering templates:', error);
    return NextResponse.json(
      { error: 'Failed to register templates' },
      { status: 500 }
    );
  }
}

// GET /api/templates/register - 获取当前注册的模板
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/templates/register - Getting registered templates');

    // 获取当前注册的模板
    const templateIds = templateRegistry.getAllTemplateIds();
    console.log('Registered template IDs:', templateIds);

    // 获取模板详情
    const templates = templateRegistry.getAllTemplates().map(template => ({
      id: template.id,
      name: template.name,
      description: template.description
    }));

    // 返回结果
    return NextResponse.json({
      success: true,
      templateIds,
      templates
    });
  } catch (error) {
    console.error('Error getting registered templates:', error);
    return NextResponse.json(
      { error: 'Failed to get registered templates' },
      { status: 500 }
    );
  }
}
