import React, { useState, useEffect } from 'react';
import { Select, Card, Row, Col, Button, message } from 'antd';
import { useEnvironmentStore } from '@/lib/hooks/useEnvironmentStore';

const { Option } = Select;

interface EnvironmentSelectorProps {
  sceneId?: string;
  onChange?: (scene: any) => void;
}

export default function EnvironmentSelector({ sceneId, onChange }: EnvironmentSelectorProps) {
  const { environments, loading, loadEnvironments } = useEnvironmentStore();
  const [scene, setScene] = useState({
    environmentMapId: null,
    backgroundType: 'environment',
    backgroundColor: '#f0f0f0',
    exposure: 1.0,
    toneMapping: 'ACESFilmic'
  });

  // 加载环境贴图列表
  useEffect(() => {
    loadEnvironments();
  }, [loadEnvironments]);

  // 加载场景数据
  useEffect(() => {
    if (!sceneId) return;
    const fetchScene = async () => {
      try {
        const response = await fetch(`/api/scenes/${sceneId}`);
        if (response.ok) {
          const data = await response.json();
          setScene({
            environmentMapId: data.environmentMapId,
            backgroundType: data.backgroundType,
            backgroundColor: data.backgroundColor,
            exposure: data.exposure,
            toneMapping: data.toneMapping
          });
        }
      } catch (error) {
        console.error('Error fetching scene:', error);
      }
    };
    fetchScene();
  }, [sceneId]);

  // 处理环境贴图变更
  const handleEnvironmentChange = (environmentMapId: string | null) => {
    const newScene = { ...scene, environmentMapId };
    setScene(newScene);
    onChange && onChange(newScene);
  };

  return (
    <div className="environment-selector">
      <Card title="环境设置">
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <div style={{ marginBottom: 16 }}>
              <h4>环境贴图</h4>
              <Select
                style={{ width: '100%' }}
                placeholder={loading ? '加载环境贴图中...' : '选择环境贴图'}
                value={scene.environmentMapId}
                onChange={handleEnvironmentChange}
                loading={loading}
              >
                <Option value={null}>无环境贴图</Option>
                {environments.map(env => (
                  <Option key={env.id} value={env.id}>
                    {env.name}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
