'use client';

import { useState, useEffect } from 'react';
import { Tabs, Card, Button, Modal, message } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import MaterialSelector from '@/components/MaterialSelector';
import TextureSelector from '@/components/TextureSelector';
import EnvironmentSelector from '@/components/EnvironmentSelector';
import MaterialEditor from '@/components/MaterialEditor';
import { useContentStore } from '@/lib/hooks/useContentStore';
import { useResourceStore } from '@/lib/hooks/useResourceStore';

export default function MaterialsPage() {
  // 获取内容URL和资源存储
  const { getContentUrl } = useContentStore();
  const { setActiveResourceType } = useResourceStore();

  // 当前活动标签
  const [activeTab, setActiveTab] = useState('materials');

  // 各标签页的选中项
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedTexture, setSelectedTexture] = useState(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState(null);

  // 环境设置
  const [sceneSettings, setSceneSettings] = useState({
    backgroundType: 'environment',
    backgroundColor: '#f0f0f0',
    exposure: 1.0,
    toneMapping: 'ACESFilmic'
  });

  // 材质编辑相关状态
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleMaterialSelect = (material) => {
    setSelectedMaterial(material);
  };

  const handleTextureSelect = (texture) => {
    setSelectedTexture(texture);
  };

  const handleEnvironmentSelect = (environment) => {
    setSelectedEnvironment(environment);
  };

  const handleSceneChange = (settings) => {
    setSceneSettings(settings);
  };

  // 打开材质编辑器（新建材质）
  const handleCreateMaterial = () => {
    setEditingMaterial(null);
    setIsEditorOpen(true);
  };

  // 打开材质编辑器（编辑现有材质）
  const handleEditMaterial = () => {
    if (selectedMaterial) {
      setEditingMaterial(selectedMaterial);
      setIsEditorOpen(true);
    } else {
      message.warning('请先选择一个材质');
    }
  };

  // 关闭材质编辑器
  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingMaterial(null);
  };

  // 保存材质后的回调
  const handleMaterialSave = (material) => {
    setIsEditorOpen(false);
    setEditingMaterial(null);
    setSelectedMaterial(material);
  };

  // 当标签切换时设置当前活动的资源类型
  useEffect(() => {
    // 设置当前活动的资源类型
    setActiveResourceType(activeTab);

    // 根据当前标签重置其他标签的选中状态
    if (activeTab === 'materials') {
      // 如果切换到材质标签，重置贴图和环境选中状态
      setSelectedTexture(null);
      setSelectedEnvironment(null);
    } else if (activeTab === 'textures') {
      // 如果切换到贴图标签，重置材质和环境选中状态
      setSelectedMaterial(null);
      setSelectedEnvironment(null);
    } else if (activeTab === 'environments') {
      // 如果切换到环境标签，重置材质和贴图选中状态
      setSelectedMaterial(null);
      setSelectedTexture(null);
    }
  }, [activeTab, setActiveResourceType]);

  return (
    <div className="materials-page">
      <h1 style={{ margin: '0 0 24px 0' }}>材质库</h1>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'materials',
            label: '材质',
            children: (
              <div className="materials-container">
                <div className="materials-list">
                  <div className="materials-list-header">
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleCreateMaterial}
                      style={{ marginBottom: 16 }}
                    >
                      创建新材质
                    </Button>
                  </div>
                  <MaterialSelector
                    onSelect={handleMaterialSelect}
                    selectedMaterialId={selectedMaterial?.id}
                  />
                </div>

                <div className="material-details">
                  {selectedMaterial ? (
                    <Card
                      title={selectedMaterial.name}
                      extra={
                        <Button
                          type="primary"
                          icon={<EditOutlined />}
                          onClick={handleEditMaterial}
                        >
                          编辑
                        </Button>
                      }
                    >
                      <div className="material-info-section">
                        <div className="material-preview">
                          {selectedMaterial.maps && selectedMaterial.maps.map ? (
                            <img
                              src={getContentUrl(selectedMaterial.maps.map)}
                              alt="材质预览"
                              style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 4 }}
                              onError={(e) => {
                                e.currentTarget.style.backgroundColor = '#f0f0f0';
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                height: 150,
                                backgroundColor: selectedMaterial.baseProperties?.color || '#f0f0f0',
                                borderRadius: 4
                              }}
                            />
                          )}
                        </div>

                        <div className="material-properties">
                          <h3>基本信息</h3>
                          <p><strong>类型:</strong> {
                            selectedMaterial.type === 'standard' ? '标准材质' :
                            selectedMaterial.type === 'physical' ? '物理材质' :
                            selectedMaterial.type === 'toon' ? '卡通材质' :
                            selectedMaterial.type
                          }</p>
                          <p><strong>分类:</strong> {
                            selectedMaterial.category === 'metal' ? '金属' :
                            selectedMaterial.category === 'wood' ? '木材' :
                            selectedMaterial.category === 'plastic' ? '塑料' :
                            selectedMaterial.category === 'fabric' ? '织物' :
                            selectedMaterial.category === 'stone' ? '石材' :
                            selectedMaterial.category === 'glass' ? '玻璃' :
                            selectedMaterial.category === 'custom' ? '自定义' :
                            selectedMaterial.category
                          }</p>
                        </div>

                        <div className="material-properties">
                          <h3>基础属性</h3>
                          {selectedMaterial.baseProperties && (
                            <div className="properties-grid">
                              {selectedMaterial.baseProperties.color && (
                                <div className="property-item">
                                  <div className="property-label">颜色</div>
                                  <div className="property-value">
                                    <div className="color-preview" style={{ backgroundColor: selectedMaterial.baseProperties.color }} />
                                    {selectedMaterial.baseProperties.color}
                                  </div>
                                </div>
                              )}
                              {selectedMaterial.baseProperties.metalness !== undefined && (
                                <div className="property-item">
                                  <div className="property-label">金属度</div>
                                  <div className="property-value">{selectedMaterial.baseProperties.metalness}</div>
                                </div>
                              )}
                              {selectedMaterial.baseProperties.roughness !== undefined && (
                                <div className="property-item">
                                  <div className="property-label">粗糙度</div>
                                  <div className="property-value">{selectedMaterial.baseProperties.roughness}</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="material-properties">
                          <h3>贴图</h3>
                          {selectedMaterial.maps && Object.keys(selectedMaterial.maps).length > 0 ? (
                            <div className="maps-grid">
                              {Object.entries(selectedMaterial.maps).map(([key, value]) => (
                                <div key={key} className="map-item">
                                  <div className="map-label">
                                    {key === 'map' ? '颜色贴图' :
                                     key === 'normalMap' ? '法线贴图' :
                                     key === 'roughnessMap' ? '粗糙度贴图' :
                                     key === 'metalnessMap' ? '金属度贴图' :
                                     key === 'aoMap' ? '环境光遮蔽贴图' :
                                     key === 'displacementMap' ? '置换贴图' :
                                     key}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p>没有贴图</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Card>
                      <p>请选择一个材质查看详情</p>
                    </Card>
                  )}
                </div>
              </div>
            )
          },
          {
            key: 'textures',
            label: '贴图',
            children: (
              <div className="textures-container">
                <div className="textures-list">
                  <TextureSelector
                    onSelect={handleTextureSelect}
                    selectedTextureId={selectedTexture?.id}
                  />
                </div>

                <div className="texture-details">
                  {selectedTexture ? (
                    <Card title={selectedTexture.name}>
                      <div className="texture-info-section">
                        <div className="texture-preview">
                          <img
                            src={getContentUrl(selectedTexture.contentHash)}
                            alt={selectedTexture.name}
                            style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 4 }}
                            onError={(e) => {
                              e.currentTarget.style.backgroundColor = '#f0f0f0';
                            }}
                          />
                        </div>

                        <div className="texture-properties">
                          <h3>基本信息</h3>
                          <p><strong>类型:</strong> {
                            selectedTexture.type === 'baseColor' ? '颜色贴图' :
                            selectedTexture.type === 'normal' ? '法线贴图' :
                            selectedTexture.type === 'roughness' ? '粗糙度贴图' :
                            selectedTexture.type === 'metalness' ? '金属度贴图' :
                            selectedTexture.type === 'height' ? '高度贴图' :
                            selectedTexture.type === 'ao' ? '环境光遮蔽贴图' :
                            selectedTexture.type === 'emissive' ? '自发光贴图' :
                            selectedTexture.type
                          }</p>
                          <p><strong>分类:</strong> {
                            selectedTexture.category === 'fabric' ? '织物' :
                            selectedTexture.category === 'wood' ? '木材' :
                            selectedTexture.category === 'metal' ? '金属' :
                            selectedTexture.category === 'stone' ? '石材' :
                            selectedTexture.category === 'plastic' ? '塑料' :
                            selectedTexture.category === 'generic' ? '通用' :
                            selectedTexture.category
                          }</p>
                          <p><strong>尺寸:</strong> {selectedTexture.width} x {selectedTexture.height} 像素</p>
                          <p><strong>格式:</strong> {selectedTexture.format}</p>
                        </div>

                        {selectedTexture.tags && selectedTexture.tags.length > 0 && (
                          <div className="texture-tags-section">
                            <h3>标签</h3>
                            <div className="tags-container">
                              {selectedTexture.tags.map(tag => (
                                <div key={tag.id} className="tag-item">
                                  {tag.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ) : (
                    <Card>
                      <p>请选择一个贴图查看详情</p>
                    </Card>
                  )}
                </div>
              </div>
            )
          },
          {
            key: 'environments',
            label: '环境',
            children: (
              <div className="environments-container">
                <div className="environments-list">
                  <EnvironmentSelector
                    onSelect={handleEnvironmentSelect}
                    onSceneChange={handleSceneChange}
                    selectedEnvironmentId={selectedEnvironment?.id}
                    sceneSettings={sceneSettings}
                  />
                </div>

                <div className="environment-details">
                  {selectedEnvironment ? (
                    <Card title={selectedEnvironment.name}>
                      <div className="environment-info-section">
                        <div className="environment-preview">
                          <img
                            src={getContentUrl(selectedEnvironment.thumbnail, 'thumbnail')}
                            alt={selectedEnvironment.name}
                            style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 4 }}
                            onError={(e) => {
                              e.currentTarget.style.backgroundColor = '#f0f0f0';
                            }}
                          />
                        </div>

                        <div className="environment-properties">
                          <h3>基本信息</h3>
                          <p><strong>格式:</strong> {selectedEnvironment.format || 'HDR'}</p>
                          <p><strong>类型:</strong> {selectedEnvironment.type || '环境贴图'}</p>
                          <p><strong>分辨率:</strong> {selectedEnvironment.resolution || '未知'}</p>
                          <p><strong>强度:</strong> {selectedEnvironment.intensity || 1.0}</p>
                        </div>

                        <div className="environment-settings-section">
                          <h3>场景设置</h3>
                          <div className="settings-grid">
                            <div className="setting-item">
                              <div className="setting-label">背景类型</div>
                              <div className="setting-value">
                                {sceneSettings.backgroundType === 'environment' ? '环境贴图' :
                                 sceneSettings.backgroundType === 'color' ? '纯色' :
                                 sceneSettings.backgroundType === 'transparent' ? '透明' :
                                 sceneSettings.backgroundType}
                              </div>
                            </div>

                            {sceneSettings.backgroundType === 'color' && (
                              <div className="setting-item">
                                <div className="setting-label">背景颜色</div>
                                <div className="setting-value">
                                  <div className="color-preview" style={{ backgroundColor: sceneSettings.backgroundColor }} />
                                  {sceneSettings.backgroundColor}
                                </div>
                              </div>
                            )}

                            <div className="setting-item">
                              <div className="setting-label">曝光度</div>
                              <div className="setting-value">{sceneSettings.exposure}</div>
                            </div>

                            <div className="setting-item">
                              <div className="setting-label">色调映射</div>
                              <div className="setting-value">{sceneSettings.toneMapping}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Card>
                      <p>请选择一个环境贴图查看详情</p>
                    </Card>
                  )}
                </div>
              </div>
            )
          }
        ]}
      />

      {/* 材质编辑器模态框 */}
      <Modal
        title={editingMaterial ? '编辑材质' : '创建新材质'}
        open={isEditorOpen}
        onCancel={handleCloseEditor}
        width={800}
        footer={null}
        destroyOnClose
      >
        <MaterialEditor
          materialId={editingMaterial?.id}
          onSave={handleMaterialSave}
          onCancel={handleCloseEditor}
        />
      </Modal>

      <style jsx>{`
        .materials-page {
          padding: 24px;
        }

        .materials-container,
        .textures-container,
        .environments-container {
          display: flex;
          margin-top: 16px;
        }

        .materials-list,
        .textures-list,
        .environments-list {
          flex: 1;
          margin-right: 24px;
        }

        .material-details,
        .texture-details,
        .environment-details {
          width: 300px;
        }

        .material-info-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .material-preview {
          margin-bottom: 8px;
        }

        .material-properties {
          margin-bottom: 16px;
        }

        .material-properties h3 {
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 1px solid #f0f0f0;
        }

        .properties-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .property-item {
          display: flex;
          flex-direction: column;
          padding: 8px;
          background-color: #f9f9f9;
          border-radius: 4px;
        }

        .property-label {
          font-weight: 500;
          margin-bottom: 4px;
          color: #666;
        }

        .property-value {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .color-preview {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1px solid #ddd;
        }

        .maps-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .map-item {
          padding: 8px;
          background-color: #f9f9f9;
          border-radius: 4px;
        }

        .map-label {
          font-weight: 500;
        }

        .texture-info-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .texture-preview {
          margin-bottom: 8px;
        }

        .texture-properties {
          margin-bottom: 16px;
        }

        .texture-properties h3,
        .texture-tags-section h3 {
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 1px solid #f0f0f0;
        }

        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag-item {
          padding: 4px 8px;
          background-color: #f0f0f0;
          border-radius: 4px;
          font-size: 12px;
        }

        .environment-info-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .environment-preview {
          margin-bottom: 8px;
        }

        .environment-properties,
        .environment-settings-section {
          margin-bottom: 16px;
        }

        .environment-properties h3,
        .environment-settings-section h3 {
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 1px solid #f0f0f0;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .setting-item {
          padding: 8px;
          background-color: #f9f9f9;
          border-radius: 4px;
        }

        .setting-label {
          font-weight: 500;
          margin-bottom: 4px;
          color: #666;
        }

        .setting-value {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}
