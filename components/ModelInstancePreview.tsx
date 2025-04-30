'use client';

/**
 * 模型实例预览组件
 *
 * 该组件用于预览模型实例
 * 它可以从数据库加载模型实例，并在预览窗口中显示
 */

import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Spin, message } from 'antd';
import { templateModelService } from '@/lib/services/templateModelService';
import { templateInstanceService } from '@/lib/services/templateInstanceService';
import ErrorBoundaryEnvironment from './environment/ErrorBoundaryEnvironment';

interface ModelInstancePreviewProps {
  modelId: string;
  width?: string | number;
  height?: string | number;
  scale?: number;
}

export default function ModelInstancePreview({
  modelId,
  width = '100%',
  height = '100%',
  scale = 1
}: ModelInstancePreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  // 加载模型实例
  useEffect(() => {
    if (!modelId) return;

    const loadModelInstance = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Loading model instance: ${modelId}`);

        // 加载模型数据
        const modelData = await templateModelService.loadModelInstance(modelId);
        console.log('Model data loaded:', modelData);

        // 创建场景
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // 从依赖图实例化模型
        await templateInstanceService.instantiateFromDependencyGraph(
          scene,
          modelData.dependencyGraph
        );

        console.log('Model instance loaded successfully');
        setLoading(false);
      } catch (err: any) {
        console.error('Error loading model instance:', err);
        setError(err.message);
        setLoading(false);
        message.error(`加载模型失败: ${err.message}`);
      }
    };

    loadModelInstance();
  }, [modelId]);

  // 渲染模型预览
  return (
    <div style={{
      width,
      height,
      background: '#f0f0f0',
      borderRadius: 8,
      overflow: 'hidden'
    }}>
      {loading ? (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Spin tip="加载模型中..." />
        </div>
      ) : error ? (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'red',
          padding: '20px',
          textAlign: 'center'
        }}>
          <p>加载模型失败: {error}</p>
        </div>
      ) : (
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[5, 5, 5]} />
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />

          {sceneRef.current && (
            <primitive object={sceneRef.current} scale={[scale, scale, scale]} />
          )}

          <OrbitControls />
          <ErrorBoundaryEnvironment preset="sunset" />
        </Canvas>
      )}
    </div>
  );
}
