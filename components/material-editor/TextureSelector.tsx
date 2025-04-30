import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Tabs, Input, Select, Row, Col, Pagination, Empty, Spin, Upload, message } from 'antd';
import { UploadOutlined, SearchOutlined, HeartOutlined, HeartFilled, PlusOutlined } from '@ant-design/icons';
import { useTextureStore } from '@/lib/hooks/useTextureStore';

const { TabPane } = Tabs;
const { Search } = Input;
const { Option } = Select;

interface TextureSelectorProps {
  type: string;
  value?: string;
  onChange: (textureId: string) => void;
}

export default function TextureSelector({ type, value, onChange }: TextureSelectorProps) {
  const { 
    textures, 
    loading, 
    pagination,
    loadTextures,
    toggleFavorite,
    uploadTexture
  } = useTextureStore();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchParams, setSearchParams] = useState({
    type,
    search: '',
    category: '',
    tags: '',
    page: 1
  });
  const [selectedTexture, setSelectedTexture] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);
  
  // 加载贴图
  useEffect(() => {
    if (modalVisible) {
      loadTextures(searchParams);
    }
  }, [modalVisible, searchParams, loadTextures]);
  
  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchParams({
      ...searchParams,
      search: value,
      page: 1
    });
  };
  
  // 处理分类筛选
  const handleCategoryChange = (category: string) => {
    setSearchParams({
      ...searchParams,
      category,
      page: 1
    });
  };
  
  // 处理分页
  const handlePageChange = (page: number) => {
    setSearchParams({
      ...searchParams,
      page
    });
  };
  
  // 处理标签切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    
    if (key === 'favorites') {
      loadTextures({ favorites: true, page: 1 });
    } else {
      loadTextures({ ...searchParams, page: 1 });
    }
  };
  
  // 处理收藏切换
  const handleFavoriteToggle = async (textureId: string, isFavorite: boolean) => {
    await toggleFavorite(textureId, !isFavorite);
    
    // 如果在收藏标签页，重新加载收藏
    if (activeTab === 'favorites') {
      loadTextures({ favorites: true, page: searchParams.page });
    }
  };
  
  // 处理贴图选择
  const handleTextureSelect = (textureId: string) => {
    setSelectedTexture(textureId);
  };
  
  // 处理确认选择
  const handleConfirm = () => {
    if (selectedTexture) {
      onChange(selectedTexture);
    }
    setModalVisible(false);
  };
  
  // 处理上传
  const handleUpload = async (file: File) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name.replace(/\.(jpg|jpeg|png|webp)$/i, ''));
      formData.append('type', type);
      formData.append('isPublic', 'true');
      
      const texture = await uploadTexture(formData);
      message.success('贴图上传成功');
      
      // 自动选择新上传的贴图
      setSelectedTexture(texture.id);
      
      // 重新加载贴图列表
      loadTextures(searchParams);
    } catch (error) {
      console.error('Error uploading texture:', error);
      message.error('上传失败');
    } finally {
      setUploading(false);
    }
    
    return false; // 阻止默认上传行为
  };
  
  // 获取当前选中贴图的缩略图
  const getSelectedTextureThumbnail = () => {
    if (!value) return null;
    
    const texture = textures.find(t => t.id === value);
    if (texture) {
      return `/api/textures/${texture.thumbnail}`;
    }
    
    return null;
  };
  
  return (
    <div className="texture-selector">
      <div className="texture-preview" onClick={() => setModalVisible(true)}>
        {value ? (
          <img 
            src={getSelectedTextureThumbnail() || `/api/textures/${value}`} 
            alt="Selected texture" 
          />
        ) : (
          <div className="empty-preview">
            <PlusOutlined />
            <span>选择贴图</span>
          </div>
        )}
      </div>
      
      <Button 
        type={value ? "default" : "primary"} 
        onClick={() => setModalVisible(true)}
      >
        {value ? "更换贴图" : "选择贴图"}
      </Button>
      
      {value && (
        <Button 
          type="text" 
          danger 
          onClick={() => {
            onChange('');
            setSelectedTexture(null);
          }}
        >
          移除
        </Button>
      )}
      
      <Modal
        title="选择贴图"
        open={modalVisible}
        onOk={handleConfirm}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText="确认"
        cancelText="取消"
      >
        <div className="texture-browser">
          <div className="texture-browser-header">
            <Tabs activeKey={activeTab} onChange={handleTabChange}>
              <TabPane tab="所有贴图" key="all" />
              <TabPane tab="收藏贴图" key="favorites" />
              <TabPane tab="上传贴图" key="upload" />
            </Tabs>
            
            {activeTab !== 'upload' && (
              <div className="texture-browser-filters">
                <Row gutter={16}>
                  <Col span={12}>
                    <Search
                      placeholder="搜索贴图"
                      onSearch={handleSearch}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Select
                      placeholder="选择分类"
                      style={{ width: '100%' }}
                      onChange={handleCategoryChange}
                      value={searchParams.category || undefined}
                      allowClear
                    >
                      <Option value="fabric">织物</Option>
                      <Option value="wood">木材</Option>
                      <Option value="metal">金属</Option>
                      <Option value="stone">石材</Option>
                      <Option value="plastic">塑料</Option>
                      <Option value="leather">皮革</Option>
                      <Option value="glass">玻璃</Option>
                      <Option value="ceramic">陶瓷</Option>
                      <Option value="concrete">混凝土</Option>
                      <Option value="pattern">图案</Option>
                      <Option value="generic">通用</Option>
                    </Select>
                  </Col>
                </Row>
              </div>
            )}
          </div>
          
          <div className="texture-browser-content">
            {activeTab === 'upload' ? (
              <div className="texture-upload">
                <Upload.Dragger
                  name="file"
                  beforeUpload={handleUpload}
                  showUploadList={false}
                  accept=".jpg,.jpeg,.png,.webp"
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                  <p className="ant-upload-hint">
                    支持 JPG, PNG, WebP 格式的贴图
                  </p>
                </Upload.Dragger>
              </div>
            ) : loading ? (
              <div className="texture-browser-loading">
                <Spin tip="加载贴图..." />
              </div>
            ) : textures.length === 0 ? (
              <Empty description="没有找到贴图" />
            ) : (
              <>
                <div className="texture-grid">
                  {textures.map(texture => (
                    <div 
                      key={texture.id} 
                      className={`texture-item ${selectedTexture === texture.id ? 'selected' : ''}`}
                      onClick={() => handleTextureSelect(texture.id)}
                    >
                      <div className="texture-item-image">
                        <img src={`/api/textures/${texture.thumbnail}`} alt={texture.name} />
                        <div 
                          className="texture-item-favorite"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFavoriteToggle(texture.id, texture.isFavorite);
                          }}
                        >
                          {texture.isFavorite ? (
                            <HeartFilled style={{ color: '#ff4d4f' }} />
                          ) : (
                            <HeartOutlined />
                          )}
                        </div>
                      </div>
                      <div className="texture-item-name">{texture.name}</div>
                    </div>
                  ))}
                </div>
                
                {pagination && pagination.total > pagination.limit && (
                  <div className="texture-browser-pagination">
                    <Pagination
                      current={pagination.page}
                      pageSize={pagination.limit}
                      total={pagination.total}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>
      
      <style jsx>{`
        .texture-selector {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .texture-preview {
          width: 64px;
          height: 64px;
          border: 1px solid #d9d9d9;
          border-radius: 4px;
          overflow: hidden;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #f5f5f5;
        }
        
        .texture-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .empty-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #999;
        }
        
        .texture-browser {
          display: flex;
          flex-direction: column;
          height: 500px;
        }
        
        .texture-browser-header {
          margin-bottom: 16px;
        }
        
        .texture-browser-filters {
          margin-top: 16px;
        }
        
        .texture-browser-content {
          flex: 1;
          overflow-y: auto;
        }
        
        .texture-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 16px;
          padding: 8px;
        }
        
        .texture-item {
          cursor: pointer;
          border-radius: 4px;
          overflow: hidden;
          transition: all 0.3s;
          border: 2px solid transparent;
        }
        
        .texture-item.selected {
          border-color: #1890ff;
        }
        
        .texture-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        
        .texture-item-image {
          position: relative;
          width: 100%;
          height: 120px;
          background-color: #f5f5f5;
        }
        
        .texture-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .texture-item-favorite {
          position: absolute;
          top: 4px;
          right: 4px;
          background-color: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .texture-item-name {
          padding: 4px;
          font-size: 12px;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .texture-browser-loading,
        .texture-upload {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 300px;
        }
        
        .texture-browser-pagination {
          margin-top: 16px;
          display: flex;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
