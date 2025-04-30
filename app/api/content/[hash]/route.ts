import { NextRequest, NextResponse } from 'next/server';
import { contentStorage } from '@/lib/storage/contentAddressable';

export async function GET(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  try {
    const contentHash = params.hash;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'texture';

    let content;
    let contentType = 'application/octet-stream';

    // 根据类型获取内容
    try {
      switch (type) {
        case 'texture':
          content = await contentStorage.getTexture(contentHash);
          contentType = determineTextureContentType(content);
          break;
        case 'environment':
          content = await contentStorage.getEnvironmentMap(contentHash);
          break;
        case 'cubemap':
          content = await contentStorage.getCubemap(contentHash);
          break;
        case 'thumbnail':
          content = await contentStorage.getThumbnail(contentHash);
          contentType = 'image/jpeg';
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid content type' },
            { status: 400 }
          );
      }
    } catch (error) {
      console.error(`Error getting content: ${error.message}`);
      return NextResponse.json(
        { error: `Content not found: ${error.message}` },
        { status: 404 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // 返回内容
    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

// 确定贴图内容类型
function determineTextureContentType(buffer) {
  if (!buffer || buffer.length < 2) {
    return 'image/jpeg';
  }

  const header = buffer.slice(0, 2).toString('hex');

  if (header === 'ffd8') {
    return 'image/jpeg';
  } else if (header === '8950') {
    return 'image/png';
  } else if (header === '4749') {
    return 'image/gif';
  } else if (header === '424d') {
    return 'image/bmp';
  } else if (header === '5249') {
    return 'image/webp';
  }

  return 'image/jpeg';
}
