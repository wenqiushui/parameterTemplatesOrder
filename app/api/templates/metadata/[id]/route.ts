/**
 * 单个模板元数据 API 端点
 */

import { NextResponse } from 'next/server';
import { getTemplateMetadata } from '@/lib/models/TemplateMetadata';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/templates/metadata/[id]
 * 获取特定模板的元数据
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 从数据库获取模板元数据
    const metadata = await getTemplateMetadata(id);

    if (!metadata) {
      // 尝试从 Prisma 直接获取模板
      const template = await prisma.template.findUnique({
        where: { id }
      });

      if (!template) {
        return NextResponse.json(
          { error: `Template metadata not found for ${id}` },
          { status: 404 }
        );
      }

      // 尝试解析 parameterSchema
      try {
        const parsedSchema = JSON.parse(template.parameterSchema);

        // 构建元数据对象
        const builtMetadata = {
          id: template.id,
          name: template.name,
          description: template.description || '',
          thumbnailUrl: template.previewHash ? `/api/templates/${template.id}/thumbnail` : '',
          generationMode: 'browser',
          category: 'other',
          tags: [],
          version: '1.0.0',
          defaultParameters: {},
          parameterSchema: {},
          ...parsedSchema
        };

        return NextResponse.json(builtMetadata);
      } catch (parseError) {
        console.error(`Error parsing parameter schema for template ${id}:`, parseError);

        // 返回基本元数据
        return NextResponse.json({
          id: template.id,
          name: template.name,
          description: template.description || '',
          thumbnailUrl: template.previewHash ? `/api/templates/${template.id}/thumbnail` : '',
          generationMode: 'browser',
          category: 'other',
          tags: [],
          version: '1.0.0',
          defaultParameters: {},
          parameterSchema: {}
        });
      }
    }

    // 返回模板元数据
    return NextResponse.json(metadata);
  } catch (error) {
    console.error(`Error in GET /api/templates/metadata/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to get template metadata' },
      { status: 500 }
    );
  }
}
