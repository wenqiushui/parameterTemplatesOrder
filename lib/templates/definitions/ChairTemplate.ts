import * as THREE from 'three';
import { BaseTemplate, ModelGenerationMode, TemplateParameters } from '../baseTemplate';
import { templateRegistry } from '../templateRegistry';

// 椅子模板参数接口
export interface ChairParameters extends TemplateParameters {
  seatWidth: number;
  seatDepth: number;
  seatHeight: number;
  backHeight: number;
  legThickness: number;
}

export class ChairTemplate extends BaseTemplate<ChairParameters> {
  readonly id = 'chair';
  readonly name = 'Chair Template';
  readonly description = 'A parametric chair model with customizable dimensions';

  // 设置为浏览器端生成（简单模板）
  readonly generationMode = ModelGenerationMode.BROWSER;

  // 参数模式定义
  readonly parameterSchema = {
    seatWidth: {
      type: 'number',
      required: true,
      min: 0.3,
      max: 2.0,
      default: 0.5,
      description: 'Width of the seat'
    },
    seatDepth: {
      type: 'number',
      required: true,
      min: 0.3,
      max: 2.0,
      default: 0.5,
      description: 'Depth of the seat'
    },
    seatHeight: {
      type: 'number',
      required: true,
      min: 0.3,
      max: 1.0,
      default: 0.45,
      description: 'Height of the seat from the ground'
    },
    backHeight: {
      type: 'number',
      required: true,
      min: 0.3,
      max: 1.5,
      default: 0.8,
      description: 'Height of the backrest'
    },
    legThickness: {
      type: 'number',
      required: true,
      min: 0.02,
      max: 0.1,
      default: 0.04,
      description: 'Thickness of the chair legs'
    }
  };

  // 默认参数值
  readonly defaultParameters: ChairParameters = {
    seatWidth: 0.5,
    seatDepth: 0.5,
    seatHeight: 0.45,
    backHeight: 0.8,
    legThickness: 0.04
  };

  async createModel(parameters?: ChairParameters): Promise<THREE.Object3D> {
    // 使用提供的参数或当前参数
    const params = parameters || this._parameters;

    // 解构参数
    const { seatWidth, seatDepth, seatHeight, backHeight, legThickness } = params;

    // 创建组
    const chairGroup = new THREE.Group();
    chairGroup.name = 'chair';

    // 创建座位
    const seatGeometry = new THREE.BoxGeometry(seatWidth, 0.05, seatDepth);
    const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.y = seatHeight;
    seat.name = 'seat';
    chairGroup.add(seat);

    // 创建靠背
    const backGeometry = new THREE.BoxGeometry(seatWidth, backHeight, 0.05);
    const backMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const back = new THREE.Mesh(backGeometry, backMaterial);
    back.position.y = seatHeight + backHeight / 2;
    back.position.z = -seatDepth / 2 + 0.025;
    back.name = 'back';
    chairGroup.add(back);

    // 创建腿
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x5C4033 });

    // 前左腿
    const legFrontLeft = this.createLeg(legThickness, seatHeight, legMaterial);
    legFrontLeft.position.set(-seatWidth / 2 + legThickness / 2, seatHeight / 2, seatDepth / 2 - legThickness / 2);
    legFrontLeft.name = 'legFrontLeft';
    chairGroup.add(legFrontLeft);

    // 前右腿
    const legFrontRight = this.createLeg(legThickness, seatHeight, legMaterial);
    legFrontRight.position.set(seatWidth / 2 - legThickness / 2, seatHeight / 2, seatDepth / 2 - legThickness / 2);
    legFrontRight.name = 'legFrontRight';
    chairGroup.add(legFrontRight);

    // 后左腿
    const legBackLeft = this.createLeg(legThickness, seatHeight, legMaterial);
    legBackLeft.position.set(-seatWidth / 2 + legThickness / 2, seatHeight / 2, -seatDepth / 2 + legThickness / 2);
    legBackLeft.name = 'legBackLeft';
    chairGroup.add(legBackLeft);

    // 后右腿
    const legBackRight = this.createLeg(legThickness, seatHeight, legMaterial);
    legBackRight.position.set(seatWidth / 2 - legThickness / 2, seatHeight / 2, -seatDepth / 2 + legThickness / 2);
    legBackRight.name = 'legBackRight';
    chairGroup.add(legBackRight);

    return chairGroup;
  }

  private createLeg(thickness: number, height: number, material: THREE.Material): THREE.Mesh {
    const legGeometry = new THREE.BoxGeometry(thickness, height, thickness);
    return new THREE.Mesh(legGeometry, material);
  }

  /**
   * 生成 GLB 数据
   * 使用 BaseTemplate 中的默认实现
   */
  async generate(): Promise<Buffer> {
    return super.generate();
  }
}

// 注册椅子模板
templateRegistry.register(ChairTemplate);
