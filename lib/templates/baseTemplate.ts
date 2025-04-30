import * as THREE from 'three';

// 模型生成方式枚举
export enum ModelGenerationMode {
  BROWSER = 'browser',    // 浏览器端生成
  SERVER = 'server',      // 服务器端生成
  EXTERNAL = 'external'   // 外部服务器生成
}

// 外部服务器配置接口
export interface ExternalServerConfig {
  url: string;            // 外部服务器URL
  apiKey?: string;        // API密钥（可选）
  timeout?: number;       // 请求超时时间（毫秒）
  headers?: Record<string, string>; // 自定义请求头
}

// 参数模式项接口
export interface ParameterSchemaItem {
  type: string;
  required?: boolean;
  min?: number;
  max?: number;
  default?: any;
  description?: string;
  options?: Array<{ value: any; label: string }>;
}

// 模板参数接口
export interface TemplateParameters {
  [key: string]: any;
}

// 位置接口
export interface Vector3Data {
  x: number;
  y: number;
  z: number;
}

// 实例数据接口
export interface InstanceData {
  parameters: Record<string, any>;
  position: Vector3Data;
  rotation: Vector3Data;
  scale: Vector3Data;
}

// 模板依赖项接口
export interface TemplateDependency {
  templateId: string;
  parameters: Record<string, any>;
  position?: Vector3Data;
  rotation?: Vector3Data;
  scale?: Vector3Data;
  instances?: number;
  instanceData?: InstanceData[];
}

// 模板依赖图接口
export interface TemplateDependencyGraph {
  templateId: string;
  dependencies: TemplateDependency[];
}

// 模板基础类
export abstract class BaseTemplate<T extends TemplateParameters = TemplateParameters> {
  // 模板标识符
  abstract readonly id: string;

  // 模板名称
  abstract readonly name: string;

  // 模板描述
  abstract readonly description: string;

  // 模型生成方式
  readonly generationMode: ModelGenerationMode = ModelGenerationMode.BROWSER;

  // 外部服务器配置（如果使用外部服务器）
  readonly externalServerConfig?: ExternalServerConfig;

  // 参数模式定义
  abstract readonly parameterSchema: Record<keyof T, ParameterSchemaItem>;

  // 默认参数值
  abstract readonly defaultParameters: T;

  // 当前参数值
  protected _parameters: T;

  // 依赖项缓存
  private _dependenciesCache: TemplateDependency[] | null = null;

  constructor() {
    // 初始化参数为默认值
    this._parameters = { ...this.defaultParameters };
  }

  // 获取模板依赖项
  getDependencies(): TemplateDependency[] {
    // 如果已经计算过依赖项，直接返回缓存
    if (this._dependenciesCache !== null) {
      return this._dependenciesCache;
    }

    // 默认没有依赖项，子类可以重写此方法
    this._dependenciesCache = [];
    return this._dependenciesCache;
  }

  // 获取模板依赖关系图
  getDependencyGraph(): TemplateDependencyGraph {
    const graph: TemplateDependencyGraph = {
      templateId: this.id,
      dependencies: this.getDependencies().map(dep => ({
        templateId: dep.templateId,
        parameters: dep.parameters,
        position: dep.position || { x: 0, y: 0, z: 0 },
        rotation: dep.rotation || { x: 0, y: 0, z: 0 },
        scale: dep.scale || { x: 1, y: 1, z: 1 },
        instances: dep.instances || 1,
        instanceData: dep.instanceData || []
      }))
    };

    return graph;
  }

  // 判断是否是本地模板（可以在浏览器中执行）
  isLocalTemplate(): boolean {
    // 所有用 JavaScript 代码创建的模板，以及依赖的模板也是用 JavaScript 代码创建的模板，
    // 即不依赖外部服务器生成三维模型的模板，都可以在浏览器端执行

    // 如果是浏览器端生成，则是本地模板
    if (this.generationMode === ModelGenerationMode.BROWSER) {
      return true;
    }

    // 如果是外部服务器生成，则不是本地模板
    if (this.generationMode === ModelGenerationMode.EXTERNAL) {
      return false;
    }

    // 如果是服务器端生成，但实际上可以在浏览器中执行，则是本地模板
    // 例如，如果模板只依赖于 Three.js 创建几何体，则可以在浏览器中执行
    if (this.generationMode === ModelGenerationMode.SERVER) {
      // 检查依赖项
      const dependencies = this.getDependencies();

      // 如果没有依赖项，检查是否有 createModel 方法
      if (dependencies.length === 0) {
        return typeof this.createModel === 'function';
      }

      // 如果有依赖项，检查所有依赖项是否都是本地模板
      // 注意：这里需要避免循环依赖
      // 在实际实现中，应该使用依赖分析服务来检查
      return true;
    }

    return false;
  }

  // 获取当前参数
  get parameters(): T {
    return { ...this._parameters };
  }

  // 设置参数
  setParameters(params: Partial<T>): void {
    // 合并参数，保留未指定的现有值
    this._parameters = { ...this._parameters, ...params };
    // 验证参数
    this.validateParameters();
  }

  // 重置参数为默认值
  resetParameters(): void {
    this._parameters = { ...this.defaultParameters };
  }

  // 验证参数
  validateParameters(): void {
    const schema = this.parameterSchema;

    for (const [key, schemaItem] of Object.entries(schema)) {
      const value = this._parameters[key as keyof T];

      // 检查必填参数
      if (schemaItem.required && (value === undefined || value === null)) {
        throw new Error(`Missing required parameter: ${String(key)}`);
      }

      // 检查类型
      if (value !== undefined && schemaItem.type && typeof value !== schemaItem.type) {
        throw new Error(`Invalid type for parameter ${String(key)}: expected ${schemaItem.type}`);
      }

      // 检查范围
      if (typeof value === 'number') {
        if (schemaItem.min !== undefined && value < schemaItem.min) {
          throw new Error(`Parameter ${String(key)} below minimum: ${schemaItem.min}`);
        }

        if (schemaItem.max !== undefined && value > schemaItem.max) {
          throw new Error(`Parameter ${String(key)} above maximum: ${schemaItem.max}`);
        }
      }
    }
  }

  // 序列化为 JSON
  toJson(): Record<string, any> {
    return {
      templateId: this.id,
      parameters: { ...this._parameters },
      dependencyGraph: this.getDependencyGraph()
    };
  }

  // 从 JSON 加载参数
  loadFromJson(json: Record<string, any>): void {
    if (json.templateId !== this.id) {
      throw new Error(`Template ID mismatch: expected ${this.id}, got ${json.templateId}`);
    }

    const params = json.parameters || {};
    this.setParameters(params as Partial<T>);
  }

  // 获取参数模式
  getParameterSchema(): Record<string, ParameterSchemaItem> {
    return this.parameterSchema as Record<string, ParameterSchemaItem>;
  }

  // 获取默认参数
  getDefaultParameters(): T {
    return { ...this.defaultParameters };
  }

  // 创建模型（抽象方法，子类必须实现）
  abstract createModel(parameters?: T): Promise<THREE.Object3D>;

  // 直接添加到预览窗口
  async addToPreviewWindow(scene: THREE.Scene, parameters?: T): Promise<THREE.Object3D> {
    // 如果提供了参数，使用这些参数
    if (parameters) {
      this.setParameters(parameters);
    }

    // 创建模型
    const model = await this.createModel(this._parameters);

    // 添加到场景
    scene.add(model);

    return model;
  }

  // 从JSON创建模型
  async createModelFromJson(json: any): Promise<THREE.Object3D> {
    // 加载参数
    this.loadFromJson(json);

    // 创建模型
    return this.createModel(this._parameters);
  }

  // 生成GLB数据
  async generate(): Promise<Buffer> {
    // 创建场景
    const scene = new THREE.Scene();

    // 创建模型并添加到场景
    await this.addToPreviewWindow(scene);

    // 添加默认灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 导出为GLB
    return this.exportSceneToGLB(scene);
  }

  // 导出场景为GLB
  protected async exportSceneToGLB(scene: THREE.Scene): Promise<Buffer> {
    // 检查是否在服务器端
    if (typeof window === 'undefined') {
      throw new Error('exportSceneToGLB is not supported on server side');
    }

    // 在浏览器端，使用GLTFExporter
    return new Promise((resolve, reject) => {
      // 动态导入GLTFExporter
      import('three/examples/jsm/exporters/GLTFExporter').then(module => {
        const exporter = new module.GLTFExporter();

        exporter.parse(
          scene,
          (gltf) => {
            // 转换为Buffer
            const buffer = Buffer.from(gltf as ArrayBuffer);
            resolve(buffer);
          },
          (error) => {
            reject(error);
          },
          { binary: true }
        );
      }).catch(reject);
    });
  }

  // 根据生成方式选择适当的生成方法
  async generateModel(): Promise<Buffer> {
    // 验证参数
    this.validateParameters();

    switch (this.generationMode) {
      case ModelGenerationMode.BROWSER:
        // 浏览器端生成，直接调用 generate 方法
        return this.generate();

      case ModelGenerationMode.SERVER:
        // 服务器端生成，调用 generate 方法
        return this.generate();

      case ModelGenerationMode.EXTERNAL:
        // 外部服务器生成，调用外部 API
        return this.generateFromExternalServer();

      default:
        throw new Error(`Unsupported generation mode: ${this.generationMode}`);
    }
  }

  // 从外部服务器生成模型
  protected async generateFromExternalServer(): Promise<Buffer> {
    if (!this.externalServerConfig) {
      throw new Error('External server configuration is missing');
    }

    const { url, apiKey, timeout = 30000, headers = {} } = this.externalServerConfig;

    // 构建请求头
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };

    if (apiKey) {
      requestHeaders['Authorization'] = `Bearer ${apiKey}`;
    }

    // 构建请求体
    const requestBody = {
      templateId: this.id,
      parameters: this._parameters
    };

    try {
      // 发送请求到外部服务器
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`External server error: ${response.status} ${response.statusText}`);
      }

      // 获取响应数据
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error: any) {
      throw new Error(`Failed to generate model from external server: ${error.message}`);
    }
  }
}
