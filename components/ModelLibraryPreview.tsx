'use client';

import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import ModelViewer from './core/ModelViewer';
import { Spin } from 'antd';

interface ModelLibraryPreviewProps {
  modelUrl?: string;
  width?: string | number;
  height?: string | number;
  onLoad?: (model: THREE.Object3D) => void;
  onError?: (error: Error) => void;
}

export default function ModelLibraryPreview({
  modelUrl,
  width = '100%',
  height = '100%',
  onLoad,
  onError,
}: ModelLibraryPreviewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  
  useEffect(() => {
    if (!modelUrl) return;
    
    setLoading(true);
    setError(null);
    
    const loader = new GLTFLoader();
    
    // 添加时间戳避免缓存
    const url = new URL(modelUrl, window.location.href);
    url.searchParams.append('t', Date.now().toString());
    
    loader.load(
      url.toString(),
      (gltf) => {
        setModel(gltf.scene);
        setLoading(false);
        
        if (onLoad) {
          onLoad(gltf.scene);
        }
      },
      undefined,
      (err) => {
        console.error('Error loading model:', err);
        setError(err.message);
        setLoading(false);
        
        if (onError) {
          onError(err);
        }
      }
    );
  }, [modelUrl, onLoad, onError]);
  
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
        <p>请选择一个模型查看预览</p>
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
