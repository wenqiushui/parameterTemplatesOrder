import { BaseTemplate, ModelGenerationMode, TemplateParameters } from '../baseTemplate';
import { templateRegistry } from '../templateRegistry';
import * as THREE from 'three';

export interface ExtrudeParameters extends TemplateParameters {
  height: number;
  pathLengths: number[];
}

export class ExtrudeTemplate extends BaseTemplate<ExtrudeParameters> {
  readonly id = 'extrude';
  readonly name = '拉伸几何体';
  readonly description = '通过路径和高度参数生成拉伸几何体';
  readonly generationMode = ModelGenerationMode.BROWSER;
  readonly parameterSchema = {
    height: {
      type: 'number',
      min: 1,
      max: 500,
      default: 100,
      description: '拉伸高度'
    },
    pathLengths: {
      type: 'array',
      itemType: 'number',
      minItems: 1,
      maxItems: 10,
      default: [100, 100, 100],
      description: '每段路径长度数组'
    }
  };
  readonly defaultParameters: ExtrudeParameters = {
    height: 100,
    pathLengths: [100, 100, 100]
  };

  /**
   * 创建拉伸几何体模型
   */
  async createModel(parameters?: ExtrudeParameters): Promise<THREE.Object3D> {
    const params = parameters || this._parameters;
    const { height, pathLengths } = params;
    // 构建二维路径（默认闭合多边形）
    const shape = new THREE.Shape();
    let x = 0, y = 0;
    shape.moveTo(x, y);
    for (let i = 0; i < pathLengths.length; i++) {
      switch (i % 4) {
        case 0: x += pathLengths[i]; break;
        case 1: y += pathLengths[i]; break;
        case 2: x -= pathLengths[i]; break;
        case 3: y -= pathLengths[i]; break;
      }
      shape.lineTo(x, y);
    }
    shape.lineTo(0, 0); // 闭合
    const extrudeSettings = {
      steps: 1,
      depth: height,
      bevelEnabled: false
    };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshStandardMaterial({ color: 0x2194ce });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'extrude_mesh';
    return mesh;
  }

  async generate(): Promise<Buffer> {
    return super.generate();
  }
}

// 注册模板
console.log('Registering ExtrudeTemplate...');
templateRegistry.register(ExtrudeTemplate);
console.log('ExtrudeTemplate registered successfully.');