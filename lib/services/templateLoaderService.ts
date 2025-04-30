import { templateCacheService, TemplateMetadata, CachedTemplateCode } from './templateCacheService';

// 模板加载服务
// 该服务只在客户端使用，负责从服务器获取模板元数据和代码
export class TemplateLoaderService {
  // 加载所有模板元数据
  async loadTemplateMetadata(): Promise<TemplateMetadata[]> {
    try {
      console.log('Fetching template metadata from API...');
      const response = await fetch('/api/templates/metadata');

      if (!response.ok) {
        console.error(`API returned status ${response.status}: ${response.statusText}`);
        throw new Error(`Failed to load template metadata: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Received template metadata:', data);
      return data;
    } catch (error) {
      console.error('Error loading template metadata:', error);
      throw error;
    }
  }

  // 加载特定模板的代码
  async loadTemplateCode(templateId: string, version: string): Promise<CachedTemplateCode> {
    try {
      console.log(`Loading template code for ${templateId} with version ${version}`);

      // 首先尝试从缓存获取
      const cachedCode = await templateCacheService.getTemplateCode(templateId, version);

      if (cachedCode) {
        console.log(`Using cached template code for ${templateId}`);

        // 记录模板使用
        await templateCacheService.recordTemplateUsage(templateId);

        return cachedCode;
      }

      console.log(`No valid cached code found for ${templateId}, fetching from server...`);

      // 从服务器加载模板代码
      console.log(`Loading template code for ${templateId} from server`);

      // 使用 API 路径
      const response = await fetch(`/api/templates/code/${templateId}`);

      // 如果请求失败，抛出错误
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Server returned ${response.status}: ${response.statusText}` }));
        const errorMessage = errorData.error || `Server returned ${response.status}: ${response.statusText}`;
        console.error(`Failed to load template code: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      // 解析响应
      const data = await response.json();

      if (!data.code) {
        throw new Error(`Invalid response from server: no code field`);
      }

      // 创建缓存对象
      const templateCode: CachedTemplateCode = {
        id: templateId,
        templateId: templateId,
        code: data.code,
        version: data.version || version, // 使用服务器返回的版本或传入的版本
        cachedAt: Date.now()
      };

      // 缓存模板代码
      await templateCacheService.cacheTemplateCode(templateCode);

      // 记录模板使用
      await templateCacheService.recordTemplateUsage(templateId);

      console.log(`Template code loaded and cached for ${templateId}`);

      return templateCode;
    } catch (error) {
      console.error(`Error loading template code for ${templateId}:`, error);
      throw error;
    }
  }

  // 根据模板ID和参数生成模型
  async generateModel(templateId: string, parameters: Record<string, any>, metadata: TemplateMetadata): Promise<any> {
    try {
      console.log(`Generating model for template ${templateId} with generation mode ${metadata.generationMode}`);

      // 根据生成模式选择不同的处理方式
      switch (metadata.generationMode) {
        case 'browser':
          // 浏览器端生成
          return await this.generateModelInBrowser(templateId, parameters, metadata.version);

        case 'server':
        case 'external':
          // 服务器端生成或外部服务器生成
          return await this.generateModelFromServer(templateId, parameters);

        default:
          console.warn(`Unsupported generation mode: ${metadata.generationMode}, defaulting to browser mode`);
          // 默认使用浏览器端生成模型
          return await this.generateModelInBrowser(templateId, parameters, metadata.version || '1.0.0');
      }
    } catch (error) {
      console.error(`Error generating model for ${templateId}:`, error);

      // 返回一个错误模型对象，以便 LazyModelPreview 组件能够显示错误信息
      return {
        templateId,
        parameters,
        modelData: 'browser-generated-model',
        error: error.message
      };
    }
  }

  // 在浏览器端生成模型
  private async generateModelInBrowser(templateId: string, parameters: Record<string, any>, version: string): Promise<any> {
    try {
      console.log(`Generating model for ${templateId} in browser with version ${version}`);

      // 导入客户端模板管理器
      const { getTemplateRegistry } = await import('@/lib/templates/registry/templateRegistryFactory');
      const registry = getTemplateRegistry();
      let template;

      // 检查模板是否已加载
      if (registry.has(templateId)) {
        console.log(`Template ${templateId} already loaded in registry, getting instance`);
        template = registry.get(templateId);
      } else {
        console.log(`Template ${templateId} not loaded in registry, loading code`);

        // 加载模板代码
        const templateCode = await this.loadTemplateCode(templateId, version);
        console.log(`Template code loaded successfully:`, templateCode ? 'yes' : 'no');

        // 再次检查模板是否已加载（代码加载可能会触发注册）
        if (registry.has(templateId)) {
          template = registry.get(templateId);
        }
      }

      // 记录生成信息
      console.log(`Generating model for ${templateId} in browser with parameters:`, parameters);

      // 如果找到了模板实例，使用它的createModel方法
      if (template && typeof template.createModel === 'function') {
        console.log(`Using template.createModel for ${templateId}`);

        // 设置模板参数
        template.setParameters(parameters);

        // 返回使用参数化组件的标记
        return {
          templateId,
          parameters,
          modelData: 'browser-generated-model',
          useParametricComponent: true
        };
      } else {
        console.log(`No template instance found for ${templateId}, using parametric component`);

        // 对于浏览器端生成的模型，我们返回一个标准格式的对象
        // 这个对象会被 LazyModelPreview 组件识别并使用对应的参数化组件渲染
        return {
          templateId,
          parameters,
          modelData: 'browser-generated-model',
          useParametricComponent: true
        };
      }
    } catch (error) {
      console.error(`Error in generateModelInBrowser for ${templateId}:`, error);

      // 即使出错，也返回一个有效的模型对象，以便 LazyModelPreview 组件能够显示模型
      console.log(`Returning fallback model data for ${templateId}`);
      return {
        templateId,
        parameters,
        modelData: 'browser-generated-model',
        useParametricComponent: true,
        error: error.message
      };
    }
  }

  // 从服务器获取生成的模型
  private async generateModelFromServer(templateId: string, parameters: Record<string, any>): Promise<any> {
    // 构建查询参数
    const queryParams = new URLSearchParams();

    Object.entries(parameters).forEach(([key, value]) => {
      if (typeof value === 'object') {
        queryParams.append(key, JSON.stringify(value));
      } else {
        queryParams.append(key, String(value));
      }
    });

    // 从服务器获取生成的模型
    console.log(`Generating model for ${templateId} from server with parameters:`, parameters);

    // 生成唯一的时间戳，避免浏览器缓存
    const timestamp = new Date().getTime();
    const randomSuffix = Math.floor(Math.random() * 1000000);

    // 构建模型 URL
    const modelUrl = `/api/templates/${templateId}/generate?${queryParams.toString()}&_t=${timestamp}_${randomSuffix}`;

    try {
      // 先尝试获取模型数据，检查是否是 JSON 响应
      const response = await fetch(modelUrl, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');

      // 如果是 JSON 响应，则获取 JSON 数据
      if (contentType && contentType.includes('application/json')) {
        const jsonResponse = await fetch(modelUrl);
        const data = await jsonResponse.json();

        // 返回 JSON 数据，客户端将根据这些数据生成模型
        return {
          templateId,
          parameters,
          primitiveData: data
        };
      }
    } catch (error) {
      console.warn('Error checking model response type:', error);
      // 忽略错误，继续使用 URL 方式
    }

    // 返回模型 URL，客户端将加载 GLB 文件
    return {
      templateId,
      parameters,
      modelUrl
    };
  }
}

// 创建单例实例
export const templateLoaderService = new TemplateLoaderService();
