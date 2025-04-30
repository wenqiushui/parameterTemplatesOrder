'use client';

import React, { useState } from 'react';
import { Button, Card, Input, Space, Collapse, Typography, message } from 'antd';
import { BugOutlined, SearchOutlined } from '@ant-design/icons';
import ClearCacheButton from './ClearCacheButton';

const { Panel } = Collapse;
const { Text } = Typography;

/**
 * 调试工具组件
 */
const DebugTools: React.FC = () => {
  const [templateId, setTemplateId] = useState('');
  const [loading, setLoading] = useState(false);

  // 查看模板代码
  const handleViewTemplateCode = async () => {
    if (!templateId) {
      message.warning('请输入模板 ID');
      return;
    }

    try {
      setLoading(true);
      
      // 打开新窗口查看模板代码
      window.open(`/api/templates/debug/${templateId}`, '_blank');
    } catch (error) {
      console.error('Error viewing template code:', error);
      message.error('查看模板代码时出错');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="调试工具" extra={<BugOutlined />} style={{ marginBottom: 16 }}>
      <Collapse>
        <Panel header="缓存管理" key="cache">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>清除浏览器缓存（IndexedDB、localStorage、sessionStorage）</Text>
            <ClearCacheButton />
          </Space>
        </Panel>
        
        <Panel header="模板调试" key="template">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input 
              placeholder="输入模板 ID（例如：chair、window）" 
              value={templateId}
              onChange={e => setTemplateId(e.target.value)}
              onPressEnter={handleViewTemplateCode}
            />
            <Button 
              type="primary" 
              icon={<SearchOutlined />} 
              onClick={handleViewTemplateCode}
              loading={loading}
            >
              查看模板代码
            </Button>
          </Space>
        </Panel>
      </Collapse>
    </Card>
  );
};

export default DebugTools;
