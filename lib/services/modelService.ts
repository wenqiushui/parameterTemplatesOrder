import { createHash } from 'crypto';
import { db } from '@/lib/db';
import { contentStorage } from '@/lib/storage/contentAddressable';
import { templateRegistry } from '@/lib/templates';

export class ModelService {
  constructor() {}

  // 创建模型实例
  async createModelInstance(templateId, params, userId, name) {
    // 验证模板存在
    const template = await db.template.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // 计算参数哈希
    const paramsStr = JSON.stringify(params, Object.keys(params).sort());
    const paramsHash = createHash('sha256').update(paramsStr).digest('hex');

    // 检查是否已有相同参数的模型实例
    const existingModel = await db.modelInstance.findFirst({
      where: {
        templateId,
        paramsHash
      }
    });

    let contentHash;

    if (existingModel) {
      // 使用现有模型的内容哈希
      contentHash = existingModel.contentHash;
    } else {
      // 生成新的模型实例
      const glbBuffer = await this.generateModelFromTemplate(templateId, params);

      // 存储模型文件
      contentHash = await contentStorage.storeModel(glbBuffer);

      // 记录模型实例
      await db.modelInstance.create({
        data: {
          templateId,
          paramsHash,
          params: paramsStr,
          contentHash
        }
      });
    }

    // 创建用户模型记录
    const model = await db.model.create({
      data: {
        userId,
        templateId,
        name,
        paramsHash,
        params: paramsStr
      }
    });

    return {
      id: model.id,
      name: model.name,
      templateId,
      paramsHash,
      contentHash
    };
  }

  // 根据模板和参数生成模型
  async generateModelFromTemplate(templateId, params) {
    // 获取模板信息
    const template = await db.template.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // 检查模板类型
    if (template.isExternal) {
      // 调用外部 Flask 服务生成模型
      return await this.generateModelFromExternalService(templateId, params);
    } else {
      // 使用本地模板生成模型
      const localTemplate = templateRegistry.get(templateId);
      if (!localTemplate) {
        throw new Error(`Local template ${templateId} not found`);
      }

      return await localTemplate.generate(params);
    }
  }

  // 从外部服务生成模型
  async generateModelFromExternalService(templateId, params) {
    // 获取模板信息
    const template = await db.template.findUnique({
      where: { id: templateId }
    });

    if (!template || !template.isExternal) {
      throw new Error(`External template ${templateId} not found`);
    }

    // 构建请求
    const response = await fetch(`${process.env.FLASK_SERVICE_URL}/generate-model`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FLASK_API_KEY}`
      },
      body: JSON.stringify({
        templateId,
        params
      })
    });

    if (!response.ok) {
      let errorMessage = `Failed to generate model: ${response.status} ${response.statusText}`;

      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // 忽略解析错误
      }

      throw new Error(errorMessage);
    }

    // 获取生成的模型数据
    return Buffer.from(await response.arrayBuffer());
  }

  // 获取模型
  async getModel(modelId) {
    const model = await db.model.findUnique({
      where: { id: modelId }
    });

    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    return {
      id: model.id,
      name: model.name,
      templateId: model.templateId,
      params: JSON.parse(model.params),
      createdAt: model.createdAt
    };
  }

  // 获取模型 GLB 数据
  async getModelGLB(modelId) {
    console.log(`Getting GLB data for model ID: ${modelId}`);

    try {
      const model = await this.getModel(modelId);
      console.log(`Found model: ${model.name}, template: ${model.templateId}`);

      // 获取模型实例
      const modelInstance = await db.modelInstance.findFirst({
        where: {
          templateId: model.templateId,
          paramsHash: model.paramsHash
        }
      });

      if (!modelInstance) {
        console.log(`Model instance not found, generating new instance`);

        // 如果没有找到模型实例，生成一个新的
        const params = model.params;
        const glbBuffer = await this.generateModelFromTemplate(model.templateId, params);

        // 存储模型文件
        const contentHash = await contentStorage.storeModel(glbBuffer);

        // 记录模型实例
        await db.modelInstance.create({
          data: {
            templateId: model.templateId,
            paramsHash: model.paramsHash,
            params: JSON.stringify(params),
            contentHash
          }
        });

        console.log(`Generated and stored new model instance with hash: ${contentHash}`);
        return glbBuffer;
      }

      console.log(`Found model instance with content hash: ${modelInstance.contentHash}`);

      // 从存储中获取 GLB 数据
      const glbBuffer = await contentStorage.getModel(modelInstance.contentHash);

      if (!glbBuffer || glbBuffer.length === 0) {
        console.log(`No GLB data found in storage, regenerating`);

        // 如果存储中没有数据，重新生成
        const params = model.params;
        const newGlbBuffer = await this.generateModelFromTemplate(model.templateId, params);

        // 更新存储
        await contentStorage.storeModel(newGlbBuffer, modelInstance.contentHash);

        console.log(`Regenerated GLB data for content hash: ${modelInstance.contentHash}`);
        return newGlbBuffer;
      }

      console.log(`Retrieved GLB data, size: ${glbBuffer.length} bytes`);
      return glbBuffer;
    } catch (error) {
      console.error(`Error getting model GLB: ${error.message}`);
      throw error;
    }
  }

  // 获取用户的所有模型
  async getUserModels(userId) {
    const models = await db.model.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return models.map(model => ({
      id: model.id,
      name: model.name,
      templateId: model.templateId,
      params: JSON.parse(model.params),
      createdAt: model.createdAt
    }));
  }

  // 获取或生成模型 GLB
  async getOrGenerateModelGLB(templateId, paramsHash, params) {
    // 检查缓存
    const cachedModel = await db.modelCache.findUnique({
      where: { paramsHash }
    });

    if (cachedModel) {
      // 更新最后访问时间
      await db.modelCache.update({
        where: { paramsHash },
        data: { lastAccessed: new Date() }
      });

      // 从存储中获取 GLB 数据
      return await contentStorage.getModel(cachedModel.contentHash);
    }

    // 生成模型
    const glbBuffer = await this.generateModelFromTemplate(templateId, params);

    // 存储模型
    const contentHash = await contentStorage.storeModel(glbBuffer);

    // 更新缓存
    await db.modelCache.upsert({
      where: { paramsHash },
      update: {
        contentHash,
        lastAccessed: new Date()
      },
      create: {
        paramsHash,
        templateId,
        contentHash,
        lastAccessed: new Date()
      }
    });

    return glbBuffer;
  }

  // 清理旧缓存
  async cleanupOldCache(maxAgeHours = 24) {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - maxAgeHours);

    const oldCaches = await db.modelCache.findMany({
      where: {
        lastAccessed: {
          lt: cutoff
        }
      }
    });

    // 删除旧缓存
    for (const cache of oldCaches) {
      try {
        // 检查是否有其他引用
        const referenceCount = await db.modelInstance.count({
          where: { contentHash: cache.contentHash }
        });

        if (referenceCount === 0) {
          // 如果没有其他引用，删除内容
          await contentStorage.removeModel(cache.contentHash);
        }
      } catch (e) {
        console.warn(`Failed to clean up cache: ${e.message}`);
      }
    }

    // 删除数据库记录
    const result = await db.modelCache.deleteMany({
      where: {
        lastAccessed: {
          lt: cutoff
        }
      }
    });

    return result.count;
  }
}
