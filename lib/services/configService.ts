import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { db } from '@/lib/db';
import { ModelService } from './modelService';
import { MaterialService } from './materialService';

export class ConfigService {
  constructor(
    private modelService: ModelService,
    private materialService: MaterialService
  ) {}
  
  // 创建配置
  async createConfiguration(modelId, userId, name, materialOverrides = {}) {
    // 验证模型存在
    const model = await this.modelService.getModel(modelId);
    
    // 验证材质存在
    for (const [key, materialId] of Object.entries(materialOverrides)) {
      await this.materialService.getMaterial(materialId);
    }
    
    // 创建配置
    const configId = uuidv4();
    
    await db.modelConfig.create({
      data: {
        id: configId,
        modelId,
        userId,
        name,
        materialOverrides: JSON.stringify(materialOverrides)
      }
    });
    
    return configId;
  }
  
  // 获取配置
  async getConfiguration(configId) {
    const config = await db.modelConfig.findUnique({
      where: { id: configId },
      include: {
        model: true
      }
    });
    
    if (!config) {
      throw new Error(`Configuration ${configId} not found`);
    }
    
    return {
      id: config.id,
      modelId: config.modelId,
      userId: config.userId,
      name: config.name,
      templateId: config.model.templateId,
      params: JSON.parse(config.model.params),
      materialOverrides: JSON.parse(config.materialOverrides),
      createdAt: config.createdAt
    };
  }
  
  // 获取配置的 GLB
  async getConfigurationGLB(configId) {
    const config = await this.getConfiguration(configId);
    
    // 获取基础模型参数
    const baseParams = config.params;
    
    // 应用材质覆盖
    const modifiedParams = {
      ...baseParams,
      materials: {
        ...(baseParams.materials || {}),
        ...config.materialOverrides
      }
    };
    
    // 计算修改后参数的哈希
    const modifiedParamsStr = JSON.stringify(modifiedParams, Object.keys(modifiedParams).sort());
    const modifiedParamsHash = createHash('sha256').update(modifiedParamsStr).digest('hex');
    
    // 使用修改后的参数生成模型
    return await this.modelService.getOrGenerateModelGLB(
      config.templateId,
      modifiedParamsHash,
      modifiedParams
    );
  }
  
  // 更新配置
  async updateConfiguration(configId, updates) {
    const config = await this.getConfiguration(configId);
    
    const updatedConfig = {
      name: updates.name || config.name,
      materialOverrides: updates.materialOverrides || config.materialOverrides
    };
    
    await db.modelConfig.update({
      where: { id: configId },
      data: {
        name: updatedConfig.name,
        materialOverrides: JSON.stringify(updatedConfig.materialOverrides)
      }
    });
    
    return configId;
  }
  
  // 获取用户的所有配置
  async getUserConfigurations(userId) {
    const configs = await db.modelConfig.findMany({
      where: { userId },
      include: {
        model: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return configs.map(config => ({
      id: config.id,
      modelId: config.modelId,
      name: config.name,
      modelName: config.model.name,
      materialOverrides: JSON.parse(config.materialOverrides),
      createdAt: config.createdAt
    }));
  }
  
  // 获取模型的所有配置
  async getModelConfigurations(modelId) {
    const configs = await db.modelConfig.findMany({
      where: { modelId },
      orderBy: { createdAt: 'desc' }
    });
    
    return configs.map(config => ({
      id: config.id,
      userId: config.userId,
      name: config.name,
      materialOverrides: JSON.parse(config.materialOverrides),
      createdAt: config.createdAt
    }));
  }
  
  // 比较多个配置
  async compareConfigurations(configIds) {
    const configs = [];
    
    for (const configId of configIds) {
      const config = await this.getConfiguration(configId);
      configs.push(config);
    }
    
    // 确保所有配置都是同一个模型
    const modelId = configs[0].modelId;
    if (!configs.every(config => config.modelId === modelId)) {
      throw new Error('Cannot compare configurations from different models');
    }
    
    // 获取基础模型参数
    const baseParams = configs[0].params;
    
    // 比较材质差异
    const comparison = {
      baseModel: {
        id: modelId,
        templateId: configs[0].templateId,
        params: baseParams
      },
      configs: configs.map(config => ({
        id: config.id,
        name: config.name,
        materialOverrides: config.materialOverrides,
        // 计算与基础模型的差异
        differences: this.calculateDifferences(baseParams, config.materialOverrides)
      }))
    };
    
    return comparison;
  }
  
  // 计算差异
  calculateDifferences(baseParams, materialOverrides) {
    const differences = {};
    
    // 检查材质覆盖
    if (baseParams.materials && materialOverrides) {
      for (const [key, value] of Object.entries(materialOverrides)) {
        if (baseParams.materials[key] !== value) {
          differences[`materials.${key}`] = {
            from: baseParams.materials[key],
            to: value
          };
        }
      }
    }
    
    return differences;
  }
  
  // 生成配置缩略图
  async generateConfigurationThumbnail(configId) {
    // 这里可以实现服务器端渲染缩略图的逻辑
    // 简化版：返回一个占位符缩略图哈希
    return 'placeholder_thumbnail_hash';
  }
}
