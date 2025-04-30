/**
 * 模板代码 API
 *
 * 提供特定模板的代码
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getTemplateMetadata } from '@/lib/models/TemplateMetadata';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;
    console.log(`GET /api/templates/code/${templateId} - Fetching template code`);

    // 验证模板 ID
    if (!templateId || typeof templateId !== 'string' || templateId.trim() === '') {
      console.error('Invalid template ID');
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    // 从数据库获取模板元数据
    let metadata = await getTemplateMetadata(templateId);

    // 如果没有找到元数据，尝试直接从 Prisma 获取
    if (!metadata) {
      console.log(`Template metadata not found for ${templateId}, trying direct Prisma query`);

      try {
        const template = await prisma.template.findUnique({
          where: { id: templateId }
        });

        if (template) {
          try {
            // 解析参数架构
            const paramSchema = JSON.parse(template.parameterSchema);

            // 构建元数据
            metadata = {
              id: template.id,
              name: template.name,
              description: template.description || '',
              thumbnailUrl: template.previewHash ? `/api/templates/${template.id}/thumbnail` : '',
              generationMode: paramSchema.generationMode || 'browser',
              category: paramSchema.category || 'other',
              tags: paramSchema.tags || [],
              version: paramSchema.version || '1.0.0',
              defaultParameters: paramSchema.defaultParameters || {},
              parameterSchema: paramSchema.schema || {},
              createdAt: template.createdAt,
              updatedAt: new Date()
            };

            console.log(`Built metadata for ${templateId} from Prisma`);
          } catch (error) {
            console.error(`Error parsing parameter schema for ${templateId}:`, error);
            return NextResponse.json(
              { error: `Error parsing parameter schema for ${templateId}` },
              { status: 500 }
            );
          }
        }
      } catch (prismaError) {
        console.error(`Error querying Prisma for template ${templateId}:`, prismaError);
        return NextResponse.json(
          { error: `Database error: ${(prismaError as Error).message}` },
          { status: 500 }
        );
      }
    }

    // 如果仍然没有找到元数据，返回 404
    if (!metadata) {
      console.error(`Template metadata not found for ${templateId}`);
      return NextResponse.json(
        { error: `Template ${templateId} not found` },
        { status: 404 }
      );
    }

    // 构建模板文件路径
    const templatesDir = path.resolve(process.cwd(), 'lib', 'templates', 'definitions');
    const fileName = templateId.charAt(0).toUpperCase() + templateId.slice(1) + 'Template.ts';
    const filePath = path.join(templatesDir, fileName);

    console.log(`Reading template code from: ${filePath}`);

    try {
      // 检查文件是否存在
      try {
        await fs.access(filePath);
      } catch (accessError) {
        console.error(`Template file not found: ${filePath}`, accessError);
        return NextResponse.json(
          { error: `Template file not found for ${templateId}` },
          { status: 404 }
        );
      }

      // 读取模板文件
      let code;
      try {
        code = await fs.readFile(filePath, 'utf-8');
      } catch (readError) {
        console.error(`Error reading template file: ${filePath}`, readError);
        return NextResponse.json(
          { error: `Error reading template file: ${(readError as Error).message}` },
          { status: 500 }
        );
      }

      if (!code) {
        console.error(`Empty code file for template ${templateId}`);
        return NextResponse.json(
          { error: `Empty code file for template ${templateId}` },
          { status: 500 }
        );
      }

      console.log(`Returning code for template ${templateId} (${code.length} bytes)`);

      // 返回模板代码和版本
      // 添加导出语句，确保客户端可以找到模板类
      const className = templateId.charAt(0).toUpperCase() + templateId.slice(1) + 'Template';

      // 处理模板代码，移除 import 语句和接口定义
      let processedCode = code.replace(/import\s+.*?from\s+['"].*?['"];?/g, '');

      // 移除接口定义，因为我们会在预定义接口中提供
      processedCode = processedCode.replace(/export\s+interface\s+\w+\s+extends\s+TemplateParameters\s*\{[\s\S]*?\}/g, '');

      // 替换 export 语句
      processedCode = processedCode.replace(/export\s+default\s+(\w+);?/g, 'exports.default = $1;');
      processedCode = processedCode.replace(/export\s+class\s+(\w+)/g, 'class $1');
      processedCode = processedCode.replace(/export\s+interface\s+(\w+)/g, 'interface $1');
      processedCode = processedCode.replace(/export\s+type\s+(\w+)/g, 'type $1');

      // 添加导出语句
      if (!processedCode.includes(`exports.${className}`)) {
        processedCode += `\nexports.${className} = ${className};`;
      }

      // 添加默认导出
      if (!processedCode.includes('exports.default')) {
        processedCode += `\nexports.default = ${className};`;
      }

      // 添加完整的预定义接口
      const preDefinedInterfaces = `
        // 预定义接口和类型
        class TemplateParameters {}

        // 特定模板参数接口
        class ChairParameters extends TemplateParameters {
          constructor() {
            super();
            this.seatWidth = 0.5;
            this.seatDepth = 0.5;
            this.seatHeight = 0.45;
            this.backHeight = 0.8;
            this.legThickness = 0.04;
          }
          seatWidth;
          seatDepth;
          seatHeight;
          backHeight;
          legThickness;
        }

        class BoxesParameters extends TemplateParameters {
          constructor() {
            super();
            this.width = 1;
            this.height = 1;
            this.depth = 1;
            this.segments = 1;
          }
          width;
          height;
          depth;
          segments;
        }

        class DoorParameters extends TemplateParameters {
          constructor() {
            super();
            this.width = 0.8;
            this.height = 2.0;
            this.thickness = 0.05;
            this.color = '#8B4513';
          }
          width;
          height;
          thickness;
          color;
        }

        class WindowParameters extends TemplateParameters {
          constructor() {
            super();
            this.width = 0.6;
            this.height = 0.6;
            this.thickness = 0.02;
            this.color = '#87CEFA';
          }
          width;
          height;
          thickness;
          color;
        }

        class WallParameters extends TemplateParameters {
          constructor() {
            super();
            this.width = 5.0;
            this.height = 3.0;
            this.thickness = 0.2;
            this.hasDoor = true;
            this.hasWindow = true;
            this.color = '#E8E8E8';
          }
          width;
          height;
          thickness;
          color;
          hasDoor;
          hasWindow;
        }
      `;

      // 完整的处理后代码
      const finalCode = preDefinedInterfaces + processedCode;

      // 检查代码是否有效
      if (!finalCode || finalCode.trim() === '') {
        console.error(`Empty or invalid code for template ${templateId}`);
        return NextResponse.json(
          { error: `Empty or invalid code for template ${templateId}` },
          { status: 500 }
        );
      }

      // 设置正确的 Content-Type 头
      return NextResponse.json(
        {
          code: finalCode,
          version: metadata.version
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error(`Error reading template file for ${templateId}:`, error);

      // 检查是否是文件不存在错误
      if ((error as any).code === 'ENOENT') {
        return NextResponse.json(
          { error: `Template file not found for ${templateId}` },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: `Error reading template file: ${(error as any).message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error fetching template code:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template code', message: error.message },
      { status: 500 }
    );
  }
}
