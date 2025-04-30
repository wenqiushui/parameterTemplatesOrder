import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { contentStorage } from '@/lib/storage/contentAddressable';

export class MaterialService {
  constructor() {}
  
  // 创建材质
  async createMaterial(name, type, properties, thumbnailBuffer = null) {
    const materialId = uuidv4();
    
    // 存储缩略图（如果有）
    let thumbnailHash = null;
    if (thumbnailBuffer) {
      thumbnailHash = await contentStorage.storeThumbnail(thumbnailBuffer);
      
      // 记录资源
      await db.resource.create({
        data: {
          hash: thumbnailHash,
          type: 'thumbnail',
          name: `${name}_thumbnail`,
          metadata: JSON.stringify({ materialId })
        }
      });
    }
    
    // 存储材质记录
    const material = await db.material.create({
      data: {
        id: materialId,
        name,
        type,
        properties: JSON.stringify(properties),
        thumbnailHash
      }
    });
    
    return material.id;
  }
  
  // 获取材质
  async getMaterial(materialId) {
    const material = await db.material.findUnique({
      where: { id: materialId }
    });
    
    if (!material) {
      throw new Error(`Material ${materialId} not found`);
    }
    
    return {
      id: material.id,
      name: material.name,
      type: material.type,
      properties: JSON.parse(material.properties),
      thumbnailHash: material.thumbnailHash,
      createdAt: material.createdAt
    };
  }
  
  // 更新材质
  async updateMaterial(materialId, updates) {
    const material = await this.getMaterial(materialId);
    
    const updatedMaterial = {
      name: updates.name || material.name,
      type: updates.type || material.type,
      properties: updates.properties || material.properties
    };
    
    // 更新缩略图（如果有）
    let thumbnailHash = material.thumbnailHash;
    if (updates.thumbnailBuffer) {
      // 删除旧缩略图
      if (thumbnailHash) {
        await this.removeResourceReference(thumbnailHash, 'thumbnail');
      }
      
      // 存储新缩略图
      thumbnailHash = await contentStorage.storeThumbnail(updates.thumbnailBuffer);
      
      // 记录资源
      await db.resource.create({
        data: {
          hash: thumbnailHash,
          type: 'thumbnail',
          name: `${updatedMaterial.name}_thumbnail`,
          metadata: JSON.stringify({ materialId })
        }
      });
    }
    
    // 更新材质记录
    await db.material.update({
      where: { id: materialId },
      data: {
        name: updatedMaterial.name,
        type: updatedMaterial.type,
        properties: JSON.stringify(updatedMaterial.properties),
        thumbnailHash
      }
    });
    
    return materialId;
  }
  
  // 删除材质
  async deleteMaterial(materialId) {
    const material = await this.getMaterial(materialId);
    
    // 删除缩略图
    if (material.thumbnailHash) {
      await this.removeResourceReference(material.thumbnailHash, 'thumbnail');
    }
    
    // 删除材质记录
    await db.material.delete({
      where: { id: materialId }
    });
    
    return materialId;
  }
  
  // 获取所有材质
  async getAllMaterials() {
    const materials = await db.material.findMany({
      orderBy: { name: 'asc' }
    });
    
    return materials.map(material => ({
      id: material.id,
      name: material.name,
      type: material.type,
      properties: JSON.parse(material.properties),
      thumbnailHash: material.thumbnailHash,
      createdAt: material.createdAt
    }));
  }
  
  // 按类型获取材质
  async getMaterialsByType(type) {
    const materials = await db.material.findMany({
      where: { type },
      orderBy: { name: 'asc' }
    });
    
    return materials.map(material => ({
      id: material.id,
      name: material.name,
      type: material.type,
      properties: JSON.parse(material.properties),
      thumbnailHash: material.thumbnailHash,
      createdAt: material.createdAt
    }));
  }
  
  // 获取材质缩略图
  async getMaterialThumbnail(materialId) {
    const material = await this.getMaterial(materialId);
    
    if (!material.thumbnailHash) {
      throw new Error(`Material ${materialId} has no thumbnail`);
    }
    
    return await contentStorage.getThumbnail(material.thumbnailHash);
  }
  
  // 上传贴图
  async uploadTexture(buffer, name, category, subcategory, userId = null) {
    // 存储贴图
    const hash = await contentStorage.storeTexture(buffer);
    
    // 记录资源
    await db.resource.create({
      data: {
        hash,
        type: 'texture',
        name,
        metadata: JSON.stringify({ category, subcategory }),
        userId
      }
    });
    
    return hash;
  }
  
  // 获取贴图
  async getTexture(hash) {
    const resource = await db.resource.findUnique({
      where: { hash }
    });
    
    if (!resource || resource.type !== 'texture') {
      throw new Error(`Texture ${hash} not found`);
    }
    
    return await contentStorage.getTexture(hash);
  }
  
  // 获取贴图元数据
  async getTextureMetadata(hash) {
    const resource = await db.resource.findUnique({
      where: { hash }
    });
    
    if (!resource || resource.type !== 'texture') {
      throw new Error(`Texture ${hash} not found`);
    }
    
    return {
      hash: resource.hash,
      name: resource.name,
      metadata: JSON.parse(resource.metadata || '{}'),
      createdAt: resource.createdAt
    };
  }
  
  // 按类别获取贴图
  async getTexturesByCategory(category, subcategory = null) {
    const resources = await db.resource.findMany({
      where: {
        type: 'texture',
        metadata: {
          contains: subcategory 
            ? `"category":"${category}","subcategory":"${subcategory}"` 
            : `"category":"${category}"`
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return resources.map(resource => ({
      hash: resource.hash,
      name: resource.name,
      metadata: JSON.parse(resource.metadata || '{}'),
      createdAt: resource.createdAt
    }));
  }
  
  // 删除资源引用
  async removeResourceReference(hash, type) {
    // 减少引用计数
    const result = await db.resource.update({
      where: { hash },
      data: {
        referenceCount: {
          decrement: 1
        }
      }
    });
    
    // 获取更新后的引用计数
    const resource = await db.resource.findUnique({
      where: { hash }
    });
    
    // 如果引用计数为零，删除资源
    if (resource && resource.referenceCount <= 0) {
      // 删除文件
      switch (type) {
        case 'texture':
          await contentStorage.removeTexture(hash);
          break;
        case 'thumbnail':
          await contentStorage.removeThumbnail(hash);
          break;
        default:
          break;
      }
      
      // 删除数据库记录
      await db.resource.delete({
        where: { hash }
      });
    }
    
    return hash;
  }
}
