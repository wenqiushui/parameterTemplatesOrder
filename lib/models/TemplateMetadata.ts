/**
 * 模板元数据数据库模型
 */

import { PrismaClient } from '@prisma/client';

// 创建 Prisma 客户端实例
const prisma = new PrismaClient();

export interface TemplateMetadataRecord {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  generationMode: string;
  category: string;
  tags: string[];
  version: string;
  defaultParameters: Record<string, any>;
  parameterSchema: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 初始化模板元数据表
 *
 * 注意：使用 Prisma 时，表结构已经在 schema.prisma 中定义
 * 这个函数主要用于确保 Template 表中有必要的字段
 */
export async function initTemplateMetadataTable() {
  try {
    // 使用 Prisma，表结构已经在 schema.prisma 中定义
    // 这里只需要检查表是否可以访问
    await prisma.template.findFirst();
    console.log('Template table is accessible');
    return true;
  } catch (error) {
    console.error('Error accessing Template table:', error);
    return false;
  }
}

/**
 * 保存模板元数据到数据库
 */
export async function saveTemplateMetadata(metadata: Omit<TemplateMetadataRecord, 'createdAt' | 'updatedAt'>) {
  try {
    const {
      id, name, description, thumbnailUrl, generationMode,
      category, tags, version, defaultParameters, parameterSchema
    } = metadata;

    // 检查模板是否已存在
    const existingTemplate = await prisma.template.findUnique({
      where: { id }
    });

    if (existingTemplate) {
      // 更新现有模板
      await prisma.template.update({
        where: { id },
        data: {
          name,
          description,
          previewHash: thumbnailUrl.split('/').pop(), // 提取哈希值
          isExternal: generationMode === 'external',
          // 将 JSON 对象转换为字符串存储
          parameterSchema: JSON.stringify({
            schema: parameterSchema,
            defaultParameters,
            generationMode,
            category,
            tags,
            version
          })
        }
      });

      console.log(`Updated template metadata for ${id}`);
    } else {
      // 插入新模板
      await prisma.template.create({
        data: {
          id,
          name,
          description,
          previewHash: thumbnailUrl.split('/').pop(), // 提取哈希值
          isExternal: generationMode === 'external',
          // 将 JSON 对象转换为字符串存储
          parameterSchema: JSON.stringify({
            schema: parameterSchema,
            defaultParameters,
            generationMode,
            category,
            tags,
            version
          })
        }
      });

      console.log(`Inserted template metadata for ${id}`);
    }

    return true;
  } catch (error) {
    console.error(`Error saving template metadata for ${metadata.id}:`, error);
    return false;
  }
}

/**
 * 获取所有模板元数据
 */
export async function getAllTemplateMetadata(): Promise<TemplateMetadataRecord[]> {
  try {
    const templates = await prisma.template.findMany({
      orderBy: [
        { name: 'asc' }
      ]
    });

    // 转换数据格式
    return templates.map(template => {
      // 解析 parameterSchema 字符串为 JSON 对象
      const parsedSchema = JSON.parse(template.parameterSchema);

      return {
        id: template.id,
        name: template.name,
        description: template.description || '',
        thumbnailUrl: template.previewHash ? `/api/templates/${template.id}/thumbnail` : '',
        generationMode: parsedSchema.generationMode || 'browser',
        category: parsedSchema.category || 'other',
        tags: parsedSchema.tags || [],
        version: parsedSchema.version || '1.0.0',
        defaultParameters: parsedSchema.defaultParameters || {},
        parameterSchema: parsedSchema.schema || {},
        createdAt: template.createdAt,
        updatedAt: new Date() // Template 模型中可能没有 updatedAt 字段
      };
    });
  } catch (error) {
    console.error('Error getting all template metadata:', error);
    return [];
  }
}

/**
 * 获取特定模板的元数据
 */
export async function getTemplateMetadata(id: string): Promise<TemplateMetadataRecord | null> {
  try {
    const template = await prisma.template.findUnique({
      where: { id }
    });

    if (!template) {
      return null;
    }

    // 解析 parameterSchema 字符串为 JSON 对象
    const parsedSchema = JSON.parse(template.parameterSchema);

    // 转换数据格式
    return {
      id: template.id,
      name: template.name,
      description: template.description || '',
      thumbnailUrl: template.previewHash ? `/api/templates/${template.id}/thumbnail` : '',
      generationMode: parsedSchema.generationMode || 'browser',
      category: parsedSchema.category || 'other',
      tags: parsedSchema.tags || [],
      version: parsedSchema.version || '1.0.0',
      defaultParameters: parsedSchema.defaultParameters || {},
      parameterSchema: parsedSchema.schema || {},
      createdAt: template.createdAt,
      updatedAt: new Date() // Template 模型中可能没有 updatedAt 字段
    };
  } catch (error) {
    console.error(`Error getting template metadata for ${id}:`, error);
    return null;
  }
}

/**
 * 删除模板元数据
 */
export async function deleteTemplateMetadata(id: string): Promise<boolean> {
  try {
    await prisma.template.delete({
      where: { id }
    });

    console.log(`Deleted template metadata for ${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting template metadata for ${id}:`, error);
    return false;
  }
}
