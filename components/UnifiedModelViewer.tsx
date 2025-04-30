'use client';

/**
 * 统一模型预览组件
 *
 * 该组件用于预览不同来源的模型
 * 它可以显示GLB URL、模型实例ID或模板ID和参数
 */

import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { Spin, message } from 'antd';
import LazyModelPreview from './LazyModelPreview';
import ModelInstancePreview from './ModelInstancePreview';
import GLBModelViewer from './GLBModelViewer';

interface UnifiedModelViewerProps {
  // 通用属性
  width?: string | number;
  height?: string | number;
  
  // 数据源 - 只需提供其中一种
  modelUrl?: string;           // 用于产品页面的 GLB URL
  modelInstanceId?: string;    // 用于从数据库加载模型实例
  templateId?: string;         // 用于模板预览
  parameters?: Record<string, any>; // 用于模板参数
  
  // 交互控制
  enableRotate?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  
  // 回调函数
  onLoad?: (model: THREE.Object3D) => void;
  onError?: (error: Error) => void;
}

export default function UnifiedModelViewer({
  width = '100%',
  height = '100%',
  modelUrl,
  modelInstanceId,
  templateId,
  parameters,
  enableRotate = true,
  enableZoom = true,
  enablePan = true,
  onLoad,
  onError,
}: UnifiedModelViewerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 处理错误
  const handleError = (err: any) => {
    console.error('Error in UnifiedModelViewer:', err);
    const errorMessage = err.message || '加载模型失败';
    setError(errorMessage);
    
    if (onError) {
      onError(err);
    } else {
      message.error(`加载模型失败: ${errorMessage}`);
    }
  };
  
  // 根据提供的属性选择不同的渲染方式
  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <Spin tip="加载模型中..." />
        </div>
      );
    }
    
    if (error) {
      return (
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
      );
    }
    
    if (modelUrl) {
      // 使用 GLB URL 渲染模型（产品页面）
      return <GLBModelViewer 
        url={modelUrl} 
        enableRotate={enableRotate}
        enableZoom={enableZoom}
        enablePan={enablePan}
        onLoad={onLoad}
        onError={handleError}
      />;
    }
    
    if (modelInstanceId) {
      // 从数据库加载模型实例（模型库页面 - 实例）
      return <ModelInstancePreview 
        modelId={modelInstanceId} 
        width="100%" 
        height="100%" 
      />;
    }
    
    if (templateId && parameters) {
      // 使用模板和参数渲染模型（模型库页面 - 模板）
      return <LazyModelPreview 
        templateId={templateId} 
        parameters={parameters} 
        scale={1}
      />;
    }
    
    // 如果没有提供有效的数据源
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        background: '#f0f0f0' 
      }}>
        <p>请提供有效的模型数据</p>
      </div>
    );
  };
  
  return (
    <div style={{ 
      width, 
      height, 
      background: '#f0f0f0', 
      borderRadius: 8,
      overflow: 'hidden'
    }}>
      {renderContent()}
    </div>
  );
}
