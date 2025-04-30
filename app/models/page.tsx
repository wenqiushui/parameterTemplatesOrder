'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ModelsPage() {
  const router = useRouter();
  
  // 重定向到优化后的页面
  useEffect(() => {
    router.replace('/models/optimized');
  }, [router]);
  
  // 显示加载中
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <p>正在加载模型库...</p>
    </div>
  );
}
