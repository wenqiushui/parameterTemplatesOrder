/**
 * 模板代码调试 API
 *
 * 提供特定模板的代码，用于调试
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
    console.log(`GET /api/templates/debug/${templateId} - Fetching template code for debugging`);

    // 验证模板 ID
    if (!templateId || typeof templateId !== 'string' || templateId.trim() === '') {
      console.error('Invalid template ID');
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    // 构建模板文件路径
    const templatesDir = path.resolve(process.cwd(), 'lib', 'templates');
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

      // 返回原始模板代码，用于调试
      return new NextResponse(code, {
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    } catch (error) {
      console.error(`Error reading template file for ${templateId}:`, error);
      return NextResponse.json(
        { error: `Error reading template file: ${(error as any).message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error fetching template code for debugging:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template code', message: error.message },
      { status: 500 }
    );
  }
}
