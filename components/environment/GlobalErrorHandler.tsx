'use client';

import { useEffect } from 'react';

/**
 * 全局错误处理器组件
 * 
 * 这个组件用于捕获和处理全局错误，特别是环境贴图加载错误
 * 它应该被放置在应用的根组件中
 */
export default function GlobalErrorHandler() {
  useEffect(() => {
    // 处理未捕获的错误
    const handleError = (event: ErrorEvent) => {
      // 检查是否是环境贴图相关错误
      if (event.message && (
        event.message.includes('HDR') || 
        event.message.includes('venice_sunset') ||
        event.message.includes('drei-assets') ||
        event.message.includes('environment') ||
        event.message.includes('Could not load')
      )) {
        console.warn('Global error handler caught environment map error:', event.message);
        
        // 阻止错误传播
        event.preventDefault();
        event.stopPropagation();
        
        return true;
      }
      
      return false;
    };
    
    // 添加全局错误处理器
    window.addEventListener('error', handleError, true);
    
    // 处理未捕获的Promise拒绝
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // 检查是否是环境贴图相关错误
      if (event.reason && typeof event.reason.message === 'string' && (
        event.reason.message.includes('HDR') || 
        event.reason.message.includes('venice_sunset') ||
        event.reason.message.includes('drei-assets') ||
        event.reason.message.includes('environment') ||
        event.reason.message.includes('Could not load')
      )) {
        console.warn('Global error handler caught unhandled promise rejection:', event.reason.message);
        
        // 阻止错误传播
        event.preventDefault();
        
        return true;
      }
      
      return false;
    };
    
    // 添加未捕获的Promise拒绝处理器
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // 清理函数
    return () => {
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  return null;
}
