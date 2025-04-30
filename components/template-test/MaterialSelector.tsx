'use client';

import { useState, useEffect } from 'react';
import { Card, Select, Button, Spin, message, Tabs, Radio, Slider, ColorPicker } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;
const { Option } = Select;

export default function MaterialSelector({ modelId, configId }) {
  const [loading, setLoading] = useState(true);
  const [modelData, setModelData] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [materialProperties, setMaterialProperties] = useState({
    color: '#cccccc',
    roughness: 0.5,
    metalness: 0.0
  });
  const [saving, setSaving] = useState(false);

  // 加载模型数据
  useEffect(() => {
    if (!modelId) return;

    // 模拟加载模型数据
    setLoading(true);

    // 模拟数据
    setTimeout(() => {
      const mockModelData = {
        id: modelId,
        name: '测试模型',
        nodes: [
          { id: 'node1', name: '立方体' },
          { id: 'node2', name: '球体' },
          { id: 'node3', name: '圆柱体' }
        ]
      };

      setModelData(mockModelData);

      // 默认选择第一个节点
      setSelectedNode(mockModelData.nodes[0]);
      setLoading(false);
    }, 500);
  }, [modelId]);

  // 加载材质列表
  useEffect(() => {
    // 模拟材质数据
    const mockMaterials = [
      {
        id: 'material1',
        name: '标准材质',
        type: 'standard',
        properties: JSON.stringify({
          color: '#ff0000',
          roughness: 0.5,
          metalness: 0.0
        })
      },
      {
        id: 'material2',
        name: '金属材质',
        type: 'metal',
        properties: JSON.stringify({
          color: '#cccccc',
          roughness: 0.1,
          metalness: 0.9
        })
      },
      {
        id: 'material3',
        name: '光滑材质',
        type: 'glossy',
        properties: JSON.stringify({
          color: '#0000ff',
          roughness: 0.1,
          metalness: 0.0
        })
      }
    ];

    setMaterials(mockMaterials);

    // 默认选择第一个材质
    setSelectedMaterial(mockMaterials[0]);

    // 设置材质属性
    const properties = JSON.parse(mockMaterials[0].properties);
    setMaterialProperties({
      color: properties.color || '#cccccc',
      roughness: properties.roughness || 0.5,
      metalness: properties.metalness || 0.0
    });
  }, []);

  // 处理节点选择
  const handleNodeChange = (nodeId) => {
    const node = modelData.nodes.find(n => n.id === nodeId);
    setSelectedNode(node);
  };

  // 处理材质选择
  const handleMaterialChange = (materialId) => {
    const material = materials.find(m => m.id === materialId);
    setSelectedMaterial(material);

    // 设置材质属性
    const properties = JSON.parse(material.properties);
    setMaterialProperties({
      color: properties.color || '#cccccc',
      roughness: properties.roughness || 0.5,
      metalness: properties.metalness || 0.0
    });
  };

  // 处理材质属性变化
  const handlePropertyChange = (property, value) => {
    setMaterialProperties(prev => ({
      ...prev,
      [property]: value
    }));
  };

  // 保存材质配置
  const handleSaveMaterialConfig = async () => {
    if (!configId || !selectedNode || !selectedMaterial) {
      message.warning('请选择配置、节点和材质');
      return;
    }

    setSaving(true);

    // 模拟保存材质配置
    setTimeout(() => {
      message.success('材质配置已应用到模型');
      setSaving(false);
    }, 500);
  };

  // 创建自定义材质
  const handleCreateCustomMaterial = async () => {
    if (!selectedMaterial) {
      message.warning('请先选择一个基础材质');
      return;
    }

    setSaving(true);

    // 模拟创建新材质
    setTimeout(() => {
      // 生成随机 ID
      const randomId = Math.random().toString(36).substring(2, 15);

      // 创建新材质
      const newMaterial = {
        id: randomId,
        name: `自定义 ${selectedMaterial.name}`,
        type: selectedMaterial.type,
        properties: JSON.stringify(materialProperties)
      };

      // 更新材质列表
      setMaterials(prev => [...prev, newMaterial]);
      setSelectedMaterial(newMaterial);

      message.success('自定义材质已创建');
      setSaving(false);
    }, 500);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin tip="加载中..." />
      </div>
    );
  }

  return (
    <div className="material-selector">
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ width: '300px' }}>
          <Card title="节点选择" style={{ marginBottom: '20px' }}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择节点"
              onChange={handleNodeChange}
              value={selectedNode?.id}
            >
              {modelData?.nodes?.map(node => (
                <Option key={node.id} value={node.id}>
                  {node.name || node.id}
                </Option>
              ))}
            </Select>
          </Card>

          <Card title="材质选择">
            <Select
              style={{ width: '100%', marginBottom: '20px' }}
              placeholder="选择材质"
              onChange={handleMaterialChange}
              value={selectedMaterial?.id}
            >
              {materials.map(material => (
                <Option key={material.id} value={material.id}>
                  {material.name}
                </Option>
              ))}
            </Select>

            <Tabs defaultActiveKey="basic">
              <TabPane tab="基本属性" key="basic">
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ marginBottom: '8px' }}>颜色</div>
                  <ColorPicker
                    value={materialProperties.color}
                    onChange={color => handlePropertyChange('color', color.toHexString())}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ marginBottom: '8px' }}>粗糙度: {materialProperties.roughness}</div>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={materialProperties.roughness}
                    onChange={value => handlePropertyChange('roughness', value)}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ marginBottom: '8px' }}>金属度: {materialProperties.metalness}</div>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={materialProperties.metalness}
                    onChange={value => handlePropertyChange('metalness', value)}
                  />
                </div>
              </TabPane>
            </Tabs>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <Button
                type="primary"
                onClick={handleCreateCustomMaterial}
                loading={saving}
                style={{ flex: 1 }}
              >
                创建自定义材质
              </Button>

              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveMaterialConfig}
                loading={saving}
                disabled={!configId}
                style={{ flex: 1 }}
              >
                应用到模型
              </Button>
            </div>
          </Card>
        </div>

        <div style={{ flex: 1 }}>
          <Card title="材质预览">
            <div style={{
              height: '300px',
              backgroundColor: materialProperties.color,
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#fff',
              textShadow: '0 0 2px rgba(0,0,0,0.5)'
            }}>
              <div>
                <h3>{selectedMaterial?.name || '未选择材质'}</h3>
                <p>粗糙度: {materialProperties.roughness}</p>
                <p>金属度: {materialProperties.metalness}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
