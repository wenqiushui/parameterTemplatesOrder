'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Spin, Typography, Tabs, Divider, message } from 'antd';
import { ReloadOutlined, BranchesOutlined, ApiOutlined, CodeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// 模板依赖分析结果接口
interface DependencyAnalysisResult {
  templateId: string;
  dependencies: string[];
  generationMode: string;
  hasExternalDependencies: boolean;
}

// 模板元数据接口
interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  generationMode: string;
  parameterSchema: Record<string, any>;
  defaultParameters: Record<string, any>;
  dependencies?: string[];
  version: string;
}

export default function TemplateAdminPage() {
  const [templates, setTemplates] = useState<TemplateMetadata[]>([]);
  const [dependencies, setDependencies] = useState<Record<string, DependencyAnalysisResult>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');

  // 加载模板列表
  useEffect(() => {
    loadTemplates();
  }, []);

  // 加载模板列表
  const loadTemplates = async () => {
    try {
      setLoading(true);
      
      // 加载模板元数据
      const response = await fetch('/api/templates/metadata');
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded templates:', data);
        setTemplates(data);
      } else {
        message.error('Failed to load templates');
      }
      
      // 加载模板依赖分析结果
      const depResponse = await fetch('/api/templates/dependencies');
      if (depResponse.ok) {
        const depData = await depResponse.json();
        console.log('Loaded dependencies:', depData);
        setDependencies(depData);
      } else {
        // 如果API不存在，使用空对象
        setDependencies({});
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      message.error('Error loading templates');
    } finally {
      setLoading(false);
    }
  };

  // 刷新模板列表
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTemplates();
    setRefreshing(false);
  };

  // 分析模板依赖
  const handleAnalyzeDependencies = async () => {
    try {
      setRefreshing(true);
      
      // 调用依赖分析API
      const response = await fetch('/api/templates/analyze-dependencies', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setDependencies(data);
        message.success('Dependencies analyzed successfully');
      } else {
        message.error('Failed to analyze dependencies');
      }
    } catch (error) {
      console.error('Error analyzing dependencies:', error);
      message.error('Error analyzing dependencies');
    } finally {
      setRefreshing(false);
    }
  };

  // 模板列表表格列
  const templateColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <Text code>{text}</Text>
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Generation Mode',
      dataIndex: 'generationMode',
      key: 'generationMode',
      render: (mode: string) => {
        let color = 'green';
        let icon = <CodeOutlined />;
        
        if (mode === 'server') {
          color = 'blue';
          icon = <ApiOutlined />;
        } else if (mode === 'external') {
          color = 'volcano';
          icon = <BranchesOutlined />;
        }
        
        return (
          <Tag color={color} icon={icon}>
            {mode.toUpperCase()}
          </Tag>
        );
      }
    },
    {
      title: 'Dependencies',
      key: 'dependencies',
      render: (_: any, record: TemplateMetadata) => {
        const deps = dependencies[record.id]?.dependencies || [];
        
        if (deps.length === 0) {
          return <Text type="secondary">None</Text>;
        }
        
        return deps.map(dep => (
          <Tag key={dep} color="blue">
            {dep}
          </Tag>
        ));
      }
    },
    {
      title: 'Parameters',
      key: 'parameters',
      render: (_: any, record: TemplateMetadata) => {
        const paramCount = Object.keys(record.parameterSchema || {}).length;
        return paramCount;
      }
    }
  ];

  // 依赖分析表格列
  const dependencyColumns = [
    {
      title: 'Template ID',
      dataIndex: 'templateId',
      key: 'templateId',
      render: (text: string) => <Text code>{text}</Text>
    },
    {
      title: 'Dependencies',
      dataIndex: 'dependencies',
      key: 'dependencies',
      render: (deps: string[]) => {
        if (deps.length === 0) {
          return <Text type="secondary">None</Text>;
        }
        
        return deps.map(dep => (
          <Tag key={dep} color="blue">
            {dep}
          </Tag>
        ));
      }
    },
    {
      title: 'Generation Mode',
      dataIndex: 'generationMode',
      key: 'generationMode',
      render: (mode: string) => {
        let color = 'green';
        let icon = <CodeOutlined />;
        
        if (mode === 'server') {
          color = 'blue';
          icon = <ApiOutlined />;
        } else if (mode === 'external') {
          color = 'volcano';
          icon = <BranchesOutlined />;
        }
        
        return (
          <Tag color={color} icon={icon}>
            {mode.toUpperCase()}
          </Tag>
        );
      }
    },
    {
      title: 'External Dependencies',
      dataIndex: 'hasExternalDependencies',
      key: 'hasExternalDependencies',
      render: (has: boolean) => {
        return has ? (
          <Tag color="volcano">Yes</Tag>
        ) : (
          <Tag color="green">No</Tag>
        );
      }
    }
  ];

  // 渲染加载状态
  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <Title level={2}>Template Management</Title>
        <Card>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" tip="Loading templates..." />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>Template Management</Title>
      <Text>Manage templates and their dependencies</Text>

      <Divider />

      <div style={{ marginBottom: '20px' }}>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={refreshing}
          style={{ marginRight: '10px' }}
        >
          Refresh
        </Button>
        
        <Button
          onClick={handleAnalyzeDependencies}
          loading={refreshing}
        >
          Analyze Dependencies
        </Button>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Templates" key="templates">
          <Card>
            <Table
              dataSource={templates}
              columns={templateColumns}
              rowKey="id"
              pagination={false}
              expandable={{
                expandedRowRender: (record) => {
                  return (
                    <div>
                      <Title level={5}>Parameter Schema</Title>
                      <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                        {JSON.stringify(record.parameterSchema, null, 2)}
                      </pre>
                    </div>
                  );
                },
              }}
            />
          </Card>
        </TabPane>
        
        <TabPane tab="Dependencies" key="dependencies">
          <Card>
            <Table
              dataSource={Object.values(dependencies)}
              columns={dependencyColumns}
              rowKey="templateId"
              pagination={false}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
}
