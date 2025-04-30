import * as THREE from 'three';
import { BaseTemplate, ModelGenerationMode, TemplateParameters } from '../baseTemplate';
import { templateRegistry } from '../templateRegistry';

// 盒子配置接口
export interface BoxConfig {
  width: number;
  height: number;
  depth: number;
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
}

// 盒子模板参数接口
export interface BoxesParameters extends TemplateParameters {
  spacing: number;
  boxes: BoxConfig[];
}

export class BoxesTemplate extends BaseTemplate<BoxesParameters> {
  readonly id = 'boxes';
  readonly name = 'Boxes Template';
  readonly description = 'A template with multiple customizable boxes';

  // 设置为浏览器端生成（简单模板）
  readonly generationMode = ModelGenerationMode.BROWSER;

  // 参数模式定义
  readonly parameterSchema = {
    spacing: {
      type: 'number',
      required: true,
      min: 0,
      max: 10,
      default: 2,
      description: 'Spacing between boxes'
    },
    boxes: {
      type: 'array',
      required: true,
      description: 'Array of box configurations'
    }
  };

  // 默认参数值
  readonly defaultParameters: BoxesParameters = {
    spacing: 2,
    boxes: [
      {
        width: 1,
        height: 1,
        depth: 1,
        position: [-2, 0, 0],
        rotation: [0, 0, 0],
        color: '#ff0000'
      },
      {
        width: 1,
        height: 1,
        depth: 1,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        color: '#00ff00'
      },
      {
        width: 1,
        height: 1,
        depth: 1,
        position: [2, 0, 0],
        rotation: [0, 0, 0],
        color: '#0000ff'
      }
    ]
  };

  /**
   * 创建盒子模型
   * 实现 BaseTemplate 的抽象方法
   */
  async createModel(parameters?: BoxesParameters): Promise<THREE.Object3D> {
    // 使用提供的参数或当前参数
    const params = parameters || this._parameters;

    // 解构参数
    const { spacing, boxes } = params;

    // 创建组
    const boxesGroup = new THREE.Group();
    boxesGroup.name = 'boxes';

    // 创建几何体缓存（避免重复创建相同几何体）
    const geometryCache = new Map();

    // 处理每个盒子
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];

      // 获取或创建几何体
      const geometryKey = `${box.width}_${box.height}_${box.depth}`;
      let geometry;

      if (geometryCache.has(geometryKey)) {
        geometry = geometryCache.get(geometryKey);
      } else {
        geometry = new THREE.BoxGeometry(box.width, box.height, box.depth);
        geometryCache.set(geometryKey, geometry);
      }

      // 创建材质
      const material = new THREE.MeshStandardMaterial({
        color: box.color || '#cccccc'
      });

      // 创建网格
      const mesh = new THREE.Mesh(geometry, material);

      // 设置位置
      if (box.position) {
        mesh.position.set(
          box.position[0] * spacing,
          box.position[1],
          box.position[2]
        );
      }

      // 设置旋转
      if (box.rotation) {
        mesh.rotation.set(
          THREE.MathUtils.degToRad(box.rotation[0]),
          THREE.MathUtils.degToRad(box.rotation[1]),
          THREE.MathUtils.degToRad(box.rotation[2])
        );
      }

      // 设置名称
      mesh.name = `Box_${i}`;

      // 添加到组
      boxesGroup.add(mesh);
    }

    return boxesGroup;
  }

  /**
   * 生成 GLB 数据
   * 使用 BaseTemplate 中的默认实现
   */
  async generate(): Promise<Buffer> {
    return super.generate();
  }



  // 服务器端生成已经由 BaseTemplate 处理

  // 使用 BaseTemplate 中的 exportSceneToGLB 方法
  // 这个方法已经在基类中实现，不需要在这里重复实现
}

// 注册盒子模板
console.log('Registering BoxesTemplate...');
templateRegistry.register(BoxesTemplate);
console.log('BoxesTemplate registered successfully.');
