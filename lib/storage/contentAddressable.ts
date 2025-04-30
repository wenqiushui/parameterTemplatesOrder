import { join } from 'path';
import { mkdir, writeFile, readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { createHash } from 'crypto';

export class ContentAddressableStorage {
  constructor(private basePath: string) {
    // 立即创建目录，不等待异步操作
    this.ensureDirectoriesSync();
  }

  private ensureDirectoriesSync() {
    const dirs = ['textures', 'models', 'materials', 'thumbnails', 'environments', 'cubemaps'];
    for (const dir of dirs) {
      const dirPath = join(this.basePath, dir);
      if (!existsSync(dirPath)) {
        const subDirsPath = join(dirPath, '00');
        require('fs').mkdirSync(subDirsPath, { recursive: true });
      }
    }
  }

  private async ensureDirectories() {
    const dirs = ['textures', 'models', 'materials', 'thumbnails', 'environments', 'cubemaps'];
    for (const dir of dirs) {
      const dirPath = join(this.basePath, dir);
      if (!existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
      }
    }
  }

  // 存储纹理
  async storeTexture(buffer: Buffer, metadata?: any): Promise<string> {
    return this.storeContent(buffer, 'textures');
  }

  // 存储模型
  async storeModel(buffer: Buffer, metadata?: any): Promise<string> {
    return this.storeContent(buffer, 'models');
  }

  // 存储材质
  async storeMaterial(buffer: Buffer, metadata?: any): Promise<string> {
    return this.storeContent(buffer, 'materials');
  }

  // 存储缩略图
  async storeThumbnail(buffer: Buffer, metadata?: any): Promise<string> {
    return this.storeContent(buffer, 'thumbnails');
  }

  // 通用存储方法
  private async storeContent(buffer: Buffer, type: string): Promise<string> {
    // 计算内容哈希
    const hash = createHash('sha256').update(buffer).digest('hex');

    // 创建两级目录结构
    const dirPath = join(this.basePath, type, hash.substring(0, 2));
    const filePath = join(dirPath, hash);

    // 检查文件是否已存在
    if (!existsSync(filePath)) {
      await mkdir(dirPath, { recursive: true });
      await writeFile(filePath, buffer);
    }

    return hash;
  }

  // 获取内容
  async getContent(hash: string, type: string): Promise<Buffer> {
    const filePath = join(this.basePath, type, hash.substring(0, 2), hash);

    if (!existsSync(filePath)) {
      throw new Error(`Content ${hash} of type ${type} not found`);
    }

    return await readFile(filePath);
  }

  // 获取纹理
  async getTexture(hash: string): Promise<Buffer> {
    return this.getContent(hash, 'textures');
  }

  // 获取模型
  async getModel(hash: string): Promise<Buffer> {
    return this.getContent(hash, 'models');
  }

  // 获取材质
  async getMaterial(hash: string): Promise<Buffer> {
    return this.getContent(hash, 'materials');
  }

  // 获取缩略图
  async getThumbnail(hash: string): Promise<Buffer> {
    return this.getContent(hash, 'thumbnails');
  }

  // 存储环境贴图
  async storeEnvironmentMap(buffer: Buffer, metadata?: any): Promise<string> {
    return this.storeContent(buffer, 'environments');
  }

  // 获取环境贴图
  async getEnvironmentMap(hash: string): Promise<Buffer> {
    return this.getContent(hash, 'environments');
  }

  // 存储立方体贴图
  async storeCubemap(buffer: Buffer, metadata?: any): Promise<string> {
    return this.storeContent(buffer, 'cubemaps');
  }

  // 获取立方体贴图
  async getCubemap(hash: string): Promise<Buffer> {
    return this.getContent(hash, 'cubemaps');
  }

  // 删除内容
  async removeContent(hash: string, type: string): Promise<void> {
    const filePath = join(this.basePath, type, hash.substring(0, 2), hash);

    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  }

  // 删除纹理
  async removeTexture(hash: string): Promise<void> {
    return this.removeContent(hash, 'textures');
  }

  // 删除模型
  async removeModel(hash: string): Promise<void> {
    return this.removeContent(hash, 'models');
  }

  // 删除材质
  async removeMaterial(hash: string): Promise<void> {
    return this.removeContent(hash, 'materials');
  }

  // 删除缩略图
  async removeThumbnail(hash: string): Promise<void> {
    return this.removeContent(hash, 'thumbnails');
  }

  // 删除环境贴图
  async removeEnvironmentMap(hash: string): Promise<void> {
    return this.removeContent(hash, 'environments');
  }

  // 删除立方体贴图
  async removeCubemap(hash: string): Promise<void> {
    return this.removeContent(hash, 'cubemaps');
  }
}

// 创建单例实例
export const contentStorage = new ContentAddressableStorage(
  join(process.cwd(), 'public', 'storage')
);
