'use client';

import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { templateLoaderService } from '@/lib/services/templateLoaderService';
import ModelViewer from './core/ModelViewer';
import { Spin } from 'antd';

interface TemplatePreviewProps {
  templateId: string;
  parameters: Record<string, any>;
  width?: string | number;
  height?: string | number;
  onLoad?: (model: THREE.Object3D) => void;
  onError?: (error: Error) => void;
}

export default function TemplatePreview({
  templateId,
  parameters,
  width = '100%',
  height = '100%',
  onLoad,
  onError,
}: TemplatePreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);

  useEffect(() => {
    if (!templateId) return;

    setLoading(true);
    setError(null);

    // 加载模板元数据
    templateLoaderService.loadTemplateMetadata()
      .then(metadata => {
        // 查找当前模板的元数据
        const templateMetadata = metadata.find(m => m.id === templateId);

        if (!templateMetadata) {
          throw new Error(`Template metadata not found for ${templateId}`);
        }

        // 生成模型
        return templateLoaderService.generateModel(
          templateId,
          parameters,
          templateMetadata
        );
      })
      .then(async modelData => {
        if (modelData.modelData === 'browser-generated-model') {
          try {
            // 尝试使用模板的createModel方法
            const { getTemplateRegistry } = await import('@/lib/templates/registry/templateRegistryFactory');
            const registry = getTemplateRegistry();

            if (registry.has(templateId)) {
              console.log(`Using template registry to create model for ${templateId}`);
              const template = registry.get(templateId);

              // 设置参数
              template.setParameters(parameters);

              // 创建模型
              const model = await template.createModel();
              console.log(`Model created successfully for ${templateId}`);

              setModel(model);

              if (onLoad) {
                onLoad(model);
              }

              return; // 成功创建模型，提前返回
            } else {
              console.log(`Template ${templateId} not found in registry, using parametric component`);
            }
          } catch (error) {
            console.error(`Error creating model using template registry for ${templateId}:`, error);
            // 继续使用参数化组件
          }

          // 如果无法使用模板的createModel方法，使用参数化组件
          // 导入参数化组件
          try {
            const { DynamicParametricComponent } = await import('@/components/parametric');

            // 创建一个场景来容纳参数化组件
            const scene = new THREE.Scene();

            // 添加灯光
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 10, 7.5);
            directionalLight.castShadow = true;
            scene.add(directionalLight);

            // 使用参数化组件
            const Component = DynamicParametricComponent;

            // 创建一个临时的渲染器和相机
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(1, 1); // 最小尺寸，不会实际显示

            const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

            // 使用参数化组件创建模型
            const model = new THREE.Group();
            model.name = templateId;

            // 根据模板ID选择不同的处理方式
            if (templateId === 'chair') {
              // 创建椅子模型
              const { seatWidth = 0.5, seatDepth = 0.5, seatHeight = 0.45, backHeight = 0.8, legThickness = 0.04 } = parameters;

              // 创建座位
              const seatGeometry = new THREE.BoxGeometry(seatWidth, 0.05, seatDepth);
              const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
              const seat = new THREE.Mesh(seatGeometry, seatMaterial);
              seat.position.y = seatHeight;
              seat.name = 'seat';
              model.add(seat);

              // 创建靠背
              const backGeometry = new THREE.BoxGeometry(seatWidth, backHeight, 0.05);
              const backMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
              const back = new THREE.Mesh(backGeometry, backMaterial);
              back.position.y = seatHeight + backHeight / 2;
              back.position.z = -seatDepth / 2 + 0.025;
              back.name = 'back';
              model.add(back);

              // 创建腿
              const legMaterial = new THREE.MeshStandardMaterial({ color: 0x5C4033 });

              // 前左腿
              const legFrontLeft = new THREE.Mesh(
                new THREE.BoxGeometry(legThickness, seatHeight, legThickness),
                legMaterial
              );
              legFrontLeft.position.set(-seatWidth / 2 + legThickness / 2, seatHeight / 2, seatDepth / 2 - legThickness / 2);
              legFrontLeft.name = 'legFrontLeft';
              model.add(legFrontLeft);

              // 前右腿
              const legFrontRight = new THREE.Mesh(
                new THREE.BoxGeometry(legThickness, seatHeight, legThickness),
                legMaterial
              );
              legFrontRight.position.set(seatWidth / 2 - legThickness / 2, seatHeight / 2, seatDepth / 2 - legThickness / 2);
              legFrontRight.name = 'legFrontRight';
              model.add(legFrontRight);

              // 后左腿
              const legBackLeft = new THREE.Mesh(
                new THREE.BoxGeometry(legThickness, seatHeight, legThickness),
                legMaterial
              );
              legBackLeft.position.set(-seatWidth / 2 + legThickness / 2, seatHeight / 2, -seatDepth / 2 + legThickness / 2);
              legBackLeft.name = 'legBackLeft';
              model.add(legBackLeft);

              // 后右腿
              const legBackRight = new THREE.Mesh(
                new THREE.BoxGeometry(legThickness, seatHeight, legThickness),
                legMaterial
              );
              legBackRight.position.set(seatWidth / 2 - legThickness / 2, seatHeight / 2, -seatDepth / 2 + legThickness / 2);
              legBackRight.name = 'legBackRight';
              model.add(legBackRight);
            } else {
              // 默认创建一个盒子
              const geometry = new THREE.BoxGeometry(
                parameters.width || 1,
                parameters.height || 1,
                parameters.depth || 1
              );
              const material = new THREE.MeshStandardMaterial({ color: 0x3080e8 });
              const mesh = new THREE.Mesh(geometry, material);
              model.add(mesh);
            }

            setModel(model);

            if (onLoad) {
              onLoad(model);
            }
          } catch (error) {
            console.error(`Error creating model using parametric component for ${templateId}:`, error);

            // 如果所有方法都失败，创建一个简单的盒子
            const geometry = new THREE.BoxGeometry(
              parameters.width || 1,
              parameters.height || 1,
              parameters.depth || 1
            );
            const material = new THREE.MeshStandardMaterial({ color: 0x3080e8 });
            const mesh = new THREE.Mesh(geometry, material);

            setModel(mesh);

            if (onLoad) {
              onLoad(mesh);
            }
          }
        } else if (modelData.modelUrl) {
          // 服务器端生成的模型
          // 加载 GLB 文件
          const loader = new GLTFLoader();

          loader.load(
            modelData.modelUrl,
            (gltf) => {
              setModel(gltf.scene);

              if (onLoad) {
                onLoad(gltf.scene);
              }
            },
            undefined,
            (err) => {
              console.error('Error loading model:', err);
              setError(err.message);

              if (onError) {
                onError(err);
              }
            }
          );
        } else {
          throw new Error('Invalid model data');
        }
      })
      .catch(err => {
        console.error('Error loading template:', err);
        setError(err.message);

        if (onError) {
          onError(err);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [templateId, parameters, onLoad, onError]);

  if (loading) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f0f0f0',
          borderRadius: '8px',
        }}
      >
        <Spin tip="加载模型中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f0f0f0',
          borderRadius: '8px',
          color: 'red',
        }}
      >
        <p>加载模型失败: {error}</p>
      </div>
    );
  }

  if (!model) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f0f0f0',
          borderRadius: '8px',
        }}
      >
        <p>请选择一个模板查看预览</p>
      </div>
    );
  }

  return (
    <ModelViewer
      width={width}
      height={height}
      model={model}
      autoRotate={true}
    />
  );
}
