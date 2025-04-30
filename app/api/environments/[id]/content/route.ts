import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contentStorage } from '@/lib/storage/contentAddressable';

// 获取环境贴图内容
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const environmentId = params.id;
    
    // 查询环境贴图记录
    const environment = await db.environmentMap.findUnique({
      where: { id: environmentId }
    });
    
    if (!environment) {
      return NextResponse.json(
        { error: 'Environment not found' },
        { status: 404 }
      );
    }
    
    // 从存储中获取环境贴图
    const environmentBuffer = await contentStorage.getEnvironmentMap(environment.contentHash);
    
    if (!environmentBuffer) {
      return NextResponse.json(
        { error: 'Environment content not found' },
        { status: 404 }
      );
    }
    
    // 确定内容类型
    let contentType = 'application/octet-stream'; // 默认
    
    // 根据文件格式确定内容类型
    switch (environment.format.toLowerCase()) {
      case 'hdr':
        contentType = 'application/octet-stream';
        break;
      case 'exr':
        contentType = 'application/octet-stream';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
    }
    
    // 返回环境贴图内容
    return new NextResponse(environmentBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Error fetching environment content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch environment content' },
      { status: 500 }
    );
  }
}
