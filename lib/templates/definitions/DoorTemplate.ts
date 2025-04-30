import * as THREE from 'three';
import { BaseTemplate, ModelGenerationMode, TemplateParameters } from '../baseTemplate';
import { templateRegistry } from '../templateRegistry';

// 门模板参数接口
export interface DoorParameters extends TemplateParameters {
  width: number;  // 门宽
  height: number; // 门高
  thickness: number; // 门厚
  color: string;  // 门颜色
}

export class DoorTemplate extends BaseTemplate<DoorParameters> {
  readonly id = 'door';
  readonly name = 'Door Template';
  readonly description = 'A simple parametric door model';

  // 设置为浏览器端生成（简单模板）
  readonly generationMode = ModelGenerationMode.BROWSER;

  // 参数模式定义
  readonly parameterSchema = {
    width: {
      type: 'number',
      required: true,
      min: 0.3,
      max: 2.0,
      default: 0.8,
      description: 'Width of the door'
    },
    height: {
      type: 'number',
      required: true,
      min: 0.5,
      max: 3.0,
      default: 2.0,
      description: 'Height of the door'
    },
    thickness: {
      type: 'number',
      required: true,
      min: 0.01,
      max: 0.1,
      default: 0.04,
      description: 'Thickness of the door'
    },
    color: {
      type: 'string',
      required: false,
      default: '#8B4513',
      description: 'Color of the door'
    }
  };

  // 默认参数值
  readonly defaultParameters: DoorParameters = {
    width: 0.8,
    height: 2.0,
    thickness: 0.04,
    color: '#8B4513'
  };

  /**
   * 创建门模型
   * 实现 BaseTemplate 的抽象方法
   */
  async createModel(parameters?: DoorParameters): Promise<THREE.Object3D> {
    // 使用提供的参数或当前参数
    const params = parameters || this._parameters;

    // 解构参数
    const { width, height, thickness, color } = params;

    // 创建门框架
    const doorGeometry = new THREE.BoxGeometry(width, height, thickness);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: color || '#8B4513',
      side: THREE.DoubleSide
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.name = 'door';

    // 将门的原点设置在左下角
    door.position.set(width/2, height/2, 0);

    return door;
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
templateRegistry.register(DoorTemplate);
