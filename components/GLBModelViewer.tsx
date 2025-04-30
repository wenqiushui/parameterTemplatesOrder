'use client';

/**
 * GLB 模型查看器组件
 *
 * 该组件用于加载和显示 GLB 文件
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Spin } from 'antd';
import ErrorBoundaryEnvironment from './environment/ErrorBoundaryEnvironment';

interface GLBModelViewerProps {
  url: string;
  width?: string | number;
  height?: string | number;
  scale?: number;
  enableRotate?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  onLoad?: (model: THREE.Object3D) => void;
  onError?: (error: Error) => void;
}

// 模型加载组件
function Model({
  url,
  scale = 1,
  onLoad,
  onError
}: {
  url: string;
  scale?: number;
  onLoad?: (model: THREE.Object3D) => void;
  onError?: (error: Error) => void;
}) {
  const { scene, animations } = useGLTF(url) as GLTF;
  const { camera } = useThree();

  useEffect(() => {
    if (scene) {
      // 计算包围盒
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // 调整相机位置
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 1.5; // 增加一些距离，确保模型完全可见

      camera.position.set(center.x, center.y, center.z + cameraZ);
      camera.lookAt(center);
      camera.updateProjectionMatrix();

      // 调用加载完成回调
      if (onLoad) {
        onLoad(scene);
      }
    }
  }, [scene, camera, onLoad]);

  // 克隆场景以避免修改原始对象
  const clonedScene = useMemo(() => scene?.clone(), [scene]);

  if (!clonedScene) {
    return null;
  }

  return (
    <primitive
      object={clonedScene}
      scale={[scale, scale, scale]}
      dispose={null}
    />
  );
}

export default function GLBModelViewer({
  url,
  width = '100%',
  height = '100%',
  scale = 1,
  enableRotate = true,
  enableZoom = true,
  enablePan = true,
  onLoad,
  onError
}: GLBModelViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 预加载模型
  useEffect(() => {
    if (!url) return;

    setLoading(true);
    setError(null);

    // 使用 useGLTF 的预加载功能
    useGLTF.preload(url)
      .then(() => {
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error preloading GLB:', err);
        setError(err.message || '加载模型失败');
        setLoading(false);

        if (onError) {
          onError(err);
        }
      });

    // 清理函数
    return () => {
      useGLTF.dispose(url);
    };
  }, [url, onError]);

  // 处理加载完成
  const handleLoad = (model: THREE.Object3D) => {
    setLoading(false);

    if (onLoad) {
      onLoad(model);
    }
  };

  // 处理加载错误
  const handleError = (err: Error) => {
    setLoading(false);
    setError(err.message || '加载模型失败');

    if (onError) {
      onError(err);
    }
  };

  return (
    <div style={{ width, height }}>
      {loading ? (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f0f0f0'
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
          textAlign: 'center',
          background: '#f0f0f0'
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

          <Model
            url={url}
            scale={scale}
            onLoad={handleLoad}
            onError={handleError}
          />

          <OrbitControls
            enableRotate={enableRotate}
            enableZoom={enableZoom}
            enablePan={enablePan}
          />
          <ErrorBoundaryEnvironment preset="sunset" />
        </Canvas>
      )}
    </div>
  );
}
