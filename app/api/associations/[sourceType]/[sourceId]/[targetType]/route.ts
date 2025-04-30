import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { sourceType: string, sourceId: string, targetType: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { sourceType, sourceId, targetType } = params;
    
    // 处理特定的关联类型
    if (sourceType === 'configs' && targetType === 'materials') {
      // 获取配置的材质应用
      const materialApplications = await db.materialApplication.findMany({
        where: { configId: sourceId },
        include: {
          material: true
        }
      });
      
      // 处理材质数据
      const formattedApplications = materialApplications.map(app => ({
        ...app,
        material: {
          ...app.material,
          baseProperties: JSON.parse(app.material.baseProperties || '{}'),
          maps: JSON.parse(app.material.maps || '{}'),
          mapSettings: JSON.parse(app.material.mapSettings || '{}')
        }
      }));
      
      return NextResponse.json(formattedApplications);
    }
    else if (sourceType === 'textures' && targetType === 'favorites') {
      // 获取用户收藏的贴图
      const favorites = await db.textureFavorite.findMany({
        where: {
          userId: session.user.id
        },
        include: {
          texture: {
            include: {
              tags: true
            }
          }
        }
      });
      
      return NextResponse.json(favorites.map(f => ({
        ...f.texture,
        isFavorite: true
      })));
    }
    else {
      return NextResponse.json(
        { error: 'Invalid association type' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching associations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch associations' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { sourceType: string, sourceId: string, targetType: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { sourceType, sourceId, targetType } = params;
    const data = await request.json();
    
    // 处理特定的关联类型
    if (sourceType === 'configs' && targetType === 'materials') {
      // 创建材质应用
      const { nodeId, materialId } = data;
      
      if (!nodeId || !materialId) {
        return NextResponse.json(
          { error: 'Node ID and Material ID are required' },
          { status: 400 }
        );
      }
      
      // 查询配置
      const config = await db.modelConfig.findUnique({
        where: { id: sourceId }
      });
      
      if (!config) {
        return NextResponse.json(
          { error: 'Configuration not found' },
          { status: 404 }
        );
      }
      
      // 检查权限
      if (config.userId !== session.user.id && session.user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
      
      // 查询材质
      const material = await db.material.findUnique({
        where: { id: materialId }
      });
      
      if (!material) {
        return NextResponse.json(
          { error: 'Material not found' },
          { status: 404 }
        );
      }
      
      // 创建或更新材质应用
      const materialApplication = await db.materialApplication.upsert({
        where: {
          configId_nodeId: {
            configId: sourceId,
            nodeId
          }
        },
        update: {
          materialId,
          updatedAt: new Date()
        },
        create: {
          configId: sourceId,
          nodeId,
          materialId
        },
        include: {
          material: true
        }
      });
      
      // 处理材质数据
      const formattedApplication = {
        ...materialApplication,
        material: {
          ...materialApplication.material,
          baseProperties: JSON.parse(materialApplication.material.baseProperties || '{}'),
          maps: JSON.parse(materialApplication.material.maps || '{}'),
          mapSettings: JSON.parse(materialApplication.material.mapSettings || '{}')
        }
      };
      
      return NextResponse.json(formattedApplication);
    }
    else if (sourceType === 'textures' && targetType === 'favorites') {
      // 添加贴图到收藏
      const textureId = sourceId;
      
      // 查询贴图
      const texture = await db.texture.findUnique({
        where: { id: textureId }
      });
      
      if (!texture) {
        return NextResponse.json(
          { error: 'Texture not found' },
          { status: 404 }
        );
      }
      
      // 添加到收藏
      const favorite = await db.textureFavorite.upsert({
        where: {
          userId_textureId: {
            userId: session.user.id,
            textureId
          }
        },
        update: {},
        create: {
          userId: session.user.id,
          textureId
        }
      });
      
      return NextResponse.json({ success: true, favorite });
    }
    else {
      return NextResponse.json(
        { error: 'Invalid association type' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error creating association:', error);
    return NextResponse.json(
      { error: 'Failed to create association' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sourceType: string, sourceId: string, targetType: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { sourceType, sourceId, targetType } = params;
    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('targetId');
    
    // 处理特定的关联类型
    if (sourceType === 'configs' && targetType === 'materials') {
      // 删除材质应用
      const nodeId = targetId;
      
      if (!nodeId) {
        return NextResponse.json(
          { error: 'Node ID is required' },
          { status: 400 }
        );
      }
      
      // 查询配置
      const config = await db.modelConfig.findUnique({
        where: { id: sourceId }
      });
      
      if (!config) {
        return NextResponse.json(
          { error: 'Configuration not found' },
          { status: 404 }
        );
      }
      
      // 检查权限
      if (config.userId !== session.user.id && session.user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
      
      // 查询材质应用
      const materialApplication = await db.materialApplication.findUnique({
        where: {
          configId_nodeId: {
            configId: sourceId,
            nodeId
          }
        }
      });
      
      if (!materialApplication) {
        return NextResponse.json(
          { error: 'Material application not found' },
          { status: 404 }
        );
      }
      
      // 删除材质应用
      await db.materialApplication.delete({
        where: {
          configId_nodeId: {
            configId: sourceId,
            nodeId
          }
        }
      });
      
      return NextResponse.json({ success: true });
    }
    else if (sourceType === 'textures' && targetType === 'favorites') {
      // 从收藏中删除贴图
      const textureId = sourceId;
      
      // 查询收藏
      const favorite = await db.textureFavorite.findUnique({
        where: {
          userId_textureId: {
            userId: session.user.id,
            textureId
          }
        }
      });
      
      if (!favorite) {
        return NextResponse.json(
          { error: 'Favorite not found' },
          { status: 404 }
        );
      }
      
      // 删除收藏
      await db.textureFavorite.delete({
        where: {
          userId_textureId: {
            userId: session.user.id,
            textureId
          }
        }
      });
      
      return NextResponse.json({ success: true });
    }
    else {
      return NextResponse.json(
        { error: 'Invalid association type' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error deleting association:', error);
    return NextResponse.json(
      { error: 'Failed to delete association' },
      { status: 500 }
    );
  }
}
