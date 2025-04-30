'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Spin, message, Button } from 'antd';
import { templateLoaderService } from '@/lib/services/templateLoaderService';
import { templateCacheService, TemplateMetadata } from '@/lib/services/templateCacheService';
import { DynamicParametricComponent } from '@/components/parametric';
import ErrorBoundaryEnvironment from './environment/ErrorBoundaryEnvironment';

// 模型加载器组件
const ModelLoader = ({ url, scale = 1 }) => {
  // 使用状态跟踪 URL 变化，并添加随机数强制重新加载
  const [modelUrl, setModelUrl] = useState(url);

  // 当 URL 变化时更新 modelUrl
  useEffect(() => {
    // 添加随机数强制重新加载
    const timestamp = new Date().getTime();
    const randomSuffix = Math.floor(Math.random() * 1000000);
    const newUrl = `${url}${url.includes('?') ? '&' : '?'}_t=${timestamp}_${randomSuffix}`;
    console.log('Updating model URL with cache busting:', newUrl);
    setModelUrl(newUrl);
  }, [url]);

  // 每次 URL 变化时都重新加载模型
  const { scene } = useGLTF(modelUrl);

  useEffect(() => {
    console.log('Loading model from URL:', url);

    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // 清除缓存，确保下次加载时重新获取模型
    return () => {
      useGLTF.preload(modelUrl);
    };
  }, [url, scene, modelUrl]);

  return (
    <primitive
      object={scene}
      scale={[scale, scale, scale]}
      position={[0, 0, 0]}
    />
  );
};

// 懒加载模型预览组件
const LazyModelPreview = forwardRef(function LazyModelPreview(props, ref) {
  const { templateId, parameters, scale = 1 } = props;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [modelData, setModelData] = useState(null);
  const [shouldLoadModel, setShouldLoadModel] = useState(false);

  // 暴露 setShouldLoadModel 方法给父组件
  useImperativeHandle(ref, () => ({
    setShouldLoadModel: (value) => {
      setShouldLoadModel(value);
    }
  }));

  // 只加载模板元数据，不加载模型
  useEffect(() => {
    const loadMetadata = async () => {
      if (!templateId) return;

      try {
        // 加载所有模板元数据
        const allMetadata = await templateLoaderService.loadTemplateMetadata();

        // 查找当前模板的元数据
        const templateMetadata = allMetadata.find(m => m.id === templateId);

        if (!templateMetadata) {
          throw new Error(`Template metadata not found for ${templateId}`);
        }

        setMetadata(templateMetadata);

        // 重置模型加载状态
        setShouldLoadModel(false);
        setModelData(null);

        // 检查模板是否已经在客户端模板注册表中
        try {
          // 导入客户端模板管理器
          const { getTemplateRegistry } = await import('@/lib/templates/registry/templateRegistryFactory');
          const registry = getTemplateRegistry();

          // 检查模板是否已加载
          if (registry.has(templateId)) {
            console.log(`Template ${templateId} already loaded in registry`);
          } else {
            console.log(`Template ${templateId} not loaded in registry yet`);

            // 检查缓存中是否有模板代码
            const cachedCode = await templateCacheService.getTemplateCode(templateId, templateMetadata.version);
            if (cachedCode) {
              console.log(`Found cached code for template ${templateId}, will use it when generating model`);
            }
          }
        } catch (e) {
          console.warn(`Failed to check template registry for ${templateId}:`, e);
          // 继续执行，不中断流程
        }
      } catch (err) {
        console.error('Error loading template metadata:', err);
        setError(err.message);
      }
    };

    loadMetadata();
  }, [templateId]);

  // 当点击生成模型按钮时，加载模型
  useEffect(() => {
    const loadModel = async () => {
      if (!templateId || !metadata || !shouldLoadModel) return;

      try {
        setLoading(true);
        setError(null);

        console.log(`Loading model for template ${templateId} with parameters:`, parameters);
        console.log(`Template metadata:`, metadata);
        console.log(`Template generation mode:`, metadata.generationMode);

        // 检查模板生成模式
        if (metadata.generationMode !== 'browser' && metadata.generationMode !== 'server' && metadata.generationMode !== 'external') {
          console.warn(`Invalid generation mode: ${metadata.generationMode}, defaulting to 'browser'`);
          metadata.generationMode = 'browser';
        }

        // 检查模板代码是否已缓存
        let isCached = false;
        try {
          const cachedCode = await templateCacheService.getTemplateCode(templateId, metadata.version);
          isCached = !!cachedCode;
          console.log(`Template ${templateId} code is ${isCached ? 'cached' : 'not cached'}`);
        } catch (e) {
          console.warn(`Failed to check template cache for ${templateId}:`, e);
        }

        // 记录模板使用
        try {
          await templateCacheService.recordTemplateUsage(templateId);
          console.log(`Recorded usage for template ${templateId}`);
        } catch (e) {
          console.warn(`Failed to record template usage for ${templateId}:`, e);
          // 继续执行，不中断流程
        }

        // 生成模型
        try {
          console.log(`Generating model for template ${templateId}...`);
          const model = await templateLoaderService.generateModel(
            templateId,
            parameters,
            metadata
          );

          console.log(`Generated model data:`, model);
          setModelData(model);
        } catch (error) {
          console.error(`Error generating model for template ${templateId}:`, error);
          throw error; // 重新抛出错误，让外层 catch 块处理
        }
      } catch (err) {
        console.error('Error loading model:', err);
        setError(err.message);

        // 显示错误消息
        message.error({
          content: `加载模型失败: ${err.message}`,
          duration: 5, // 显示5秒
          style: {
            marginTop: '20vh',
          },
        });
      } finally {
        setLoading(false);
      }
    };

    loadModel();
  }, [templateId, parameters, metadata, shouldLoadModel]);

  // 渲染加载状态
  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f0f0f0',
        borderRadius: 8
      }}>
        <Spin tip="加载模型中..." />
      </div>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f0f0f0',
        borderRadius: 8,
        color: 'red'
      }}>
        <p>加载模型失败: {error}</p>
      </div>
    );
  }

  // 如果没有模板ID或元数据，显示提示
  if (!templateId || !metadata) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f0f0f0',
        borderRadius: 8
      }}>
        <p>请选择一个模板查看预览</p>
      </div>
    );
  }

  // 如果没有模型数据，显示提示
  if (!modelData && !loading) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        background: '#f0f0f0',
        borderRadius: 8
      }}>
        <p>请点击"生成模型"按钮生成模型</p>
        <Button
          type="primary"
          onClick={() => setShouldLoadModel(true)}
          style={{ marginTop: 16 }}
        >
          生成模型
        </Button>
      </div>
    );
  }

  // 渲染模型预览
  return (
    <div style={{ width: '100%', height: '100%', background: '#f0f0f0', borderRadius: 8 }}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[3, 3, 3]} />
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* 根据生成模式选择不同的渲染方式 */}
        {metadata.generationMode === 'browser' && modelData?.modelData === 'browser-generated-model' && (
          // 浏览器端生成的模型
          // 使用动态参数化组件系统
          <>
            {/* 添加调试信息 */}
            <group position={[0, -2, 0]}>
              <mesh visible={false}>
                <boxGeometry args={[0.1, 0.1, 0.1]} />
                <meshBasicMaterial color="red" />
              </mesh>
            </group>

            {/* 尝试使用模板的createModel方法 */}
            {(() => {
              try {
                // 获取模板实例
                const { getTemplateRegistry } = require('@/lib/templates/registry/templateRegistryFactory');
                const registry = getTemplateRegistry();

                if (registry.has(templateId)) {
                  console.log(`Using template registry to create model for ${templateId} in LazyModelPreview`);
                  const template = registry.get(templateId);

                  // 设置参数
                  template.setParameters(parameters);

                  // 使用addToPreviewWindow方法直接添加到场景
                  return (
                    <group>
                      {React.createElement(() => {
                        const [model, setModel] = useState(null);

                        useEffect(() => {
                          const createModelAsync = async () => {
                            try {
                              // 创建模型
                              const newModel = await template.createModel();
                              setModel(newModel);
                              console.log(`Model created successfully for ${templateId} in LazyModelPreview`);
                            } catch (error) {
                              console.error(`Error creating model for ${templateId} in LazyModelPreview:`, error);
                            }
                          };

                          createModelAsync();
                        }, [parameters]);

                        return model ? <primitive object={model} /> : null;
                      })}
                    </group>
                  );
                }
              } catch (error) {
                console.error(`Error using template registry for ${templateId} in LazyModelPreview:`, error);
              }

              // 如果无法使用模板的createModel方法，使用参数化组件
              console.log(`Using parametric component for ${templateId} in LazyModelPreview`);
              return (
                <DynamicParametricComponent
                  templateId={templateId}
                  parameters={parameters}
                />
              );
            })()}
          </>
        )}

        {/* 服务器端生成的模型 */}
        {(metadata.generationMode === 'server' || metadata.generationMode === 'external') && (
          modelData?.modelUrl ? (
            <ModelLoader url={modelData.modelUrl} scale={scale} />
          ) : modelData?.primitiveData ? (
            // 处理原始数据响应
            modelData.primitiveData.type === 'primitive' && modelData.primitiveData.geometry === 'box' ? (
              <mesh>
                <boxGeometry args={[
                  modelData.primitiveData.parameters.width || 1,
                  modelData.primitiveData.parameters.height || 1,
                  modelData.primitiveData.parameters.depth || 1
                ]} />
                <meshStandardMaterial color={modelData.primitiveData.material.color || '#3080e8'} />
              </mesh>
            ) : modelData.primitiveData.type === 'primitive' && modelData.primitiveData.geometry === 'chair' ? (
              // 简单的椅子模型
              <group>
                {/* 座位 */}
                <mesh position={[0, modelData.primitiveData.parameters.seatHeight || 0.45, 0]}>
                  <boxGeometry args={[
                    modelData.primitiveData.parameters.seatWidth || 0.5,
                    0.05,
                    modelData.primitiveData.parameters.seatDepth || 0.5
                  ]} />
                  <meshStandardMaterial color={modelData.primitiveData.material.color || '#8B4513'} />
                </mesh>

                {/* 靠背 */}
                <mesh position={[
                  0,
                  (modelData.primitiveData.parameters.seatHeight || 0.45) + (modelData.primitiveData.parameters.backHeight || 0.8) / 2,
                  -(modelData.primitiveData.parameters.seatDepth || 0.5) / 2 + 0.025
                ]}>
                  <boxGeometry args={[
                    modelData.primitiveData.parameters.seatWidth || 0.5,
                    modelData.primitiveData.parameters.backHeight || 0.8,
                    0.05
                  ]} />
                  <meshStandardMaterial color={modelData.primitiveData.material.color || '#8B4513'} />
                </mesh>

                {/* 腿 */}
                {[
                  [-1, 1], // 前左
                  [1, 1],  // 前右
                  [-1, -1], // 后左
                  [1, -1]   // 后右
                ].map(([x, z], index) => (
                  <mesh key={index} position={[
                    x * ((modelData.primitiveData.parameters.seatWidth || 0.5) / 2 - (modelData.primitiveData.parameters.legThickness || 0.04) / 2),
                    (modelData.primitiveData.parameters.seatHeight || 0.45) / 2,
                    z * ((modelData.primitiveData.parameters.seatDepth || 0.5) / 2 - (modelData.primitiveData.parameters.legThickness || 0.04) / 2)
                  ]}>
                    <boxGeometry args={[
                      modelData.primitiveData.parameters.legThickness || 0.04,
                      modelData.primitiveData.parameters.seatHeight || 0.45,
                      modelData.primitiveData.parameters.legThickness || 0.04
                    ]} />
                    <meshStandardMaterial color={modelData.primitiveData.material.color || '#8B4513'} />
                  </mesh>
                ))}
              </group>
            ) : (
              // 未知几何体
              <mesh>
                <sphereGeometry args={[0.5, 32, 32]} />
                <meshStandardMaterial color="red" />
              </mesh>
            )
          ) : null
        )}

        <OrbitControls />
        {/* 使用错误边界环境组件替代原始Environment组件 */}
        <ErrorBoundaryEnvironment preset="sunset" />
        <gridHelper args={[10, 10, 0x888888, 0x444444]} />
      </Canvas>
    </div>
  );
});

export default LazyModelPreview;
