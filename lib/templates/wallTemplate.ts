import * as THREE from 'three';
import {
  BaseTemplate,
  ModelGenerationMode,
  TemplateParameters,
  TemplateDependency
} from './baseTemplate';
import { templateRegistry } from './templateRegistry';
import { templateInstanceService } from '@/lib/services/templateInstanceService';

// 墙模板参数接口
export interface WallParameters extends TemplateParameters {
  width: number;    // 墙宽 w
  height: number;   // 墙高 h
  thickness: number; // 墙厚 t
  color: string;    // 墙颜色
  hasDoor: boolean; // 是否有门
  hasWindow: boolean; // 是否有窗
}

export class WallTemplate extends BaseTemplate<WallParameters> {
  readonly id = 'wall';
  readonly name = 'Wall Template';
  readonly description = 'A parametric wall model with door and window';

  // 设置为浏览器端生成（复杂模板，但依赖简单模板）
  readonly generationMode = ModelGenerationMode.BROWSER;

  // 参数模式定义
  readonly parameterSchema = {
    width: {
      type: 'number',
      required: true,
      min: 1.0,
      max: 10.0,
      default: 4.0,
      description: 'Width of the wall (w)'
    },
    height: {
      type: 'number',
      required: true,
      min: 1.0,
      max: 5.0,
      default: 3.0,
      description: 'Height of the wall (h)'
    },
    thickness: {
      type: 'number',
      required: true,
      min: 0.05,
      max: 0.5,
      default: 0.2,
      description: 'Thickness of the wall (t)'
    },
    color: {
      type: 'string',
      required: false,
      default: '#E8E8E8',
      description: 'Color of the wall'
    },
    hasDoor: {
      type: 'boolean',
      required: false,
      default: true,
      description: 'Whether the wall has a door'
    },
    hasWindow: {
      type: 'boolean',
      required: false,
      default: true,
      description: 'Whether the wall has a window'
    }
  };

  // 默认参数值
  readonly defaultParameters: WallParameters = {
    width: 4.0,
    height: 3.0,
    thickness: 0.2,
    color: '#E8E8E8',
    hasDoor: true,
    hasWindow: true
  };

  // 获取模板依赖项
  getDependencies(): TemplateDependency[] {
    // 使用当前参数
    const { width, height, thickness, hasDoor, hasWindow } = this._parameters;

    // 依赖项列表
    const dependencies: TemplateDependency[] = [];

    // 计算窗户参数
    const windowWidth = width / 4;  // ww = w/4
    const windowHeight = height / 4; // wh = h/4
    const windowX = width / 3;      // 窗户左侧距离墙左侧为墙宽的三分之一
    const windowY = height / 3;     // 窗户底部距离墙底部为墙高的三分之一

    // 计算门参数
    const doorHeight = 0.8 * height; // dh = 0.8*h
    const doorWidth = 0.5 + width * 0.1; // dw = 500+w*0.1 (假设单位是米，500mm = 0.5m)
    const doorX = windowX;          // 门的左下角与窗户的左下角重合

    // 添加窗户依赖
    if (hasWindow) {
      dependencies.push({
        templateId: 'window',
        parameters: {
          width: windowWidth,
          height: windowHeight,
          thickness: thickness * 1.1,
          color: '#87CEFA'
        },
        position: {
          x: windowX + windowWidth/2,
          y: windowY + windowHeight/2,
          z: 0
        },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      });
    }

    // 添加门依赖
    if (hasDoor) {
      dependencies.push({
        templateId: 'door',
        parameters: {
          width: doorWidth,
          height: doorHeight,
          thickness: thickness * 1.1,
          color: '#8B4513'
        },
        position: {
          x: doorX + doorWidth/2,
          y: doorHeight/2,
          z: 0
        },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      });
    }

    return dependencies;
  }

  /**
   * 创建墙模型
   * 实现 BaseTemplate 的抽象方法
   */
  async createModel(parameters?: WallParameters): Promise<THREE.Object3D> {
    // 使用提供的参数或当前参数
    const params = parameters || this._parameters;

    // 解构参数
    const { width, height, thickness, color, hasDoor, hasWindow } = params;

    // 创建墙体组
    const wallGroup = new THREE.Group();
    wallGroup.name = 'wall_group';

    // 创建墙体
    const wallGeometry = new THREE.BoxGeometry(width, height, thickness);
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: color || '#E8E8E8',
      side: THREE.DoubleSide
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.name = 'wall';

    // 将墙的原点设置在左下角
    wall.position.set(width/2, height/2, 0);

    // 添加墙到组
    wallGroup.add(wall);

    // 计算窗户参数
    const windowWidth = width / 4;  // ww = w/4
    const windowHeight = height / 4; // wh = h/4
    const windowX = width / 3;      // 窗户左侧距离墙左侧为墙宽的三分之一
    const windowY = height / 3;     // 窗户底部距离墙底部为墙高的三分之一

    // 计算门参数
    const doorHeight = 0.8 * height; // dh = 0.8*h
    const doorWidth = 0.5 + width * 0.1; // dw = 500+w*0.1 (假设单位是米，500mm = 0.5m)
    const doorX = windowX;          // 门的左下角与窗户的左下角重合

    // 获取依赖项
    const dependencies = this.getDependencies();
    console.log(`Wall template has ${dependencies.length} dependencies:`, dependencies);

    // 处理窗户依赖
    if (hasWindow) {
      // 在墙上挖窗户洞
      const holePosition = new THREE.Vector3(windowX + windowWidth/2, windowY + windowHeight/2, 0);
      const holeSize = new THREE.Vector3(windowWidth, windowHeight, 0);
      templateInstanceService.cutHoleInObject(wall, holePosition, holeSize, thickness);

      // 获取窗户依赖
      const windowDependency = dependencies.find(dep => dep.templateId === 'window');
      if (windowDependency) {
        try {
          // 实例化窗户模板
          const windowModel = await templateInstanceService.instantiateTemplate(
            'window',
            windowDependency.parameters
          );

          if (windowModel) {
            // 设置窗户位置
            windowModel.position.set(windowX + windowWidth/2, windowY + windowHeight/2, 0);

            // 添加窗户到组
            wallGroup.add(windowModel);
          }
        } catch (error) {
          console.error('Error instantiating window template:', error);
        }
      }
    }

    // 处理门依赖
    if (hasDoor) {
      // 在墙上挖门洞
      const holePosition = new THREE.Vector3(doorX + doorWidth/2, doorHeight/2, 0);
      const holeSize = new THREE.Vector3(doorWidth, doorHeight, 0);
      templateInstanceService.cutHoleInObject(wall, holePosition, holeSize, thickness);

      // 获取门依赖
      const doorDependency = dependencies.find(dep => dep.templateId === 'door');
      if (doorDependency) {
        try {
          // 实例化门模板
          const doorModel = await templateInstanceService.instantiateTemplate(
            'door',
            doorDependency.parameters
          );

          if (doorModel) {
            // 设置门位置
            doorModel.position.set(doorX + doorWidth/2, doorHeight/2, 0);

            // 添加门到组
            wallGroup.add(doorModel);
          }
        } catch (error) {
          console.error('Error instantiating door template:', error);
        }
      }
    }

    return wallGroup;
  }

  /**
   * 生成 GLB 数据
   * 使用 BaseTemplate 中的默认实现
   */
  async generate(): Promise<Buffer> {
    return super.generate();
  }
}

// 注册模板
templateRegistry.register(WallTemplate);
