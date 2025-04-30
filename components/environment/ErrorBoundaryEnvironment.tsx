'use client';

import React, { useEffect, useState } from 'react';
import { Environment } from '@react-three/drei';

interface ErrorBoundaryEnvironmentProps {
  preset?: string;
  background?: boolean;
  children?: React.ReactNode;
}

/**
 * 环境贴图错误边界组件
 * 
 * 这个组件包装了@react-three/drei的Environment组件，
 * 添加了错误处理，确保环境贴图加载失败不会导致整个应用崩溃
 */
export default function ErrorBoundaryEnvironment({
  preset = 'sunset',
  background = false,
  children
}: ErrorBoundaryEnvironmentProps) {
  const [hasError, setHasError] = useState(false);

  // 捕获错误
  useEffect(() => {
    // 添加全局错误处理
    const handleError = (event: ErrorEvent) => {
      // 只处理与环境贴图相关的错误
      if (event.message && (
        event.message.includes('HDR') || 
        event.message.includes('venice_sunset') ||
        event.message.includes('drei-assets') ||
        event.message.includes('environment')
      )) {
        console.warn('Environment map loading error caught:', event.message);
        setHasError(true);
        
        // 阻止错误传播
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // 添加错误监听器
    window.addEventListener('error', handleError);
    
    // 清理函数
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  // 如果发生错误，返回一个基本的环境光照
  if (hasError) {
    return (
      <>
        <ambientLight intensity={1.0} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        {children}
      </>
    );
  }

  // 尝试加载环境贴图
  try {
    return (
      <>
        <Environment 
          preset={preset} 
          background={background}
        />
        {children}
      </>
    );
  } catch (error) {
    console.warn('Error rendering Environment component:', error);
    
    // 发生错误时返回基本光照
    return (
      <>
        <ambientLight intensity={1.0} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        {children}
      </>
    );
  }
}
