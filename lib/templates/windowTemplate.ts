import * as THREE from 'three';
import { BaseTemplate, ModelGenerationMode, TemplateParameters } from './baseTemplate';
import { templateRegistry } from './templateRegistry';

// 窗户模板参数接口
export interface WindowParameters extends TemplateParameters {
  width: number;  // 窗户宽
  height: number; // 窗户高
  thickness: number; // 窗户厚
  color: string;  // 窗户颜色
}

export class WindowTemplate extends BaseTemplate<WindowParameters> {
  readonly id = 'window';
  readonly name = 'Window Template';
  readonly description = 'A simple parametric window model';

  // 设置为浏览器端生成（简单模板）
  readonly generationMode = ModelGenerationMode.BROWSER;

  // 参数模式定义
  readonly parameterSchema = {
    width: {
      type: 'number',
      required: true,
      min: 0.2,
      max: 2.0,
      default: 0.6,
      description: 'Width of the window'
    },
    height: {
      type: 'number',
      required: true,
      min: 0.2,
      max: 2.0,
      default: 0.6,
      description: 'Height of the window'
    },
    thickness: {
      type: 'number',
      required: true,
      min: 0.01,
      max: 0.1,
      default: 0.02,
      description: 'Thickness of the window'
    },
    color: {
      type: 'string',
      required: false,
      default: '#87CEFA',
      description: 'Color of the window'
    }
  };

  // 默认参数值
  readonly defaultParameters: WindowParameters = {
    width: 0.6,
    height: 0.6,
    thickness: 0.02,
    color: '#87CEFA'
  };

  /**
   * 创建窗户模型
   * 实现 BaseTemplate 的抽象方法
   */
  async createModel(parameters?: WindowParameters): Promise<THREE.Object3D> {
    // 使用提供的参数或当前参数
    const params = parameters || this._parameters;

    // 解构参数
    const { width, height, thickness, color } = params;

    // 创建窗户框架
    const frameWidth = 0.05; // 窗框宽度

    // 外框
    const outerFrameGeometry = new THREE.BoxGeometry(width, height, thickness);
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      side: THREE.DoubleSide
    });
    const outerFrame = new THREE.Mesh(outerFrameGeometry, frameMaterial);
    outerFrame.name = 'window_outer_frame';

    // 窗户玻璃
    const glassGeometry = new THREE.BoxGeometry(width - frameWidth*2, height - frameWidth*2, thickness/2);
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: color || '#87CEFA',
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    glass.name = 'window_glass';
    glass.position.z = thickness/4; // 稍微突出一点

    // 创建窗户组
    const windowGroup = new THREE.Group();
    windowGroup.name = 'window';
    windowGroup.add(outerFrame);
    windowGroup.add(glass);

    // 将窗户的原点设置在左下角
    windowGroup.position.set(width/2, height/2, 0);

    return windowGroup;
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
templateRegistry.register(WindowTemplate);
