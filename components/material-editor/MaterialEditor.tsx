import React, { useState, useEffect } from 'react';
import { Card, Tabs, Form, Input, InputNumber, Select, Button, Slider, ColorPicker, message, Spin } from 'antd';
import { SaveOutlined, UndoOutlined, PlusOutlined } from '@ant-design/icons';
import TextureSelector from './TextureSelector';
import { useMaterialStore } from '@/lib/hooks/useMaterialStore';

const { TabPane } = Tabs;
const { Option } = Select;

interface MaterialEditorProps {
  nodeId: string;
  configId: string;
}

export default function MaterialEditor({ nodeId, configId }: MaterialEditorProps) {
  const { 
    materials, 
    loading, 
    selectedMaterial,
    loadMaterials,
    loadMaterialApplication,
    saveMaterialApplication,
    selectMaterial,
    updateMaterialProperty
  } = useMaterialStore();
  
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('base');
  const [saving, setSaving] = useState(false);
  
  // 加载材质列表和当前节点的材质应用
  useEffect(() => {
    if (nodeId && configId) {
      loadMaterials();
      loadMaterialApplication(configId, nodeId);
    }
  }, [nodeId, configId, loadMaterials, loadMaterialApplication]);
  
  // 当选中的材质变化时，更新表单
  useEffect(() => {
    if (selectedMaterial) {
      form.setFieldsValue({
        materialId: selectedMaterial.id,
        ...selectedMaterial.baseProperties
      });
    } else {
      form.resetFields();
    }
  }, [selectedMaterial, form]);
  
  // 处理材质选择
  const handleMaterialChange = (materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      selectMaterial(material);
    }
  };
  
  // 处理属性变更
  const handlePropertyChange = (property: string, value: any) => {
    updateMaterialProperty(property, value);
  };
  
  // 处理贴图选择
  const handleTextureSelect = (mapType: string, textureId: string) => {
    const maps = { ...(selectedMaterial?.maps || {}) };
    maps[mapType] = textureId;
    updateMaterialProperty('maps', maps);
  };
  
  // 处理保存
  const handleSave = async () => {
    if (!selectedMaterial || !nodeId || !configId) return;
    
    setSaving(true);
    try {
      await saveMaterialApplication(configId, nodeId, selectedMaterial.id);
      message.success('材质已应用到模型');
    } catch (error) {
      console.error('Error saving material application:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };
  
  // 渲染基础属性编辑器
  const renderBaseProperties = () => {
    if (!selectedMaterial) return null;
    
    const { type } = selectedMaterial;
    
    // 根据材质类型渲染不同的属性编辑器
    switch (type) {
      case 'standard':
        return (
          <div className="property-editor">
            <Form form={form} layout="vertical">
              <Form.Item label="颜色" name="color">
                <ColorPicker
                  value={selectedMaterial.baseProperties.color}
                  onChange={(color) => handlePropertyChange('color', color.toHexString())}
                />
              </Form.Item>
              
              <Form.Item label="金属度" name="metalness">
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={selectedMaterial.baseProperties.metalness}
                  onChange={(value) => handlePropertyChange('metalness', value)}
                />
              </Form.Item>
              
              <Form.Item label="粗糙度" name="roughness">
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={selectedMaterial.baseProperties.roughness}
                  onChange={(value) => handlePropertyChange('roughness', value)}
                />
              </Form.Item>
              
              <Form.Item label="环境光遮蔽强度" name="aoMapIntensity">
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={selectedMaterial.baseProperties.aoMapIntensity}
                  onChange={(value) => handlePropertyChange('aoMapIntensity', value)}
                />
              </Form.Item>
              
              <Form.Item label="法线贴图强度" name="normalScale">
                <Slider
                  min={0}
                  max={2}
                  step={0.01}
                  value={selectedMaterial.baseProperties.normalScale}
                  onChange={(value) => handlePropertyChange('normalScale', value)}
                />
              </Form.Item>
              
              <Form.Item label="发光强度" name="emissiveIntensity">
                <Slider
                  min={0}
                  max={2}
                  step={0.01}
                  value={selectedMaterial.baseProperties.emissiveIntensity}
                  onChange={(value) => handlePropertyChange('emissiveIntensity', value)}
                />
              </Form.Item>
              
              <Form.Item label="发光颜色" name="emissive">
                <ColorPicker
                  value={selectedMaterial.baseProperties.emissive}
                  onChange={(color) => handlePropertyChange('emissive', color.toHexString())}
                />
              </Form.Item>
            </Form>
          </div>
        );
        
      case 'physical':
        return (
          <div className="property-editor">
            <Form form={form} layout="vertical">
              <Form.Item label="颜色" name="color">
                <ColorPicker
                  value={selectedMaterial.baseProperties.color}
                  onChange={(color) => handlePropertyChange('color', color.toHexString())}
                />
              </Form.Item>
              
              <Form.Item label="金属度" name="metalness">
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={selectedMaterial.baseProperties.metalness}
                  onChange={(value) => handlePropertyChange('metalness', value)}
                />
              </Form.Item>
              
              <Form.Item label="粗糙度" name="roughness">
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={selectedMaterial.baseProperties.roughness}
                  onChange={(value) => handlePropertyChange('roughness', value)}
                />
              </Form.Item>
              
              <Form.Item label="透明度" name="transmission">
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={selectedMaterial.baseProperties.transmission}
                  onChange={(value) => handlePropertyChange('transmission', value)}
                />
              </Form.Item>
              
              <Form.Item label="折射率" name="ior">
                <Slider
                  min={1}
                  max={2.33}
                  step={0.01}
                  value={selectedMaterial.baseProperties.ior}
                  onChange={(value) => handlePropertyChange('ior', value)}
                />
              </Form.Item>
              
              <Form.Item label="厚度" name="thickness">
                <Slider
                  min={0}
                  max={5}
                  step={0.1}
                  value={selectedMaterial.baseProperties.thickness}
                  onChange={(value) => handlePropertyChange('thickness', value)}
                />
              </Form.Item>
              
              <Form.Item label="清晰度" name="clearcoat">
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={selectedMaterial.baseProperties.clearcoat}
                  onChange={(value) => handlePropertyChange('clearcoat', value)}
                />
              </Form.Item>
              
              <Form.Item label="清晰度粗糙度" name="clearcoatRoughness">
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={selectedMaterial.baseProperties.clearcoatRoughness}
                  onChange={(value) => handlePropertyChange('clearcoatRoughness', value)}
                />
              </Form.Item>
            </Form>
          </div>
        );
        
      case 'toon':
        return (
          <div className="property-editor">
            <Form form={form} layout="vertical">
              <Form.Item label="颜色" name="color">
                <ColorPicker
                  value={selectedMaterial.baseProperties.color}
                  onChange={(color) => handlePropertyChange('color', color.toHexString())}
                />
              </Form.Item>
              
              <Form.Item label="色阶数量" name="gradientMap">
                <Select
                  value={selectedMaterial.baseProperties.gradientMap}
                  onChange={(value) => handlePropertyChange('gradientMap', value)}
                >
                  <Option value="threeTone">三色阶</Option>
                  <Option value="fourTone">四色阶</Option>
                  <Option value="fiveTone">五色阶</Option>
                </Select>
              </Form.Item>
            </Form>
          </div>
        );
        
      default:
        return (
          <div className="empty-state">
            不支持的材质类型
          </div>
        );
    }
  };
  
  // 渲染贴图编辑器
  const renderTextureEditor = () => {
    if (!selectedMaterial) return null;
    
    const { type } = selectedMaterial;
    const maps = selectedMaterial.maps || {};
    
    // 根据材质类型渲染不同的贴图编辑器
    switch (type) {
      case 'standard':
      case 'physical':
        return (
          <div className="texture-editor">
            <div className="texture-selector">
              <h4>颜色贴图</h4>
              <TextureSelector
                type="baseColor"
                value={maps.map}
                onChange={(textureId) => handleTextureSelect('map', textureId)}
              />
            </div>
            
            <div className="texture-selector">
              <h4>法线贴图</h4>
              <TextureSelector
                type="normal"
                value={maps.normalMap}
                onChange={(textureId) => handleTextureSelect('normalMap', textureId)}
              />
            </div>
            
            <div className="texture-selector">
              <h4>金属度贴图</h4>
              <TextureSelector
                type="metalness"
                value={maps.metalnessMap}
                onChange={(textureId) => handleTextureSelect('metalnessMap', textureId)}
              />
            </div>
            
            <div className="texture-selector">
              <h4>粗糙度贴图</h4>
              <TextureSelector
                type="roughness"
                value={maps.roughnessMap}
                onChange={(textureId) => handleTextureSelect('roughnessMap', textureId)}
              />
            </div>
            
            <div className="texture-selector">
              <h4>环境光遮蔽贴图</h4>
              <TextureSelector
                type="ao"
                value={maps.aoMap}
                onChange={(textureId) => handleTextureSelect('aoMap', textureId)}
              />
            </div>
            
            <div className="texture-selector">
              <h4>发光贴图</h4>
              <TextureSelector
                type="emissive"
                value={maps.emissiveMap}
                onChange={(textureId) => handleTextureSelect('emissiveMap', textureId)}
              />
            </div>
            
            {type === 'physical' && (
              <>
                <div className="texture-selector">
                  <h4>透明度贴图</h4>
                  <TextureSelector
                    type="opacity"
                    value={maps.transmissionMap}
                    onChange={(textureId) => handleTextureSelect('transmissionMap', textureId)}
                  />
                </div>
                
                <div className="texture-selector">
                  <h4>厚度贴图</h4>
                  <TextureSelector
                    type="height"
                    value={maps.thicknessMap}
                    onChange={(textureId) => handleTextureSelect('thicknessMap', textureId)}
                  />
                </div>
                
                <div className="texture-selector">
                  <h4>清晰度贴图</h4>
                  <TextureSelector
                    type="generic"
                    value={maps.clearcoatMap}
                    onChange={(textureId) => handleTextureSelect('clearcoatMap', textureId)}
                  />
                </div>
                
                <div className="texture-selector">
                  <h4>清晰度法线贴图</h4>
                  <TextureSelector
                    type="normal"
                    value={maps.clearcoatNormalMap}
                    onChange={(textureId) => handleTextureSelect('clearcoatNormalMap', textureId)}
                  />
                </div>
              </>
            )}
          </div>
        );
        
      default:
        return (
          <div className="empty-state">
            当前材质类型不支持贴图
          </div>
        );
    }
  };
  
  // 渲染高级设置
  const renderAdvancedSettings = () => {
    if (!selectedMaterial) return null;
    
    const { mapSettings } = selectedMaterial;
    
    return (
      <div className="advanced-settings">
        <Form layout="vertical">
          <Form.Item label="贴图重复">
            <InputNumber
              min={1}
              max={10}
              step={1}
              value={mapSettings?.repeat?.[0] || 1}
              onChange={(value) => {
                const repeat = [value, value];
                const newSettings = { ...mapSettings, repeat };
                updateMaterialProperty('mapSettings', newSettings);
              }}
            />
          </Form.Item>
          
          <Form.Item label="贴图偏移 X">
            <Slider
              min={-1}
              max={1}
              step={0.01}
              value={mapSettings?.offset?.[0] || 0}
              onChange={(value) => {
                const offset = [value, mapSettings?.offset?.[1] || 0];
                const newSettings = { ...mapSettings, offset };
                updateMaterialProperty('mapSettings', newSettings);
              }}
            />
          </Form.Item>
          
          <Form.Item label="贴图偏移 Y">
            <Slider
              min={-1}
              max={1}
              step={0.01}
              value={mapSettings?.offset?.[1] || 0}
              onChange={(value) => {
                const offset = [mapSettings?.offset?.[0] || 0, value];
                const newSettings = { ...mapSettings, offset };
                updateMaterialProperty('mapSettings', newSettings);
              }}
            />
          </Form.Item>
          
          <Form.Item label="贴图旋转">
            <Slider
              min={0}
              max={360}
              step={1}
              value={mapSettings?.rotation || 0}
              onChange={(value) => {
                const newSettings = { ...mapSettings, rotation: value };
                updateMaterialProperty('mapSettings', newSettings);
              }}
            />
          </Form.Item>
        </Form>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="material-editor-loading">
        <Spin tip="加载材质..." />
      </div>
    );
  }
  
  return (
    <div className="material-editor">
      <Card title="材质编辑器" extra={
        <div className="material-editor-actions">
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
            disabled={!selectedMaterial}
          >
            应用
          </Button>
          <Button
            icon={<UndoOutlined />}
            onClick={() => loadMaterialApplication(configId, nodeId)}
            disabled={!selectedMaterial}
          >
            重置
          </Button>
        </div>
      }>
        <div className="material-selector">
          <Select
            style={{ width: '100%' }}
            placeholder="选择材质"
            value={selectedMaterial?.id}
            onChange={handleMaterialChange}
            loading={loading}
          >
            {materials.map(material => (
              <Option key={material.id} value={material.id}>
                {material.name} ({material.type})
              </Option>
            ))}
          </Select>
          
          <Button
            type="link"
            icon={<PlusOutlined />}
            onClick={() => message.info('创建新材质功能即将推出')}
          >
            创建新材质
          </Button>
        </div>
        
        {selectedMaterial ? (
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="基础属性" key="base">
              {renderBaseProperties()}
            </TabPane>
            <TabPane tab="贴图" key="textures">
              {renderTextureEditor()}
            </TabPane>
            <TabPane tab="高级设置" key="advanced">
              {renderAdvancedSettings()}
            </TabPane>
          </Tabs>
        ) : (
          <div className="empty-state">
            请选择一个材质
          </div>
        )}
      </Card>
      
      <style jsx>{`
        .material-editor {
          width: 100%;
        }
        
        .material-editor-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 300px;
        }
        
        .material-editor-actions {
          display: flex;
          gap: 8px;
        }
        
        .material-selector {
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .property-editor,
        .texture-editor,
        .advanced-settings {
          padding: 8px 0;
        }
        
        .texture-selector {
          margin-bottom: 24px;
        }
        
        .empty-state {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
          color: #999;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}
