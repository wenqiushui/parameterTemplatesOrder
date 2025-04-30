/**
 * 模板实例化服务
 *
 * 该服务负责实例化模板，并将其添加到场景中
 * 它提供了从依赖图实例化模型的功能
 */

import * as THREE from 'three';
import {
  BaseTemplate,
  ModelGenerationMode,
  TemplateDependency,
  TemplateDependencyGraph,
  Vector3Data,
  EulerData
} from '@/lib/templates/baseTemplate';
import { templateRegistry } from '@/lib/templates/templateRegistry';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// 模板实例化选项
export interface TemplateInstanceOptions {
  // 是否包含场景和灯光
  includeSceneAndLights?: boolean;
  // 是否自动处理依赖
  handleDependencies?: boolean;
}

// 默认选项
const DEFAULT_OPTIONS: TemplateInstanceOptions = {
  includeSceneAndLights: false,
  handleDependencies: true
};

// 依赖模板请求
export interface DependencyRequest {
  templateId: string;
  parameters: Record<string, any>;
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
  scale?: THREE.Vector3;
}

// 模板实例化服务
class TemplateInstanceService {
  // 实例化模板并生成模型
  async instantiateTemplate(
    templateId: string,
    parameters: Record<string, any>,
    options: TemplateInstanceOptions = DEFAULT_OPTIONS
  ): Promise<THREE.Object3D | null> {
    try {
      console.log(`Instantiating template: ${templateId}`);

      // 获取模板
      const template = templateRegistry.get(templateId);
      if (!template) {
        console.error(`Template not found: ${templateId}`);
        return null;
      }

      // 设置参数
      template.setParameters(parameters);

      // 检查是否是本地模板
      const isLocal = template.isLocalTemplate();
      console.log(`Template ${templateId} is ${isLocal ? 'local' : 'not local'}`);

      // 如果是本地模板，直接创建模型
      if (isLocal) {
        try {
          // 创建模型
          const model = await template.createModel(parameters);

          // 创建一个组来包含模型
          const group = new THREE.Group();
          group.name = `${templateId}_instance`;
          group.add(model);

          return group;
        } catch (error) {
          console.error(`Error creating model for template ${templateId}:`, error);
        }
      }

      // 创建场景（如果需要）
      const scene = options.includeSceneAndLights ?
        this.createSceneWithLights() :
        new THREE.Scene();

      // 处理依赖（如果需要）
      if (options.handleDependencies) {
        const dependencies = template.getDependencies();
        console.log(`Template ${templateId} has ${dependencies.length} dependencies`);

        if (dependencies.length > 0) {
          // 将依赖转换为依赖请求
          const dependencyRequests = dependencies.map(dep => ({
            templateId: dep.templateId,
            parameters: dep.parameters
          }));

          // 处理依赖请求
          await this.processDependencyRequests(scene, dependencyRequests);
        }
      }

      // 生成模型
      const modelBuffer = await template.generate();

      // 在浏览器端，我们需要加载生成的 GLB 数据
      if (typeof window !== 'undefined') {
        // 创建一个组来包含模型
        const group = new THREE.Group();
        group.name = `${templateId}_instance`;

        // 如果有模型数据，使用 GLTFLoader 加载
        if (modelBuffer && modelBuffer.length > 0) {
          try {
            const loader = new GLTFLoader();
            const arrayBuffer = modelBuffer.buffer.slice(
              modelBuffer.byteOffset,
              modelBuffer.byteOffset + modelBuffer.byteLength
            );

            // 加载模型
            const gltf = await new Promise<any>((resolve, reject) => {
              loader.parse(
                arrayBuffer,
                '',
                (gltf) => resolve(gltf),
                (error) => reject(error)
              );
            });

            // 添加模型到组
            if (gltf && gltf.scene) {
              group.add(gltf.scene);
            }
          } catch (error) {
            console.error(`Error loading model for template ${templateId}:`, error);

            // 创建一个占位符
            const placeholder = new THREE.Mesh(
              new THREE.BoxGeometry(1, 1, 1),
              new THREE.MeshBasicMaterial({ wireframe: true, color: 0xff0000 })
            );
            group.add(placeholder);
          }
        } else {
          // 如果没有模型数据，创建一个占位符
          const placeholder = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({ wireframe: true, visible: false })
          );
          group.add(placeholder);
        }

        // 如果包含场景和灯光，将场景中的所有对象添加到组
        if (options.includeSceneAndLights) {
          scene.children.forEach(child => {
            group.add(child.clone());
          });
        }

        return group;
      }

      return null;
    } catch (error) {
      console.error(`Error instantiating template ${templateId}:`, error);
      return null;
    }
  }

  // 创建场景和灯光
  createSceneWithLights(): THREE.Scene {
    const scene = new THREE.Scene();

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // 添加方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    return scene;
  }

  // 处理依赖请求
  async processDependencyRequests(
    scene: THREE.Scene,
    requests: DependencyRequest[]
  ): Promise<void> {
    for (const request of requests) {
      const { templateId, parameters, position, rotation, scale } = request;

      // 实例化依赖模板
      const instance = await this.instantiateTemplate(templateId, parameters);

      if (instance) {
        // 设置位置、旋转和缩放
        if (position) instance.position.copy(position);
        if (rotation) instance.rotation.copy(rotation);
        if (scale) instance.scale.copy(scale);

        // 添加到场景
        scene.add(instance);
      }
    }
  }

  // 在墙上挖洞
  cutHoleInObject(
    object: THREE.Mesh,
    position: THREE.Vector3,
    size: THREE.Vector3,
    thickness: number
  ): void {
    // 创建一个与洞口相同大小的盒子，并将其材质设置为透明
    const holeGeometry = new THREE.BoxGeometry(size.x, size.y, thickness * 1.2);
    const holeMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });

    const hole = new THREE.Mesh(holeGeometry, holeMaterial);
    hole.position.copy(position);
    object.add(hole);
  }

  // 实例化模板并添加到场景
  async instantiateTemplateToScene(
    scene: THREE.Scene,
    templateId: string,
    parameters: Record<string, any>,
    position?: THREE.Vector3,
    rotation?: THREE.Euler,
    scale?: THREE.Vector3
  ): Promise<THREE.Object3D> {
    try {
      console.log(`Instantiating template to scene: ${templateId}`);

      // 获取模板
      const template = templateRegistry.get(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // 设置参数
      template.setParameters(parameters);

      // 创建模型
      const model = await template.createModel(parameters);

      // 设置位置、旋转和缩放
      if (position) model.position.copy(position);
      if (rotation) model.rotation.copy(rotation);
      if (scale) model.scale.copy(scale);

      // 添加到场景
      scene.add(model);

      return model;
    } catch (error) {
      console.error(`Error instantiating template ${templateId} to scene:`, error);

      // 创建一个错误占位符
      const errorPlaceholder = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ wireframe: true, color: 0xff0000 })
      );

      if (position) errorPlaceholder.position.copy(position);
      if (rotation) errorPlaceholder.rotation.copy(rotation);
      if (scale) errorPlaceholder.scale.copy(scale);

      scene.add(errorPlaceholder);

      return errorPlaceholder;
    }
  }

  // 从依赖图实例化模型
  async instantiateFromDependencyGraph(
    scene: THREE.Scene,
    graph: TemplateDependencyGraph
  ): Promise<void> {
    try {
      console.log('Instantiating from dependency graph:', graph);

      // 获取根模板
      const rootTemplate = templateRegistry.get(graph.templateId);
      if (!rootTemplate) {
        throw new Error(`Root template ${graph.templateId} not found`);
      }

      // 设置根模板参数
      rootTemplate.setParameters(graph.parameters);

      // 创建根模型
      const rootModel = await rootTemplate.createModel(graph.parameters);

      // 设置根模型位置、旋转和缩放
      if (graph.position) {
        rootModel.position.set(
          graph.position.x,
          graph.position.y,
          graph.position.z
        );
      }

      if (graph.rotation) {
        rootModel.rotation.set(
          graph.rotation.x,
          graph.rotation.y,
          graph.rotation.z
        );
      }

      if (graph.scale) {
        rootModel.scale.set(
          graph.scale.x,
          graph.scale.y,
          graph.scale.z
        );
      }

      // 添加根模型到场景
      scene.add(rootModel);

      // 处理依赖项
      if (graph.dependencies && graph.dependencies.length > 0) {
        for (const dependency of graph.dependencies) {
          // 递归实例化依赖项
          await this.instantiateDependency(scene, dependency);
        }
      }
    } catch (error) {
      console.error('Error instantiating from dependency graph:', error);
      throw error;
    }
  }

  // 实例化依赖项
  private async instantiateDependency(
    scene: THREE.Scene,
    dependency: TemplateDependency
  ): Promise<void> {
    try {
      // 获取依赖模板
      const template = templateRegistry.get(dependency.templateId);
      if (!template) {
        console.error(`Dependency template ${dependency.templateId} not found`);
        return;
      }

      // 设置位置、旋转和缩放
      const position = this.convertToVector3(dependency.position);
      const rotation = this.convertToEuler(dependency.rotation);
      const scale = this.convertToVector3(dependency.scale, new THREE.Vector3(1, 1, 1));

      // 实例化依赖模板并添加到场景
      await this.instantiateTemplateToScene(
        scene,
        dependency.templateId,
        dependency.parameters,
        position,
        rotation,
        scale
      );
    } catch (error) {
      console.error(`Error instantiating dependency ${dependency.templateId}:`, error);
    }
  }

  // 将 Vector3Data 转换为 THREE.Vector3
  convertToVector3(data?: Vector3Data, defaultValue = new THREE.Vector3()): THREE.Vector3 {
    if (!data) {
      return defaultValue;
    }

    return new THREE.Vector3(
      data.x !== undefined ? data.x : defaultValue.x,
      data.y !== undefined ? data.y : defaultValue.y,
      data.z !== undefined ? data.z : defaultValue.z
    );
  }

  // 将 EulerData 转换为 THREE.Euler
  convertToEuler(data?: EulerData, defaultValue = new THREE.Euler()): THREE.Euler {
    if (!data) {
      return defaultValue;
    }

    return new THREE.Euler(
      data.x !== undefined ? data.x : defaultValue.x,
      data.y !== undefined ? data.y : defaultValue.y,
      data.z !== undefined ? data.z : defaultValue.z
    );
  }
}

// 导出单例实例
export const templateInstanceService = new TemplateInstanceService();
