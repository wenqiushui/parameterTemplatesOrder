import { BaseTemplate, TemplateDependencyGraph, ModelGenerationMode } from '../templates/baseTemplate';
import { templateRegistry } from '../templates/templateRegistry';
import { db } from '@/lib/db';

// 模型实例接口
export interface ModelInstance {
  id: string;
  name: string;
  userId: string;
  templateId: string;
  parameters: Record<string, any>;
  dependencyGraph: TemplateDependencyGraph;
  createdAt: Date;
  updatedAt: Date;
}

// 模型服务
export class TemplateModelService {
  // 保存模型实例
  async saveModelInstance(
    templateId: string,
    parameters: Record<string, any>,
    name: string,
    userId: string
  ): Promise<string> {
    try {
      console.log(`Saving model instance: ${name} (template: ${templateId})`);

      // 获取模板
      const template = templateRegistry.get(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // 设置参数
      template.setParameters(parameters);

      // 获取依赖图
      const dependencyGraph = template.getDependencyGraph();

      // 保存到数据库
      const modelInstance = await db.modelInstance.create({
        data: {
          name,
          userId,
          templateId,
          parameters: JSON.stringify(parameters),
          dependencyGraph: JSON.stringify(dependencyGraph),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`Model instance saved with ID: ${modelInstance.id}`);
      return modelInstance.id;
    } catch (error) {
      console.error('Error saving model instance:', error);
      throw error;
    }
  }

  // 加载模型实例
  async loadModelInstance(modelId: string): Promise<{
    templateId: string;
    parameters: Record<string, any>;
    dependencyGraph: TemplateDependencyGraph;
    name: string;
  }> {
    try {
      console.log(`Loading model instance: ${modelId}`);

      // 从数据库加载模型实例
      const modelInstance = await db.modelInstance.findUnique({
        where: { id: modelId }
      });

      if (!modelInstance) {
        throw new Error(`Model instance ${modelId} not found`);
      }

      return {
        templateId: modelInstance.templateId,
        parameters: JSON.parse(modelInstance.parameters),
        dependencyGraph: JSON.parse(modelInstance.dependencyGraph),
        name: modelInstance.name
      };
    } catch (error) {
      console.error('Error loading model instance:', error);
      throw error;
    }
  }

  // 获取用户的所有模型实例
  async getUserModelInstances(userId: string): Promise<ModelInstance[]> {
    try {
      console.log(`Getting model instances for user: ${userId}`);

      const modelInstances = await db.modelInstance.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      return modelInstances.map(instance => ({
        id: instance.id,
        name: instance.name,
        userId: instance.userId,
        templateId: instance.templateId,
        parameters: JSON.parse(instance.parameters),
        dependencyGraph: JSON.parse(instance.dependencyGraph),
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt
      }));
    } catch (error) {
      console.error('Error getting user model instances:', error);
      throw error;
    }
  }

  // 更新模型实例
  async updateModelInstance(
    modelId: string,
    updates: {
      name?: string;
      parameters?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      console.log(`Updating model instance: ${modelId}`);

      // 从数据库加载模型实例
      const modelInstance = await db.modelInstance.findUnique({
        where: { id: modelId }
      });

      if (!modelInstance) {
        throw new Error(`Model instance ${modelId} not found`);
      }

      // 准备更新数据
      const updateData: any = {
        updatedAt: new Date()
      };

      if (updates.name) {
        updateData.name = updates.name;
      }

      if (updates.parameters) {
        // 获取模板
        const template = templateRegistry.get(modelInstance.templateId);
        if (!template) {
          throw new Error(`Template ${modelInstance.templateId} not found`);
        }

        // 设置参数
        template.setParameters(updates.parameters);

        // 获取依赖图
        const dependencyGraph = template.getDependencyGraph();

        updateData.parameters = JSON.stringify(updates.parameters);
        updateData.dependencyGraph = JSON.stringify(dependencyGraph);
      }

      // 更新数据库
      await db.modelInstance.update({
        where: { id: modelId },
        data: updateData
      });

      console.log(`Model instance ${modelId} updated`);
    } catch (error) {
      console.error('Error updating model instance:', error);
      throw error;
    }
  }

  // 删除模型实例
  async deleteModelInstance(modelId: string): Promise<void> {
    try {
      console.log(`Deleting model instance: ${modelId}`);

      // 从数据库删除模型实例
      await db.modelInstance.delete({
        where: { id: modelId }
      });

      console.log(`Model instance ${modelId} deleted`);
    } catch (error) {
      console.error('Error deleting model instance:', error);
      throw error;
    }
  }

  // 获取模型数据
  async getModelData(modelId: string): Promise<{
    templateId: string,
    parameters: Record<string, any>,
    dependencyGraph: TemplateDependencyGraph,
    buffer?: Buffer
  }> {
    try {
      // 加载模型实例
      const modelData = await this.loadModelInstance(modelId);

      // 获取模板
      const template = templateRegistry.get(modelData.templateId);
      if (!template) {
        throw new Error(`Template ${modelData.templateId} not found`);
      }

      // 设置参数
      template.setParameters(modelData.parameters);

      // 根据模板类型选择不同的处理方式
      switch (template.generationMode) {
        case ModelGenerationMode.BROWSER:
          // 简单模板：返回模板实例，让浏览器端生成模型
          return {
            templateId: modelData.templateId,
            parameters: modelData.parameters,
            dependencyGraph: modelData.dependencyGraph
          };

        case ModelGenerationMode.SERVER:
        case ModelGenerationMode.EXTERNAL:
          // 复杂模板或外部服务器模型：在服务器端生成模型
          const buffer = await template.generate();
          return {
            templateId: modelData.templateId,
            parameters: modelData.parameters,
            dependencyGraph: modelData.dependencyGraph,
            buffer
          };

        default:
          throw new Error(`Unsupported generation mode: ${template.generationMode}`);
      }
    } catch (error) {
      console.error('Error getting model data:', error);
      throw error;
    }
  }
}

// 导出模型服务实例
export const templateModelService = new TemplateModelService();
