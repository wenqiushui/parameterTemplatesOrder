import React from 'react';
import { Card, Typography } from 'antd';
import DebugTools from '@/components/DebugTools';

const { Title, Paragraph } = Typography;

/**
 * 调试页面
 */
export default function DebugPage() {
  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>调试页面</Title>
      <Paragraph>
        此页面提供了一些调试工具，帮助您解决模板加载和显示问题。
      </Paragraph>
      
      <DebugTools />
      
      <Card title="常见问题" style={{ marginTop: 16 }}>
        <Typography>
          <Title level={4}>模板加载失败</Title>
          <Paragraph>
            如果模板加载失败，可能是因为浏览器缓存了旧的模板代码或元数据。
            尝试使用上面的"清除缓存"按钮清除浏览器缓存，然后刷新页面。
          </Paragraph>
          
          <Title level={4}>模板显示错误</Title>
          <Paragraph>
            如果模板显示错误（例如，椅子模板显示为立方体），可能是因为模板代码中的接口定义没有被正确处理。
            尝试使用"查看模板代码"按钮查看原始模板代码，确认接口定义是否正确。
          </Paragraph>
          
          <Title level={4}>浏览器控制台报错</Title>
          <Paragraph>
            如果浏览器控制台报错，可能是因为模板代码中的语法错误或其他问题。
            尝试使用"查看模板代码"按钮查看原始模板代码，确认是否有语法错误。
          </Paragraph>
        </Typography>
      </Card>
    </div>
  );
}
