import { TemplateMetadata, ITemplateRegistry } from './templateRegistryInterface';

// 假设有一个数据库服务 dbService 提供模板元数据和代码的读取
// import dbService from '@/lib/services/dbService';

export class ServerTemplateManager implements ITemplateRegistry {
  private templateMetadata: Map<string, TemplateMetadata> = new Map();

  constructor() {}

  /**
   * 初始化模板管理器，只从数据库加载模板元数据
   */
  async initialize(): Promise<string[]> {
    try {
      // 从数据库获取所有模板元数据
      const metadataList: TemplateMetadata[] = await dbService.getAllTemplateMetadata();
      metadataList.forEach(meta => {
        this.templateMetadata.set(meta.id, meta);
      });
      return Array.from(this.templateMetadata.keys());
    } catch (error) {
      console.error('[ServerTemplateManager] Error initializing from DB:', error);
      return [];
    }
  }

  /**
   * 获取模板元数据列表
   */
  getAllTemplateMetadata(): TemplateMetadata[] {
    return Array.from(this.templateMetadata.values());
  }

  /**
   * 获取单个模板元数据
   */
  getTemplateMetadata(id: string): TemplateMetadata | undefined {
    return this.templateMetadata.get(id);
  }

  /**
   * 获取模板代码（页面选中时调用）
   * @param id 模板ID
   */
  async getTemplateCode(id: string): Promise<string | null> {
    try {
      // 从数据库获取模板代码
      const code = await dbService.getTemplateCode(id);
      if (!code) {
        console.warn(`[ServerTemplateManager] No code found for template ${id}`);
        return null;
      }
      return code;
    } catch (error) {
      console.error(`[ServerTemplateManager] Error getting code for template ${id}:`, error);
      return null;
    }
  }

  // 兼容 ITemplateRegistry 接口
  register(): void {}
  async get(): Promise<undefined> { return undefined; }
  getAllTemplateIds(): string[] { return Array.from(this.templateMetadata.keys()); }
  getAllTemplates(): any[] { return []; }
  async createFromJson(): Promise<undefined> { return undefined; }
  has(): boolean { return false; }
  unregister(): boolean { return false; }
  clear(): void { this.templateMetadata.clear(); }
}

// 尝试直接导入已知的模板
// 已废弃：硬编码导入 BoxesTemplate、ChairTemplate、DoorTemplate 等模板的代码已移除，统一通过模板扫描自动注册
