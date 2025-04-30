import { NextRequest, NextResponse } from 'next/server';
import { templateService } from '@/lib/services/templateService';
import fs from 'fs';
import path from 'path';

// GET /api/templates/:id/thumbnail - 获取模板缩略图
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;

    // 获取模板元数据
    const metadata = await templateService.getTemplateMetadata(templateId);

    if (!metadata) {
      return new NextResponse('Template not found', { status: 404 });
    }

    // 获取模板缩略图路径
    const thumbnailPath = await templateService.getTemplateThumbnailPath(templateId, metadata.version);

    // 如果有缩略图路径并且文件存在
    if (thumbnailPath && fs.existsSync(thumbnailPath)) {
      const thumbnailBuffer = fs.readFileSync(thumbnailPath);

      return new NextResponse(thumbnailBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400', // 缓存24小时
        },
      });
    }

    // 尝试从文件系统读取缩略图
    const publicThumbnailPath = path.join(process.cwd(), 'public', 'thumbnails', `${templateId}.png`);

    // 检查文件是否存在
    if (fs.existsSync(publicThumbnailPath)) {
      const thumbnailBuffer = fs.readFileSync(publicThumbnailPath);

      return new NextResponse(thumbnailBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400', // 缓存24小时
        },
      });
    }

    // 如果没有特定的缩略图，返回默认缩略图
    const fallbackThumbnailPath = path.join(process.cwd(), 'public', 'thumbnails', 'default.png');

    if (fs.existsSync(fallbackThumbnailPath)) {
      const defaultThumbnailBuffer = fs.readFileSync(fallbackThumbnailPath);

      return new NextResponse(defaultThumbnailBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400', // 缓存24小时
        },
      });
    }

    // 如果连默认缩略图都没有，返回404
    return new NextResponse('Thumbnail not found', { status: 404 });
  } catch (error: any) {
    console.error('Error fetching template thumbnail:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
