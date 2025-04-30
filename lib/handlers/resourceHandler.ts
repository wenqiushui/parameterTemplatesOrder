import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { contentStorage } from '@/lib/storage/contentAddressable';
import { createHash } from 'crypto';
import sharp from 'sharp';

// 资源处理器
export async function handleResourceRequest(
  request: NextRequest,
  resourceType: string,
  resourceId?: string
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const method = request.method;

    // 根据请求方法和资源类型处理请求
    switch (method) {
      case 'GET':
        return resourceId
          ? await getResourceById(resourceType, resourceId, session)
          : await getResourceList(resourceType, request, session);
      case 'POST':
        return await createResource(resourceType, request, session);
      case 'PUT':
        return resourceId
          ? await updateResource(resourceType, resourceId, request, session)
          : NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
      case 'DELETE':
        return resourceId
          ? await deleteResource(resourceType, resourceId, session)
          : NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
      default:
        return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }
  } catch (error) {
    console.error(`Error handling ${resourceType} request:`, error);
    return NextResponse.json(
      { error: `Failed to handle ${resourceType} request: ${error.message}` },
      { status: 500 }
    );
  }
}

// 获取资源列表
async function getResourceList(resourceType, request, session) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search');
  const category = searchParams.get('category');
  const type = searchParams.get('type');
  const tags = searchParams.get('tags');
  const isPreset = searchParams.get('isPreset');

  // 构建查询条件
  const where: any = {};

  // 添加通用筛选条件
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (category) {
    where.category = category;
  }

  if (type) {
    where.type = type;
  }

  if (isPreset !== null && isPreset !== undefined) {
    where.isPreset = isPreset === 'true';
  }

  // 根据资源类型添加特定筛选条件
  switch (resourceType) {
    case 'materials':
      // 材质特定筛选条件
      break;
    case 'textures':
      // 贴图特定筛选条件
      where.OR = [
        { createdBy: session.user.id },
        { isPublic: true }
      ];

      if (tags) {
        const tagNames = tags.split(',');
        where.tags = {
          some: {
            name: {
              in: tagNames
            }
          }
        };
      }
      break;
    case 'environments':
      // 环境贴图特定筛选条件
      where.OR = [
        { createdBy: session.user.id },
        { isPreset: true }
      ];
      break;
    case 'scenes':
      // 场景特定筛选条件
      where.createdBy = session.user.id;
      break;
    case 'configs':
      // 配置特定筛选条件
      where.userId = session.user.id;
      break;
    default:
      return NextResponse.json({ error: 'Invalid resource type' }, { status: 400 });
  }

  // 获取资源总数
  // 将资源类型映射到 Prisma 模型名称
  const modelMap = {
    'materials': 'material',
    'textures': 'texture',
    'environments': 'environmentMap',
    'scenes': 'scene',
    'configs': 'modelConfig'
  };

  const modelName = modelMap[resourceType];
  if (!modelName) {
    return NextResponse.json({ error: 'Invalid resource type' }, { status: 400 });
  }

  const total = await db[modelName].count({ where });

  // 查询资源列表
  const resources = await db[modelName].findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {
      updatedAt: 'desc'
    },
    include: getIncludeOptions(resourceType)
  });

  // 处理特定资源类型的后处理
  const processedResources = await processResources(resourceType, resources, session);

  return NextResponse.json({
    resources: processedResources,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  });
}

// 获取资源详情
async function getResourceById(resourceType, resourceId, session) {
  // 查询资源
  // 将资源类型映射到 Prisma 模型名称
  const modelMap = {
    'materials': 'material',
    'textures': 'texture',
    'environments': 'environmentMap',
    'scenes': 'scene',
    'configs': 'modelConfig'
  };

  const modelName = modelMap[resourceType];
  if (!modelName) {
    return NextResponse.json({ error: 'Invalid resource type' }, { status: 400 });
  }

  const resource = await db[modelName].findUnique({
    where: { id: resourceId },
    include: getIncludeOptions(resourceType)
  });

  if (!resource) {
    return NextResponse.json(
      { error: `${resourceType.slice(0, -1)} not found` },
      { status: 404 }
    );
  }

  // 处理特定资源类型的后处理
  const processedResource = await processResource(resourceType, resource, session);

  return NextResponse.json(processedResource);
}

// 创建资源
async function createResource(resourceType, request, session) {
  const contentType = request.headers.get('content-type') || '';

  // 处理 JSON 请求
  if (contentType.includes('application/json')) {
    const data = await request.json();

    // 验证必要字段
    if (!data.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // 添加创建者信息
    data.createdBy = session.user.id;

    // 处理特定资源类型的预处理
    const processedData = await preprocessResourceData(resourceType, data);

    // 创建资源
    // 将资源类型映射到 Prisma 模型名称
  const modelMap = {
    'materials': 'material',
    'textures': 'texture',
    'environments': 'environmentMap',
    'scenes': 'scene',
    'configs': 'modelConfig'
  };

  const modelName = modelMap[resourceType];
  if (!modelName) {
    return NextResponse.json({ error: 'Invalid resource type' }, { status: 400 });
  }

  const resource = await db[modelName].create({
      data: processedData,
      include: getIncludeOptions(resourceType)
    });

    // 处理特定资源类型的后处理
    const processedResource = await processResource(resourceType, resource, session);

    return NextResponse.json(processedResource);
  }
  // 处理表单请求
  else if (contentType.includes('multipart/form-data')) {
    // 处理文件上传
    return handleFileUpload(resourceType, request, session);
  }
  else {
    return NextResponse.json(
      { error: 'Unsupported content type' },
      { status: 415 }
    );
  }
}

// 更新资源
async function updateResource(resourceType, resourceId, request, session) {
  // 查询资源
  // 将资源类型映射到 Prisma 模型名称
  const modelMap = {
    'materials': 'material',
    'textures': 'texture',
    'environments': 'environmentMap',
    'scenes': 'scene',
    'configs': 'modelConfig'
  };

  const modelName = modelMap[resourceType];
  if (!modelName) {
    return NextResponse.json({ error: 'Invalid resource type' }, { status: 400 });
  }

  const resource = await db[modelName].findUnique({
    where: { id: resourceId }
  });

  if (!resource) {
    return NextResponse.json(
      { error: `${resourceType.slice(0, -1)} not found` },
      { status: 404 }
    );
  }

  // 检查权限
  if (resource.createdBy !== session.user.id && session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Permission denied' },
      { status: 403 }
    );
  }

  const data = await request.json();

  // 处理特定资源类型的预处理
  const processedData = await preprocessResourceData(resourceType, data, resource);

  // 更新资源
  const updatedResource = await db[modelName].update({
    where: { id: resourceId },
    data: processedData,
    include: getIncludeOptions(resourceType)
  });

  // 处理特定资源类型的后处理
  const processedResource = await processResource(resourceType, updatedResource, session);

  return NextResponse.json(processedResource);
}

// 删除资源
async function deleteResource(resourceType, resourceId, session) {
  // 查询资源
  // 将资源类型映射到 Prisma 模型名称
  const modelMap = {
    'materials': 'material',
    'textures': 'texture',
    'environments': 'environmentMap',
    'scenes': 'scene',
    'configs': 'modelConfig'
  };

  const modelName = modelMap[resourceType];
  if (!modelName) {
    return NextResponse.json({ error: 'Invalid resource type' }, { status: 400 });
  }

  const resource = await db[modelName].findUnique({
    where: { id: resourceId }
  });

  if (!resource) {
    return NextResponse.json(
      { error: `${resourceType.slice(0, -1)} not found` },
      { status: 404 }
    );
  }

  // 检查权限
  if (resource.createdBy !== session.user.id && session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Permission denied' },
      { status: 403 }
    );
  }

  // 检查资源是否被引用
  const isReferenced = await checkResourceReferences(resourceType, resourceId);

  if (isReferenced) {
    return NextResponse.json(
      { error: `${resourceType.slice(0, -1)} is in use and cannot be deleted` },
      { status: 400 }
    );
  }

  // 删除资源
  await db[modelName].delete({
    where: { id: resourceId }
  });

  return NextResponse.json({ success: true });
}

// 获取包含选项
function getIncludeOptions(resourceType) {
  switch (resourceType) {
    case 'materials':
      return {};
    case 'textures':
      return { tags: true };
    case 'environments':
      return {};
    case 'scenes':
      return { environmentMap: true };
    case 'configs':
      return { model: true, scene: true };
    default:
      return {};
  }
}

// 处理资源列表
async function processResources(resourceType, resources, session) {
  switch (resourceType) {
    case 'materials':
      return resources.map(material => ({
        ...material,
        baseProperties: JSON.parse(material.baseProperties || '{}'),
        maps: JSON.parse(material.maps || '{}'),
        mapSettings: JSON.parse(material.mapSettings || '{}')
      }));
    case 'textures':
      // 查询用户收藏的贴图
      const favorites = await db.textureFavorite.findMany({
        where: {
          userId: session.user.id,
          textureId: {
            in: resources.map(t => t.id)
          }
        }
      });

      const favoriteIds = new Set(favorites.map(f => f.textureId));

      return resources.map(texture => ({
        ...texture,
        isFavorite: favoriteIds.has(texture.id)
      }));
    case 'environments':
      return resources;
    case 'scenes':
      return resources;
    case 'configs':
      return resources;
    default:
      return resources;
  }
}

// 处理单个资源
async function processResource(resourceType, resource, session) {
  switch (resourceType) {
    case 'materials':
      return {
        ...resource,
        baseProperties: JSON.parse(resource.baseProperties || '{}'),
        maps: JSON.parse(resource.maps || '{}'),
        mapSettings: JSON.parse(resource.mapSettings || '{}')
      };
    case 'textures':
      // 查询用户是否收藏了该贴图
      const favorite = await db.textureFavorite.findUnique({
        where: {
          userId_textureId: {
            userId: session.user.id,
            textureId: resource.id
          }
        }
      });

      return {
        ...resource,
        isFavorite: !!favorite
      };
    case 'environments':
      return resource;
    case 'scenes':
      return resource;
    case 'configs':
      return resource;
    default:
      return resource;
  }
}

// 预处理资源数据
async function preprocessResourceData(resourceType, data, existingResource = null) {
  switch (resourceType) {
    case 'materials':
      return {
        ...data,
        baseProperties: JSON.stringify(data.baseProperties || {}),
        maps: JSON.stringify(data.maps || {}),
        mapSettings: JSON.stringify(data.mapSettings || {})
      };
    case 'textures':
      // 处理标签
      let tagsConnect;
      if (data.tags) {
        const tagNames = Array.isArray(data.tags)
          ? data.tags
          : data.tags.split(',').map(tag => tag.trim()).filter(Boolean);

        tagsConnect = {
          tags: {
            set: [], // 先清空现有标签
            connectOrCreate: tagNames.map(tagName => ({
              where: { name: tagName },
              create: { name: tagName }
            }))
          }
        };
      }

      return {
        ...data,
        ...tagsConnect
      };
    case 'environments':
      return data;
    case 'scenes':
      return data;
    case 'configs':
      return data;
    default:
      return data;
  }
}

// 处理文件上传
async function handleFileUpload(resourceType, request, session) {
  try {
    // 获取表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // 读取文件内容
    const buffer = Buffer.from(await file.arrayBuffer());

    // 计算内容哈希
    const contentHash = createHash('sha256').update(buffer).digest('hex');

    switch (resourceType) {
      case 'textures':
        return handleTextureUpload(formData, file, buffer, contentHash, session);
      case 'environments':
        return handleEnvironmentUpload(formData, file, buffer, contentHash, session);
      default:
        return NextResponse.json(
          { error: 'File upload not supported for this resource type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error(`Error handling file upload:`, error);
    return NextResponse.json(
      { error: `Failed to upload file: ${error.message}` },
      { status: 500 }
    );
  }
}

// 处理贴图上传
async function handleTextureUpload(formData, file, buffer, contentHash, session) {
  const name = formData.get('name') as string || file.name;
  const description = formData.get('description') as string || '';
  const type = formData.get('type') as string || 'baseColor';
  const category = formData.get('category') as string || 'generic';
  const isPublic = formData.get('isPublic') === 'true';
  const tagsString = formData.get('tags') as string || '';

  // 检查是否已存在相同内容的贴图
  const existingTexture = await db.texture.findFirst({
    where: { contentHash }
  });

  if (existingTexture) {
    return NextResponse.json(existingTexture);
  }

  // 获取图像信息
  const imageInfo = await sharp(buffer).metadata();

  // 创建缩略图
  const thumbnail = await sharp(buffer)
    .resize(200, 200, { fit: 'inside' })
    .toBuffer();

  // 存储缩略图
  const thumbnailHash = await contentStorage.storeThumbnail(thumbnail);

  // 存储原始贴图
  await contentStorage.storeTexture(buffer, contentHash);

  // 处理标签
  const tagNames = tagsString.split(',').map(tag => tag.trim()).filter(Boolean);

  // 创建贴图记录
  const texture = await db.texture.create({
    data: {
      contentHash,
      name,
      description,
      type,
      category,
      width: imageInfo.width || 0,
      height: imageInfo.height || 0,
      format: imageInfo.format || 'unknown',
      size: buffer.length,
      thumbnail: thumbnailHash,
      isPublic,
      createdBy: session.user.id,
      tags: {
        connectOrCreate: tagNames.map(tagName => ({
          where: { name: tagName },
          create: { name: tagName }
        }))
      }
    },
    include: {
      tags: true
    }
  });

  return NextResponse.json(texture);
}

// 处理环境贴图上传
async function handleEnvironmentUpload(formData, file, buffer, contentHash, session) {
  const name = formData.get('name') as string || file.name;
  const description = formData.get('description') as string || '';
  const intensity = parseFloat(formData.get('intensity') as string || '1.0');

  // 检查是否已存在相同内容的环境贴图
  const existingEnvironment = await db.environmentMap.findFirst({
    where: { contentHash }
  });

  if (existingEnvironment) {
    return NextResponse.json(existingEnvironment);
  }

  // 确定文件格式
  let format = 'hdr';
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.exr')) {
    format = 'exr';
  } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
    format = 'jpg';
  } else if (fileName.endsWith('.png')) {
    format = 'png';
  }

  // 确定分辨率
  let resolution = 0;
  try {
    if (format === 'jpg' || format === 'png') {
      const metadata = await sharp(buffer).metadata();
      resolution = Math.max(metadata.width || 0, metadata.height || 0);
    } else {
      // 对于 HDR 和 EXR 格式，我们无法直接使用 sharp 获取分辨率
      // 这里简单地设置一个默认值，实际应用中可能需要使用专门的库
      resolution = 2048;
    }
  } catch (e) {
    console.error('Error determining resolution:', e);
    resolution = 1024; // 默认分辨率
  }

  // 创建缩略图
  // 注意：对于 HDR 和 EXR 格式，需要先转换为 LDR 格式
  // 这里简化处理，实际应用中可能需要使用专门的库
  let thumbnailBuffer;
  try {
    if (format === 'jpg' || format === 'png') {
      thumbnailBuffer = await sharp(buffer)
        .resize(200, 200, { fit: 'inside' })
        .toBuffer();
    } else {
      // 对于 HDR 和 EXR 格式，使用默认缩略图
      // 实际应用中应该转换 HDR 到 LDR 然后创建缩略图
      thumbnailBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAABZ0RVh0Q3JlYXRpb24gVGltZQAwNi8wNS8wNE2+5nEAAAAldEVYdFNvZnR3YXJlAE1hY3JvbWVkaWEgRmlyZXdvcmtzIE1YIDIwMDSHdqzPAAAB90lEQVR4nO3BMQEAAADCoPVP7WsIoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeAMBPAAB42uStQAAAABJRU5ErkJggg==',
        'base64'
      );
    }
  } catch (e) {
    console.error('Error creating thumbnail:', e);
    // 使用默认缩略图
    thumbnailBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAABZ0RVh0Q3JlYXRpb24gVGltZQAwNi8wNS8wNE2+5nEAAAAldEVYdFNvZnR3YXJlAE1hY3JvbWVkaWEgRmlyZXdvcmtzIE1YIDIwMDSHdqzPAAAB90lEQVR4nO3BMQEAAADCoPVP7WsIoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeAMBPAAB42uStQAAAABJRU5ErkJggg==',
      'base64'
    );
  }

  // 存储缩略图
  const thumbnailHash = await contentStorage.storeThumbnail(thumbnailBuffer);

  // 存储原始环境贴图
  await contentStorage.storeEnvironmentMap(buffer, contentHash);

  // 创建环境贴图记录
  const environment = await db.environmentMap.create({
    data: {
      contentHash,
      name,
      description,
      thumbnail: thumbnailHash,
      format,
      type: 'equirectangular',
      intensity,
      size: buffer.length,
      resolution,
      isPreset: false,
      createdBy: session.user.id
    }
  });

  return NextResponse.json(environment);
}

// 检查资源引用
async function checkResourceReferences(resourceType, resourceId) {
  switch (resourceType) {
    case 'materials':
      const materialApplications = await db.materialApplication.findMany({
        where: { materialId: resourceId }
      });
      return materialApplications.length > 0;
    case 'textures':
      // 检查贴图是否被材质引用
      // 这里需要实现检查贴图是否被材质引用的逻辑
      // 由于材质的 maps 字段是 JSON 字符串，需要解析后检查
      // 这里简化处理，假设贴图没有被引用
      return false;
    case 'environments':
      const scenes = await db.scene.findMany({
        where: { environmentMapId: resourceId }
      });
      return scenes.length > 0;
    case 'scenes':
      const configs = await db.modelConfig.findMany({
        where: { sceneId: resourceId }
      });
      return configs.length > 0;
    default:
      return false;
  }
}
