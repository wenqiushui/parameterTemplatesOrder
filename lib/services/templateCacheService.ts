/**
 * 模板缓存服务
 *
 * 负责在浏览器中缓存模板代码和元数据
 * 使用 IndexedDB 存储数据
 */

// 缓存的模板代码接口
export interface CachedTemplateCode {
  templateId: string;
  version: string;
  code: string;
  cachedAt: number; // 缓存时间戳
}

// 模板元数据接口
export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  generationMode: string;
  thumbnailUrl: string;
  parameterSchema: Record<string, any>;
  defaultParameters: Record<string, any>;
  version: string;
  category?: string;
  tags?: string[];
  lastUsed?: number;
  usageCount?: number;
}

// 模板使用记录接口
export interface TemplateUsage {
  id: string;
  lastUsed: number;
  usageCount: number;
}

// 模板缓存服务
export class TemplateCacheService {
  private dbName = 'templateCache';
  private dbVersion = 2; // 增加版本号以支持新的存储
  private templateStore = 'templates';
  private usageStore = 'templateUsage';
  private db: IDBDatabase | null = null;

  // 初始化数据库
  async init(): Promise<void> {
    // 检查是否在浏览器环境
    if (typeof window === 'undefined') {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error('Error opening template cache database:', event);
        reject(new Error('Failed to open template cache database'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        // 创建模板存储
        if (!db.objectStoreNames.contains(this.templateStore)) {
          const store = db.createObjectStore(this.templateStore, { keyPath: 'id' });
          store.createIndex('version', 'version', { unique: false });
          store.createIndex('cachedAt', 'cachedAt', { unique: false });
        }

        // 创建模板使用记录存储
        if (!db.objectStoreNames.contains(this.usageStore)) {
          const store = db.createObjectStore(this.usageStore, { keyPath: 'id' });
          store.createIndex('lastUsed', 'lastUsed', { unique: false });
          store.createIndex('usageCount', 'usageCount', { unique: false });
        }
      };
    });
  }

  // 获取缓存的模板代码
  async getTemplateCode(templateId: string, version?: string): Promise<CachedTemplateCode | null> {
    // 检查是否在浏览器环境
    if (typeof window === 'undefined' || !this.db) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.templateStore, 'readonly');
      const store = transaction.objectStore(this.templateStore);
      const request = store.get(templateId);

      request.onerror = (event) => {
        console.error('Error getting template code from cache:', event);
        reject(new Error('Failed to get template code from cache'));
      };

      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result as CachedTemplateCode;
        if (result) {
          // 如果提供了版本号，检查版本是否匹配
          if (version && result.version !== version) {
            console.log(`Template ${templateId} version mismatch: cached=${result.version}, requested=${version}`);
            resolve(null);
          } else {
            console.log(`Found cached template code for ${templateId}`);
            resolve(result);
          }
        } else {
          console.log(`No cached template code found for ${templateId}`);
          resolve(null);
        }
      };
    });
  }

  // 缓存模板代码
  async cacheTemplateCode(templateCode: CachedTemplateCode): Promise<void> {
    // 检查是否在浏览器环境
    if (typeof window === 'undefined' || !this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.templateStore, 'readwrite');
      const store = transaction.objectStore(this.templateStore);

      // 添加缓存时间戳
      const codeWithTimestamp = {
        ...templateCode,
        cachedAt: Date.now()
      };

      const request = store.put(codeWithTimestamp);

      request.onerror = (event) => {
        console.error('Error caching template code:', event);
        reject(new Error('Failed to cache template code'));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  // 检查模板是否需要更新
  async needsUpdate(templateId: string, version: string): Promise<boolean> {
    // 检查是否在浏览器环境
    if (typeof window === 'undefined' || !this.db) {
      return true;
    }

    const cachedTemplate = await this.getTemplateCode(templateId, version);

    // 如果没有缓存，需要更新
    if (!cachedTemplate) {
      return true;
    }

    // 检查缓存是否过期（7天）
    const cacheAge = Date.now() - cachedTemplate.cachedAt;
    const cacheMaxAge = 7 * 24 * 60 * 60 * 1000; // 7天

    return cacheAge > cacheMaxAge;
  }

  // 清除过期缓存
  async clearExpiredCache(maxAgeInDays = 30): Promise<void> {
    // 检查是否在浏览器环境
    if (typeof window === 'undefined' || !this.db) {
      return;
    }

    const maxAge = maxAgeInDays * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - maxAge;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.templateStore, 'readwrite');
      const store = transaction.objectStore(this.templateStore);
      const index = store.index('cachedAt');

      // 使用IDBKeyRange.upperBound获取所有过期的缓存
      const range = IDBKeyRange.upperBound(cutoffTime);
      const request = index.openCursor(range);

      request.onerror = (event) => {
        console.error('Error clearing expired cache:', event);
        reject(new Error('Failed to clear expired cache'));
      };

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;

        if (cursor) {
          // 删除过期的缓存
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }

  // 记录模板使用
  async recordTemplateUsage(templateId: string): Promise<void> {
    // 检查是否在浏览器环境
    if (typeof window === 'undefined' || !this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.usageStore, 'readwrite');
      const store = transaction.objectStore(this.usageStore);

      // 先获取当前使用记录
      const getRequest = store.get(templateId);

      getRequest.onerror = (event) => {
        console.error('Error getting template usage:', event);
        reject(new Error('Failed to get template usage'));
      };

      getRequest.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result as TemplateUsage;

        // 更新或创建使用记录
        const usage: TemplateUsage = result || {
          id: templateId,
          lastUsed: 0,
          usageCount: 0
        };

        // 更新使用时间和次数
        usage.lastUsed = Date.now();
        usage.usageCount += 1;

        // 保存使用记录
        const putRequest = store.put(usage);

        putRequest.onerror = (event) => {
          console.error('Error recording template usage:', event);
          reject(new Error('Failed to record template usage'));
        };

        putRequest.onsuccess = () => {
          resolve();
        };
      };
    });
  }

  // 获取模板使用记录
  async getTemplateUsage(templateId: string): Promise<TemplateUsage | null> {
    // 检查是否在浏览器环境
    if (typeof window === 'undefined' || !this.db) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.usageStore, 'readonly');
      const store = transaction.objectStore(this.usageStore);
      const request = store.get(templateId);

      request.onerror = (event) => {
        console.error('Error getting template usage:', event);
        reject(new Error('Failed to get template usage'));
      };

      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result as TemplateUsage;
        resolve(result || null);
      };
    });
  }

  // 获取最常用的模板ID
  async getMostUsedTemplateIds(limit: number = 10): Promise<string[]> {
    // 检查是否在浏览器环境
    if (typeof window === 'undefined' || !this.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.usageStore, 'readonly');
      const store = transaction.objectStore(this.usageStore);
      const request = store.index('usageCount').openCursor(null, 'prev'); // 降序

      const templateIds: string[] = [];

      request.onerror = (event) => {
        console.error('Error getting most used templates:', event);
        reject(new Error('Failed to get most used templates'));
      };

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;

        if (cursor && templateIds.length < limit) {
          const usage = cursor.value as TemplateUsage;
          templateIds.push(usage.id);
          cursor.continue();
        } else {
          resolve(templateIds);
        }
      };
    });
  }

  // 获取最近使用的模板ID
  async getRecentlyUsedTemplateIds(limit: number = 10): Promise<string[]> {
    // 检查是否在浏览器环境
    if (typeof window === 'undefined' || !this.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.usageStore, 'readonly');
      const store = transaction.objectStore(this.usageStore);
      const request = store.index('lastUsed').openCursor(null, 'prev'); // 降序

      const templateIds: string[] = [];

      request.onerror = (event) => {
        console.error('Error getting recently used templates:', event);
        reject(new Error('Failed to get recently used templates'));
      };

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;

        if (cursor && templateIds.length < limit) {
          const usage = cursor.value as TemplateUsage;
          templateIds.push(usage.id);
          cursor.continue();
        } else {
          resolve(templateIds);
        }
      };
    });
  }

  // 获取缓存的模板ID
  async getCachedTemplateIds(): Promise<string[]> {
    // 检查是否在浏览器环境
    if (typeof window === 'undefined' || !this.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.templateStore, 'readonly');
      const store = transaction.objectStore(this.templateStore);
      const request = store.getAllKeys();

      request.onerror = (event) => {
        console.error('Error getting cached template IDs:', event);
        reject(new Error('Failed to get cached template IDs'));
      };

      request.onsuccess = (event) => {
        const keys = (event.target as IDBRequest).result as string[];
        resolve(keys);
      };
    });
  }

  // 删除缓存的模板代码
  async removeTemplateCode(templateId: string): Promise<void> {
    // 检查是否在浏览器环境
    if (typeof window === 'undefined' || !this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.templateStore, 'readwrite');
      const store = transaction.objectStore(this.templateStore);
      const request = store.delete(templateId);

      request.onerror = (event) => {
        console.error(`Error removing template code for ${templateId}:`, event);
        reject(new Error(`Failed to remove template code for ${templateId}`));
      };

      request.onsuccess = () => {
        console.log(`Successfully removed template code for ${templateId}`);
        resolve();
      };
    });
  }
}

// 创建单例实例
export const templateCacheService = new TemplateCacheService();

// 初始化缓存服务
if (typeof window !== 'undefined') {
  // 在浏览器环境中初始化
  templateCacheService.init().catch(error => {
    console.error('Failed to initialize template cache service:', error);
  });

  // 每天清理一次过期缓存
  setInterval(() => {
    templateCacheService.clearExpiredCache().catch(error => {
      console.error('Failed to clear expired cache:', error);
    });
  }, 24 * 60 * 60 * 1000);
}
