'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Tabs, Input, message } from 'antd';
import Viewer3D from './Viewer3D';
import NodeSelector from './NodeSelector';
import MeshSelector from './MeshSelector';
import MaterialSelector from './MaterialSelector';
import MaterialEditor from '../material-editor/MaterialEditor';
import EnvironmentSelector from '../environment/EnvironmentSelector';
import { useModelStore } from '@/lib/hooks/useModelStore';
import { useNodeStore } from '@/lib/hooks/useNodeStore';
import { useMeshStore } from '@/lib/hooks/useMeshStore';
import { useMaterialStore } from '@/lib/hooks/useMaterialStore';

export default function Configurator({ productId, initialData = null, configId = null }) {
  const router = useRouter();
  const [configName, setConfigName] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [activeTab, setActiveTab] = useState('node');
  const [scene, setScene] = useState(null);

  // 使用自定义 hooks
  const { setProductData } = useModelStore();
  const { currentNodeData } = useNodeStore();
  const { selectedMeshData } = useMeshStore();
  const { selectedMeshMaterial } = useMaterialStore();

  // 初始化产品数据
  useEffect(() => {
    if (initialData) {
      setProductData(initialData);
    } else {
      // 如果没有初始数据，从 API 获取
      fetch(`/api/models/${productId}`)
        .then(res => res.json())
        .then(data => {
          setProductData(data);
        })
        .catch(error => {
          console.error('Error loading product data:', error);
          message.error('加载产品数据失败');
        });
    }
  }, [productId, initialData, setProductData]);

  // 处理节点选择
  const handleNodeSelect = (nodeId) => {
    setSelectedNodeId(nodeId);
    // 如果选择了节点，自动切换到材质编辑选项卡
    if (nodeId && activeTab !== 'material') {
      setActiveTab('material');
    }
  };

  // 处理场景变更
  const handleSceneChange = (newScene) => {
    setScene(newScene);
  };

  // 保存配置
  const saveConfiguration = async () => {
    if (!configName) {
      message.warning('请输入配置名称');
      return;
    }

    setSaving(true);

    try {
      // 收集材质覆盖信息
      const materialOverrides = {};

      if (selectedMeshData && selectedMeshMaterial) {
        selectedMeshData.forEach(data => {
          if (data.materialId) {
            materialOverrides[data.nodeId] = data.materialId;
          }
        });
      }

      // 发送到 API
      const response = await fetch('/api/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelId: productId,
          name: configName,
          materialOverrides,
          sceneId: scene?.id // 包含场景ID
        })
      });

      if (!response.ok) {
        throw new Error('保存配置失败');
      }

      const result = await response.json();

      message.success('配置保存成功');

      // 导航到配置详情页
      router.push(`/configurations/${result.configId}`);
    } catch (error) {
      console.error('Error saving configuration:', error);
      message.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="configurator" style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      <div className="configurator-sidebar" style={{ width: '350px', padding: '20px', borderRight: '1px solid #f0f0f0', overflowY: 'auto' }}>
        <Card title="产品配置">
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <Tabs.TabPane key="node" tab="选择部件">
              <NodeSelector onSelect={handleNodeSelect} selectedNodeId={selectedNodeId} />
            </Tabs.TabPane>

            {currentNodeData && (
              <Tabs.TabPane key="mesh" tab="选择网格">
                <MeshSelector />
              </Tabs.TabPane>
            )}

            <Tabs.TabPane key="material" tab="材质编辑">
              {selectedNodeId ? (
                <MaterialEditor
                  nodeId={selectedNodeId}
                  configId={configId}
                />
              ) : (
                <div className="empty-state" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  请先选择一个节点来编辑其材质
                </div>
              )}
            </Tabs.TabPane>

            <Tabs.TabPane key="environment" tab="环境设置">
              <EnvironmentSelector
                sceneId={scene?.id}
                onChange={handleSceneChange}
              />
            </Tabs.TabPane>
          </Tabs>

          <div className="save-configuration" style={{ marginTop: '20px' }}>
            <Input
              placeholder="配置名称"
              value={configName}
              onChange={e => setConfigName(e.target.value)}
              style={{ marginBottom: '10px' }}
            />

            <Button
              type="primary"
              onClick={saveConfiguration}
              loading={saving}
              block
            >
              保存配置
            </Button>
          </div>
        </Card>
      </div>

      <div className="configurator-main" style={{ flex: 1 }}>
        <Viewer3D
          highlightedNodeId={selectedNodeId}
          onNodeSelect={handleNodeSelect}
          scene={scene}
        />
      </div>
    </div>
  );
}
