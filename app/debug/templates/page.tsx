'use client';

import { useEffect, useState } from 'react';
import { Card, Table, Button, message, Spin, Typography, Tag, Divider } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function TemplateDebugPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);

  // 加载模板列表
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/templates');
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded templates:', data);
        setTemplates(data);
      } else {
        message.error('Failed to load templates');
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      message.error('Error loading templates');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadTemplates();
  }, []);

  // 刷新模板列表
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTemplates();
    setRefreshing(false);
  };

  // 强制注册模板
  const handleForceRegister = async () => {
    try {
      setRegistering(true);
      setRegistrationResult(null);

      const response = await fetch('/api/templates/register', {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Registration result:', result);
        setRegistrationResult(result);
        message.success(`Successfully registered templates. New templates: ${result.newTemplates.join(', ') || 'none'}`);

        // 刷新模板列表
        await loadTemplates();
      } else {
        message.error('Failed to register templates');
      }
    } catch (error) {
      console.error('Error registering templates:', error);
      message.error('Error registering templates');
    } finally {
      setRegistering(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <Text code>{text}</Text>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 'isExternal',
      key: 'type',
      render: (isExternal) => (
        <Tag color={isExternal ? 'volcano' : 'green'}>
          {isExternal ? 'External' : 'Local'}
        </Tag>
      ),
    },
    {
      title: 'Parameters',
      dataIndex: 'parameterSchema',
      key: 'parameters',
      render: (schema) => {
        const paramSchema = typeof schema === 'string' ? JSON.parse(schema) : schema;
        return Object.keys(paramSchema).length;
      },
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>Template Debug</Title>
      <Text>This page shows all registered templates in the system.</Text>

      <Divider />

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={refreshing}
        >
          Refresh Templates
        </Button>

        <Button
          type="default"
          danger
          onClick={handleForceRegister}
          loading={registering}
        >
          Force Register All Templates
        </Button>
      </div>

      {registrationResult && (
        <Card style={{ marginBottom: '20px' }}>
          <Title level={4}>Registration Result</Title>
          <div>
            <Text strong>Before: </Text>
            <Text>{registrationResult.before.join(', ') || 'none'}</Text>
          </div>
          <div>
            <Text strong>Registered: </Text>
            <Text>{registrationResult.registered.join(', ') || 'none'}</Text>
          </div>
          <div>
            <Text strong>After: </Text>
            <Text>{registrationResult.after.join(', ') || 'none'}</Text>
          </div>
          <div>
            <Text strong>New Templates: </Text>
            {registrationResult.newTemplates.length > 0 ? (
              registrationResult.newTemplates.map(id => (
                <Tag color="green" key={id}>{id}</Tag>
              ))
            ) : (
              <Text>None</Text>
            )}
          </div>
        </Card>
      )}

      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" tip="Loading templates..." />
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <Text strong>Total Templates: {templates.length}</Text>
            </div>

            <Table
              dataSource={templates}
              columns={columns}
              rowKey="id"
              pagination={false}
              expandable={{
                expandedRowRender: (record) => {
                  const paramSchema = typeof record.parameterSchema === 'string'
                    ? JSON.parse(record.parameterSchema)
                    : record.parameterSchema;

                  return (
                    <div>
                      <Title level={5}>Parameter Schema</Title>
                      <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                        {JSON.stringify(paramSchema, null, 2)}
                      </pre>
                    </div>
                  );
                },
              }}
            />
          </>
        )}
      </Card>
    </div>
  );
}
