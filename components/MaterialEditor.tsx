'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Select, Slider, Button, Card, Tabs, Row, Col, ColorPicker, message, Modal, Tag } from 'antd';
import { SaveOutlined, UndoOutlined, PlusOutlined } from '@ant-design/icons';
import TextureSelector from './TextureSelector';
import { useResourceStore } from '@/lib/hooks/useResourceStore';
import { useContentStore } from '@/lib/hooks/useContentStore';

interface MaterialEditorProps {
  materialId?: string;
  onSave?: (material: any) => void;
  onCancel?: () => void;
}

export default function MaterialEditor({ materialId, onSave, onCancel }: MaterialEditorProps) {
  const [form] = Form.useForm();
  const { selectedResource: material, loadResourceById, createResource, updateResource } = useResourceStore();
  const { getContentUrl } = useContentStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedTextures, setSelectedTextures] = useState<Record<string, any>>({});
  const [showTextureSelector, setShowTextureSelector] = useState<string | null>(null);

  // 加载材质数据
  useEffect(() => {
    if (materialId) {
      loadResourceById('materials', materialId);
    }
  }, [materialId, loadResourceById]);

  // 当材质数据加载完成后，设置表单值
  useEffect(() => {
    if (material) {
      form.setFieldsValue({
        name: material.name,
        type: material.type,
        category: material.category,
        ...material.baseProperties
      });

      // 设置已选贴图
      if (material.maps) {
        const textures = {};
        Object.entries(material.maps).forEach(([key, value]) => {
          if (value) {
            textures[key] = { id: value };
          }
        });
        setSelectedTextures(textures);
      }
    }
  }, [material, form]);

  // 处理表单提交
  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // 构建材质数据
      const materialData = {
        name: values.name,
        type: values.type,
        category: values.category,
        baseProperties: {
          color: values.color,
          metalness: values.metalness,
          roughness: values.roughness,
          normalScale: values.normalScale,
          aoMapIntensity: values.aoMapIntensity,
          envMapIntensity: values.envMapIntensity
        },
        maps: Object.entries(selectedTextures).reduce((acc, [key, texture]) => {
          acc[key] = texture ? texture.id : null;
          return acc;
        }, {}),
        mapSettings: {
          repeat: [values.repeatX || 1, values.repeatY || 1],
          offset: [values.offsetX || 0, values.offsetY || 0],
          rotation: values.rotation || 0
        }
      };

      // 创建或更新材质
      let result;
      if (materialId) {
        result = await updateResource('materials', materialId, materialData);
        message.success('材质更新成功');
      } else {
        result = await createResource('materials', materialData);
        message.success('材质创建成功');
      }

      if (onSave) {
        onSave(result);
      }
    } catch (error) {
      console.error('Error saving material:', error);
      message.error('保存材质失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理贴图选择
  const handleTextureSelect = (texture) => {
    if (showTextureSelector && texture) {
      // 更新选中的贴图
      setSelectedTextures({
        ...selectedTextures,
        [showTextureSelector]: texture
      });

      // 根据贴图类型自动调整相关属性
      if (showTextureSelector === 'roughnessMap') {
        form.setFieldsValue({ roughness: 1.0 }); // 当使用粗糙度贴图时，将粗糙度设为最大值
      } else if (showTextureSelector === 'metalnessMap') {
        form.setFieldsValue({ metalness: 1.0 }); // 当使用金属度贴图时，将金属度设为最大值
      } else if (showTextureSelector === 'normalMap') {
        form.setFieldsValue({ normalScale: 1.0 }); // 设置默认法线强度
      } else if (showTextureSelector === 'aoMap') {
        form.setFieldsValue({ aoMapIntensity: 1.0 }); // 设置默认AO强度
      }

      setShowTextureSelector(null);
      message.success(`已添加${getMapTypeName(showTextureSelector)}`);
    }
  };

  // 处理贴图移除
  const handleRemoveTexture = (mapType) => {
    const newSelectedTextures = { ...selectedTextures };
    delete newSelectedTextures[mapType];
    setSelectedTextures(newSelectedTextures);

    // 重置相关属性
    if (mapType === 'roughnessMap') {
      form.setFieldsValue({ roughness: 0.5 }); // 重置为默认值
    } else if (mapType === 'metalnessMap') {
      form.setFieldsValue({ metalness: 0 }); // 重置为默认值
    }

    message.success(`已移除${getMapTypeName(mapType)}`);
  };

  // 打开贴图选择器
  const openTextureSelector = (mapType) => {
    setShowTextureSelector(mapType);
  };

  // 渲染贴图预览
  const renderTexturePreview = (mapType) => {
    const texture = selectedTextures[mapType];
    if (!texture) {
      return (
        <div className="texture-preview-empty">
          <Button
            type="dashed"
            onClick={() => openTextureSelector(mapType)}
            icon={<PlusOutlined />}
            style={{ width: '100%', height: 100 }}
          >
            选择{getMapTypeName(mapType)}
          </Button>
          <div className="texture-type-hint">
            {getMapTypeDescription(mapType)}
          </div>
        </div>
      );
    }

    return (
      <div className="texture-preview">
        <div className="texture-image-container">
          <img
            src={getContentUrl(texture.contentHash)}
            alt={texture.name}
            style={{ width: '100%', height: 100, objectFit: 'cover' }}
          />
          <div className="texture-info-overlay">
            <div className="texture-name">{texture.name}</div>
            {texture.category && <Tag color="blue">{texture.category}</Tag>}
          </div>
        </div>
        <div className="texture-preview-actions">
          <Button size="small" onClick={() => openTextureSelector(mapType)}>
            更换
          </Button>
          <Button size="small" danger onClick={() => handleRemoveTexture(mapType)}>
            移除
          </Button>
        </div>
      </div>
    );
  };

  // 获取贴图类型描述
  const getMapTypeDescription = (mapType) => {
    const descriptions = {
      map: '控制材质的基本颜色',
      normalMap: '添加表面细节和凸凹效果',
      roughnessMap: '控制材质的粗糙程度',
      metalnessMap: '控制材质的金属化程度',
      aoMap: '添加环境光遮蔽效果',
      displacementMap: '创建真实的凸凹效果'
    };
    return descriptions[mapType] || '';
  };

  // 获取贴图类型名称
  const getMapTypeName = (mapType) => {
    const mapTypeNames = {
      map: '颜色贴图',
      normalMap: '法线贴图',
      roughnessMap: '粗糙度贴图',
      metalnessMap: '金属度贴图',
      aoMap: '环境光遮蔽贴图',
      displacementMap: '置换贴图'
    };
    return mapTypeNames[mapType] || mapType;
  };

  return (
    <div className="material-editor">
      {showTextureSelector ? (
        <Modal
          title={`选择${getMapTypeName(showTextureSelector)}`}
          open={!!showTextureSelector}
          onCancel={() => setShowTextureSelector(null)}
          width={800}
          footer={null}
        >
          <TextureSelector
            onSelect={handleTextureSelect}
            textureType={showTextureSelector === 'map' ? 'baseColor' : showTextureSelector.replace('Map', '')}
          />
        </Modal>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            name: '',
            type: 'standard',
            category: 'custom',
            color: '#ffffff',
            metalness: 0,
            roughness: 0.5,
            normalScale: 1,
            aoMapIntensity: 1,
            envMapIntensity: 1,
            repeatX: 1,
            repeatY: 1,
            offsetX: 0,
            offsetY: 0,
            rotation: 0
          }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'basic',
                label: '基本属性',
                children: (
                  <>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          name="name"
                          label="材质名称"
                          rules={[{ required: true, message: '请输入材质名称' }]}
                        >
                          <Input placeholder="输入材质名称" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="type"
                          label="材质类型"
                          rules={[{ required: true, message: '请选择材质类型' }]}
                        >
                          <Select>
                            <Select.Option value="standard">标准材质</Select.Option>
                            <Select.Option value="physical">物理材质</Select.Option>
                            <Select.Option value="toon">卡通材质</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="category"
                          label="材质分类"
                          rules={[{ required: true, message: '请选择材质分类' }]}
                        >
                          <Select>
                            <Select.Option value="metal">金属</Select.Option>
                            <Select.Option value="wood">木材</Select.Option>
                            <Select.Option value="plastic">塑料</Select.Option>
                            <Select.Option value="fabric">织物</Select.Option>
                            <Select.Option value="stone">石材</Select.Option>
                            <Select.Option value="glass">玻璃</Select.Option>
                            <Select.Option value="custom">自定义</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item name="color" label="基础颜色">
                          <ColorPicker />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="metalness" label={`金属度: ${form.getFieldValue('metalness')}`}>
                          <Slider
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(value) => form.setFieldValue('metalness', value)}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="roughness" label={`粗糙度: ${form.getFieldValue('roughness')}`}>
                          <Slider
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(value) => form.setFieldValue('roughness', value)}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item name="normalScale" label={`法线强度: ${form.getFieldValue('normalScale')}`}>
                          <Slider
                            min={0}
                            max={2}
                            step={0.01}
                            onChange={(value) => form.setFieldValue('normalScale', value)}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="aoMapIntensity" label={`AO强度: ${form.getFieldValue('aoMapIntensity')}`}>
                          <Slider
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(value) => form.setFieldValue('aoMapIntensity', value)}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="envMapIntensity" label={`环境反射强度: ${form.getFieldValue('envMapIntensity')}`}>
                          <Slider
                            min={0}
                            max={2}
                            step={0.01}
                            onChange={(value) => form.setFieldValue('envMapIntensity', value)}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                )
              },
              {
                key: 'maps',
                label: '贴图',
                children: (
                  <>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Card title="颜色贴图" size="small">
                          {renderTexturePreview('map')}
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card title="法线贴图" size="small">
                          {renderTexturePreview('normalMap')}
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card title="粗糙度贴图" size="small">
                          {renderTexturePreview('roughnessMap')}
                        </Card>
                      </Col>
                    </Row>

                    <Row gutter={16} style={{ marginTop: 16 }}>
                      <Col span={8}>
                        <Card title="金属度贴图" size="small">
                          {renderTexturePreview('metalnessMap')}
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card title="环境光遮蔽贴图" size="small">
                          {renderTexturePreview('aoMap')}
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card title="置换贴图" size="small">
                          {renderTexturePreview('displacementMap')}
                        </Card>
                      </Col>
                    </Row>
                  </>
                )
              },
              {
                key: 'mapSettings',
                label: '贴图设置',
                children: (
                  <>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="repeatX" label={`水平重复: ${form.getFieldValue('repeatX')}`}>
                          <Slider
                            min={0.1}
                            max={10}
                            step={0.1}
                            onChange={(value) => form.setFieldValue('repeatX', value)}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="repeatY" label={`垂直重复: ${form.getFieldValue('repeatY')}`}>
                          <Slider
                            min={0.1}
                            max={10}
                            step={0.1}
                            onChange={(value) => form.setFieldValue('repeatY', value)}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="offsetX" label={`水平偏移: ${form.getFieldValue('offsetX')}`}>
                          <Slider
                            min={-1}
                            max={1}
                            step={0.01}
                            onChange={(value) => form.setFieldValue('offsetX', value)}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="offsetY" label={`垂直偏移: ${form.getFieldValue('offsetY')}`}>
                          <Slider
                            min={-1}
                            max={1}
                            step={0.01}
                            onChange={(value) => form.setFieldValue('offsetY', value)}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={24}>
                        <Form.Item name="rotation" label={`旋转: ${form.getFieldValue('rotation')}°`}>
                          <Slider
                            min={0}
                            max={360}
                            step={1}
                            onChange={(value) => form.setFieldValue('rotation', value)}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                )
              }
            ]}
          />

          <div className="form-actions">
            <Button onClick={onCancel} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
              保存材质
            </Button>
          </div>
        </Form>
      )}

      <style jsx global>{`
        .material-editor {
          position: relative;
        }

        .texture-preview {
          position: relative;
        }

        .texture-image-container {
          position: relative;
          overflow: hidden;
          border-radius: 4px;
        }

        .texture-info-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 4px 8px;
          font-size: 12px;
        }

        .texture-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 2px;
        }

        .texture-preview-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
        }

        .texture-preview-empty {
          position: relative;
        }

        .texture-type-hint {
          font-size: 12px;
          color: #888;
          margin-top: 4px;
          text-align: center;
        }

        .form-actions {
          margin-top: 24px;
          display: flex;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
}
