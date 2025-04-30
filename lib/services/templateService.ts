import { templateDatabase, TemplateRecord, TemplateDependencyRecord } from '@/lib/db/templateDatabase';

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  generationMode: 'browser' | 'server' | 'external';
  parameterSchema: Record<string, any>;
  defaultParameters: Record<string, any>;
  dependencies: string[];
  parameterMappings: Record<string, Record<string, any>>;
  version: string;
  thumbnailUrl: string;
}

class TemplateService {
  // 获取所有模板元数据
  async getAllTemplateMetadata(): Promise<TemplateMetadata[]> {
    await templateDatabase.connect();
    
    const templates = await templateDatabase.getAllTemplates();
    const result: TemplateMetadata[] = [];
    
    for (const template of templates) {
      const dependencies = await templateDatabase.getTemplateDependencies(template.id);
      
      result.push({
        id: template.id,
        name: template.name,
        description: template.description,
        generationMode: template.generationMode as 'browser' | 'server' | 'external',
        parameterSchema: JSON.parse(template.parameterSchema),
        defaultParameters: JSON.parse(template.defaultParameters),
        dependencies: dependencies.map(dep => dep.dependencyId),
        parameterMappings: dependencies.reduce((acc, dep) => {
          acc[dep.dependencyId] = JSON.parse(dep.parameterMapping || '{}');
          return acc;
        }, {} as Record<string, Record<string, any>>),
        version: template.version,
        thumbnailUrl: `/api/templates/${template.id}/thumbnail`
      });
    }
    
    return result;
  }
  
  // 获取特定模板的元数据
  async getTemplateMetadata(templateId: string): Promise<TemplateMetadata | null> {
    await templateDatabase.connect();
    
    const template = await templateDatabase.getTemplateById(templateId);
    
    if (!template) return null;
    
    const dependencies = await templateDatabase.getTemplateDependencies(templateId);
    
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      generationMode: template.generationMode as 'browser' | 'server' | 'external',
      parameterSchema: JSON.parse(template.parameterSchema),
      defaultParameters: JSON.parse(template.defaultParameters),
      dependencies: dependencies.map(dep => dep.dependencyId),
      parameterMappings: dependencies.reduce((acc, dep) => {
        acc[dep.dependencyId] = JSON.parse(dep.parameterMapping || '{}');
        return acc;
      }, {} as Record<string, Record<string, any>>),
      version: template.version,
      thumbnailUrl: `/api/templates/${template.id}/thumbnail`
    };
  }
  
  // 获取模板代码
  async getTemplateCode(templateId: string, version: string): Promise<string | null> {
    await templateDatabase.connect();
    
    const codeRecord = await templateDatabase.getTemplateCode(templateId, version);
    
    return codeRecord ? codeRecord.code : null;
  }
  
  // 获取模板及其所有依赖的代码
  async getTemplateBundleCode(templateId: string): Promise<Record<string, string>> {
    await templateDatabase.connect();
    
    const template = await templateDatabase.getTemplateById(templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    const codeBundle: Record<string, string> = {};
    
    // 使用深度优先搜索获取所有依赖
    const visited = new Set<string>();
    
    const collectDependencies = async (id: string) => {
      if (visited.has(id)) return;
      
      visited.add(id);
      
      const dependencies = await templateDatabase.getTemplateDependencies(id);
      
      // 先处理依赖
      for (const dep of dependencies) {
        await collectDependencies(dep.dependencyId);
      }
      
      // 获取当前模板的代码
      const templateRecord = await templateDatabase.getTemplateById(id);
      
      if (!templateRecord) {
        throw new Error(`Template not found: ${id}`);
      }
      
      const codeRecord = await templateDatabase.getTemplateCode(id, templateRecord.version);
      
      if (!codeRecord) {
        throw new Error(`Template code not found: ${id} (version ${templateRecord.version})`);
      }
      
      codeBundle[id] = codeRecord.code;
    };
    
    await collectDependencies(templateId);
    
    return codeBundle;
  }
  
  // 获取模板缩略图路径
  async getTemplateThumbnailPath(templateId: string, version: string): Promise<string | null> {
    await templateDatabase.connect();
    
    const thumbnail = await templateDatabase.getTemplateThumbnail(templateId, version);
    
    return thumbnail ? thumbnail.thumbnailPath : null;
  }
  
  // 搜索模板
  async searchTemplates(query: string): Promise<TemplateMetadata[]> {
    await templateDatabase.connect();
    
    const templates = await templateDatabase.searchTemplates(query);
    const result: TemplateMetadata[] = [];
    
    for (const template of templates) {
      const dependencies = await templateDatabase.getTemplateDependencies(template.id);
      
      result.push({
        id: template.id,
        name: template.name,
        description: template.description,
        generationMode: template.generationMode as 'browser' | 'server' | 'external',
        parameterSchema: JSON.parse(template.parameterSchema),
        defaultParameters: JSON.parse(template.defaultParameters),
        dependencies: dependencies.map(dep => dep.dependencyId),
        parameterMappings: dependencies.reduce((acc, dep) => {
          acc[dep.dependencyId] = JSON.parse(dep.parameterMapping || '{}');
          return acc;
        }, {} as Record<string, Record<string, any>>),
        version: template.version,
        thumbnailUrl: `/api/templates/${template.id}/thumbnail`
      });
    }
    
    return result;
  }
  
  // 初始化默认模板（如果数据库为空）
//   async initializeDefaultTemplates(): Promise<void> {
//     await templateDatabase.connect();
    
//     const templates = await templateDatabase.getAllTemplates();
    
//     if (templates.length > 0) {
//       console.log('Templates already exist, skipping initialization');
//       return;
//     }
    
//     console.log('Initializing default templates...');
    
//     // 创建盒子模板
//     await templateDatabase.createTemplate({
//       id: 'boxes',
//       name: '参数化盒子',
//       description: '一个简单的参数化盒子模型',
//       generationMode: 'browser',
//       parameterSchema: JSON.stringify({
//         width: { type: 'number', min: 0.1, max: 2, default: 1, description: '宽度' },
//         height: { type: 'number', min: 0.1, max: 2, default: 1, description: '高度' },
//         depth: { type: 'number', min: 0.1, max: 2, default: 1, description: '深度' },
//         segments: { type: 'number', min: 1, max: 10, default: 1, description: '分段数' },
//       }),
//       defaultParameters: JSON.stringify({ width: 1, height: 1, depth: 1, segments: 1 }),
//       version: '1.0.0',
//     });
    
//     // 保存盒子模板代码
//     await templateDatabase.saveTemplateCode({
//       templateId: 'boxes',
//       version: '1.0.0',
//       code: `
// module.exports = {
//   id: 'boxes',
//   name: '参数化盒子',
//   generate: function(parameters) {
//     // 创建盒子模型
//     const width = parameters.width || 1;
//     const height = parameters.height || 1;
//     const depth = parameters.depth || 1;
//     const segments = parameters.segments || 1;
    
//     const geometry = new THREE.BoxGeometry(width, height, depth, segments, segments, segments);
//     const material = new THREE.MeshStandardMaterial({ color: 0x3080e8 });
//     const mesh = new THREE.Mesh(geometry, material);
    
//     return mesh;
//   },
//   exportToGLB: function(parameters) {
//     const mesh = this.generate(parameters);
//     const scene = new THREE.Scene();
//     scene.add(mesh);
    
//     return new Promise((resolve) => {
//       const exporter = new THREE.GLTFExporter();
//       exporter.parse(scene, (gltf) => {
//         resolve(gltf);
//       }, { binary: true });
//     });
//   }
// };
//       `,
//     });
    
//     // 创建椅子模板
//     await templateDatabase.createTemplate({
//       id: 'chair',
//       name: '参数化椅子',
//       description: '一个简单的参数化椅子模型',
//       generationMode: 'server',
//       parameterSchema: JSON.stringify({
//         seatWidth: { type: 'number', min: 0.3, max: 1, default: 0.5, description: '座位宽度' },
//         seatDepth: { type: 'number', min: 0.3, max: 1, default: 0.5, description: '座位深度' },
//         seatHeight: { type: 'number', min: 0.3, max: 0.6, default: 0.45, description: '座位高度' },
//         backHeight: { type: 'number', min: 0.3, max: 1.2, default: 0.8, description: '靠背高度' },
//         legThickness: { type: 'number', min: 0.02, max: 0.1, default: 0.04, description: '腿部粗细' },
//       }),
//       defaultParameters: JSON.stringify({ 
//         seatWidth: 0.5, 
//         seatDepth: 0.5, 
//         seatHeight: 0.45, 
//         backHeight: 0.8, 
//         legThickness: 0.04 
//       }),
//       version: '1.0.0',
//     });
    
//     // 保存椅子模板代码
//     await templateDatabase.saveTemplateCode({
//       templateId: 'chair',
//       version: '1.0.0',
//       code: `
// module.exports = {
//   id: 'chair',
//   name: '参数化椅子',
//   generate: function(parameters) {
//     // 创建椅子模型
//     const seatWidth = parameters.seatWidth || 0.5;
//     const seatDepth = parameters.seatDepth || 0.5;
//     const seatHeight = parameters.seatHeight || 0.45;
//     const backHeight = parameters.backHeight || 0.8;
//     const legThickness = parameters.legThickness || 0.04;
    
//     const scene = new THREE.Scene();
    
//     // 创建座位
//     const seatGeometry = new THREE.BoxGeometry(seatWidth, 0.05, seatDepth);
//     const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
//     const seat = new THREE.Mesh(seatGeometry, seatMaterial);
//     seat.position.y = seatHeight;
//     scene.add(seat);
    
//     // 创建靠背
//     const backGeometry = new THREE.BoxGeometry(seatWidth, backHeight, 0.05);
//     const backMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
//     const back = new THREE.Mesh(backGeometry, backMaterial);
//     back.position.y = seatHeight + backHeight / 2;
//     back.position.z = -seatDepth / 2 + 0.025;
//     scene.add(back);
    
//     // 创建腿
//     const legMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    
//     // 前左腿
//     const legFL = this.createLeg(legThickness, seatHeight, legMaterial);
//     legFL.position.set(-seatWidth / 2 + legThickness / 2, seatHeight / 2, seatDepth / 2 - legThickness / 2);
//     scene.add(legFL);
    
//     // 前右腿
//     const legFR = this.createLeg(legThickness, seatHeight, legMaterial);
//     legFR.position.set(seatWidth / 2 - legThickness / 2, seatHeight / 2, seatDepth / 2 - legThickness / 2);
//     scene.add(legFR);
    
//     // 后左腿
//     const legBL = this.createLeg(legThickness, seatHeight, legMaterial);
//     legBL.position.set(-seatWidth / 2 + legThickness / 2, seatHeight / 2, -seatDepth / 2 + legThickness / 2);
//     scene.add(legBL);
    
//     // 后右腿
//     const legBR = this.createLeg(legThickness, seatHeight, legMaterial);
//     legBR.position.set(seatWidth / 2 - legThickness / 2, seatHeight / 2, -seatDepth / 2 + legThickness / 2);
//     scene.add(legBR);
    
//     return scene;
//   },
//   createLeg: function(thickness, height, material) {
//     const legGeometry = new THREE.BoxGeometry(thickness, height, thickness);
//     return new THREE.Mesh(legGeometry, material);
//   },
//   exportToGLB: function(parameters) {
//     const scene = this.generate(parameters);
    
//     return new Promise((resolve) => {
//       const exporter = new THREE.GLTFExporter();
//       exporter.parse(scene, (gltf) => {
//         resolve(gltf);
//       }, { binary: true });
//     });
//   }
// };
//       `,
//     });
    
//     console.log('Default templates initialized successfully');
//   }
  
  // 同步 definitions 目录下模板文件与数据库
  async syncTemplatesWithDefinitions(): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    const definitionsDir = path.resolve(__dirname, '../templates/definitions');
    const files = fs.readdirSync(definitionsDir).filter(f => f.endsWith('Template.ts'));
    await templateDatabase.connect();
    const dbTemplates = await templateDatabase.getAllTemplates();
    const dbTemplateMap = new Map(dbTemplates.map(t => [t.id, t]));
    for (const file of files) {
      const filePath = path.join(definitionsDir, file);
      // 动态导入模板定义
      const mod = await import(filePath);
      let def = mod.default || mod;
      // 检查是否为类（构造函数）
      if (typeof def === 'function') {
        // 读取静态属性
        def = {
          id: def.id,
          name: def.name,
          description: def.description,
          generationMode: def.generationMode,
          parameterSchema: def.parameterSchema,
          defaultParameters: def.defaultParameters,
          version: def.version
        };
      }
      // 组装模板元数据
      const templateData = {
        id: def.id,
        name: def.name,
        description: def.description,
        generationMode: def.generationMode,
        parameterSchema: JSON.stringify(def.parameterSchema),
        defaultParameters: JSON.stringify(def.defaultParameters),
        version: def.version
      };
      const dbTemplate = dbTemplateMap.get(def.id);
      if (!dbTemplate) {
        await templateDatabase.createTemplate(templateData);
      } else {
        // 检查是否有变更
        let changed = false;
        for (const key of ['name','description','generationMode','parameterSchema','defaultParameters','version']) {
          if (dbTemplate[key] !== templateData[key]) {
            changed = true;
            break;
          }
        }
        if (changed) {
          await templateDatabase.updateTemplate(templateData);
        }
      }
    }
  }
}

export const templateService = new TemplateService();
