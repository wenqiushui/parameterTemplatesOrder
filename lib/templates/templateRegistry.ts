import { BaseTemplate } from './baseTemplate';

// 模板构造函数类型
type TemplateConstructor = new () => BaseTemplate;

// 模板注册表
export class TemplateRegistry {
  private templates: Map<string, TemplateConstructor> = new Map();
  private instances: Map<string, BaseTemplate> = new Map();

  // 注册模板类或实例
  register(templateClassOrInstance: TemplateConstructor | BaseTemplate): void {
    if (typeof templateClassOrInstance === 'function') {
      // 注册模板类
      const templateConstructor = templateClassOrInstance as TemplateConstructor;
      // 创建临时实例以获取 ID
      const template = new templateConstructor();
      this.templates.set(template.id, templateConstructor);
    } else {
      // 注册模板实例
      const template = templateClassOrInstance as BaseTemplate;
      this.instances.set(template.id, template);
    }
  }

  // 注销模板类和实例
  unregister(templateId: string): void {
    this.templates.delete(templateId);
    this.instances.delete(templateId);
  }

  // 获取模板构造函数
  getConstructor(templateId: string): TemplateConstructor | undefined {
    return this.templates.get(templateId);
  }

  // 创建模板实例
  create(templateId: string): BaseTemplate | undefined {
    const constructor = this.templates.get(templateId);
    return constructor ? new constructor() : undefined;
  }

  // 从 JSON 创建模板实例
  createFromJson(json: Record<string, any>): BaseTemplate | undefined {
    const templateId = json.templateId;
    if (!templateId) {
      throw new Error('Missing templateId in JSON');
    }

    const template = this.create(templateId);
    if (!template) {
      throw new Error(`Unknown template type: ${templateId}`);
    }

    template.loadFromJson(json);
    return template;
  }

  // 获取所有模板 ID
  getAllTemplateIds(): string[] {
    // 合并模板类和实例的 ID
    const classIds = Array.from(this.templates.keys());
    const instanceIds = Array.from(this.instances.keys());

    // 使用 Set 去重
    return Array.from(new Set([...classIds, ...instanceIds]));
  }

  // 获取所有模板实例
  getAllTemplates(): BaseTemplate[] {
    return this.getAllTemplateIds().map(id => this.get(id)!).filter(Boolean);
  }

  // 检查模板是否存在
  has(templateId: string): boolean {
    return this.templates.has(templateId) || this.instances.has(templateId);
  }

  // 获取特定模板实例
  get(templateId: string): BaseTemplate | undefined {
    // 首先检查是否有已注册的实例
    if (this.instances.has(templateId)) {
      return this.instances.get(templateId);
    }

    // 如果没有实例，尝试创建一个新实例
    return this.create(templateId);
  }
}

// 创建全局模板注册表实例
// 使用单例模式，确保在服务器端和客户端都能正确工作
// 在 Next.js 中，需要考虑服务器端和客户端的不同环境
const isServer = typeof window === 'undefined';

// 全局实例（在客户端使用）
let globalInstance: TemplateRegistry | null = null;

// 服务器端实例缓存（使用 WeakMap 避免内存泄漏）
// 在服务器端，我们为每个请求创建一个新实例，但在同一个请求中重用同一个实例
const SERVER_INSTANCES = new Map<string, TemplateRegistry>();

// 生成唯一的请求 ID
let requestCounter = 0;
function getRequestId(): string {
  if (isServer) {
    // 在服务器端，为每个请求生成一个唯一 ID
    return `server-${Date.now()}-${requestCounter++}`;
  }
  return 'client';
}

// 当前请求 ID
const currentRequestId = getRequestId();
console.log(`Current request ID: ${currentRequestId}`);

export function getTemplateRegistry(): TemplateRegistry {
  if (isServer) {
    // 服务器端：为每个请求创建一个新实例，但在同一个请求中重用同一个实例
    if (!SERVER_INSTANCES.has(currentRequestId)) {
      const serverInstance = new TemplateRegistry();
      SERVER_INSTANCES.set(currentRequestId, serverInstance);
      console.log(`[Server] Created new TemplateRegistry instance for request ${currentRequestId}`);

      // 清理旧实例（保留最近的 10 个实例）
      const keys = Array.from(SERVER_INSTANCES.keys());
      if (keys.length > 10) {
        const oldestKey = keys[0];
        SERVER_INSTANCES.delete(oldestKey);
        console.log(`[Server] Cleaned up old TemplateRegistry instance for request ${oldestKey}`);
      }
    }

    return SERVER_INSTANCES.get(currentRequestId)!;
  }

  // 客户端：使用全局单例
  if (!globalInstance) {
    globalInstance = new TemplateRegistry();
    console.log('[Client] Created new TemplateRegistry instance');
  }
  return globalInstance;
}

// 导出单例实例
export const templateRegistry = getTemplateRegistry();
