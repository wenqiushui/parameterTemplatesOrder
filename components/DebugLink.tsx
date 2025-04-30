'use client';

import React from 'react';
import { Button } from 'antd';
import { BugOutlined } from '@ant-design/icons';
import Link from 'next/link';

/**
 * 调试页面链接组件
 */
const DebugLink: React.FC = () => {
  return (
    <Link href="/debug" passHref>
      <Button 
        type="text" 
        icon={<BugOutlined />} 
        title="调试工具"
      >
        调试
      </Button>
    </Link>
  );
};

export default DebugLink;
