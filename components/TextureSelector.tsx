import { useEffect, useState } from 'react';
import { useResourceStore } from '@/lib/hooks/useResourceStore';
import { useContentStore } from '@/lib/hooks/useContentStore';
import { Card, List, Button, Input, Select, Spin, Empty, Pagination, Tag, Tooltip } from 'antd';
import { SearchOutlined, PlusOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import TextureUploadModal from './TextureUploadModal';

interface TextureSelectorProps {
  onSelect: (texture: any) => void;
  selectedTextureId?: string;
  textureType?: string;
}

export default function TextureSelector({ onSelect, selectedTextureId, textureType }: TextureSelectorProps) {
  const { getResources, isLoading, getPagination, loadResources, updateResource } = useResourceStore();
  const { getContentUrl } = useContentStore();

  // 获取贴图资源
  const textures = getResources('textures');
  const loading = isLoading('textures');
  const pagination = getPagination('textures');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState(textureType || '');
  const [tags, setTags] = useState('');
  const [page, setPage] = useState(1);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // 加载贴图列表
  useEffect(() => {
    loadResources('textures', {
      search,
      category,
      type,
      tags,
      page,
      limit: 12
    });
  }, [loadResources, search, category, type, tags, page]);

  // 处理贴图选择
  const handleSelect = (texture) => {
    onSelect(texture);
  };

  // 处理搜索
  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  // 处理分类筛选
  const handleCategoryChange = (value) => {
    setCategory(value);
    setPage(1);
  };

  // 处理类型筛选
  const handleTypeChange = (value) => {
    setType(value);
    setPage(1);
  };

  // 处理标签筛选
  const handleTagClick = (tag) => {
    setTags(tag);
    setPage(1);
  };

  // 获取贴图类型名称
  const getTextureTypeName = (type) => {
    const typeNames = {
      'baseColor': '颜色',
      'normal': '法线',
      'roughness': '粗糙度',
      'metalness': '金属度',
      'height': '高度',
      'ao': 'AO',
      'emissive': '自发光'
    };
    return typeNames[type] || type;
  };

  // 处理分页
  const handlePageChange = (page) => {
    setPage(page);
  };

  // 打开上传模态框
  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  // 关闭上传模态框
  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  // 上传成功回调
  const handleUploadSuccess = (texture) => {
    setIsUploadModalOpen(false);
    loadResources('textures', {
      search,
      category,
      type,
      tags,
      page,
      limit: 12
    });
  };

  // 处理收藏切换
  const handleToggleFavorite = async (e, textureId) => {
    e.stopPropagation();

    const texture = textures.find(t => t.id === textureId);

    if (texture) {
      try {
        if (texture.isFavorite) {
          // 取消收藏
          await fetch(`/api/associations/textures/${textureId}/favorites`, {
            method: 'DELETE'
          });
        } else {
          // 添加收藏
          await fetch(`/api/associations/textures/${textureId}/favorites`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
          });
        }

        // 更新贴图状态
        await updateResource('textures', textureId, {
          ...texture,
          isFavorite: !texture.isFavorite
        });
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    }
  };

  return (
    <div className="texture-selector">
      <div className="texture-selector-header">
        <Input.Search
          placeholder="搜索贴图"
          onSearch={handleSearch}
          style={{ width: 200, marginRight: 16 }}
          prefix={<SearchOutlined />}
        />
        <Select
          placeholder="选择分类"
          style={{ width: 150, marginRight: 16 }}
          onChange={handleCategoryChange}
          allowClear
        >
          <Select.Option value="fabric">织物</Select.Option>
          <Select.Option value="wood">木材</Select.Option>
          <Select.Option value="metal">金属</Select.Option>
          <Select.Option value="stone">石材</Select.Option>
          <Select.Option value="plastic">塑料</Select.Option>
          <Select.Option value="generic">通用</Select.Option>
        </Select>
        <Select
          placeholder="选择类型"
          style={{ width: 150 }}
          onChange={handleTypeChange}
          value={type || undefined}
          allowClear
        >
          <Select.Option value="baseColor">颜色贴图</Select.Option>
          <Select.Option value="normal">法线贴图</Select.Option>
          <Select.Option value="roughness">粗糙度贴图</Select.Option>
          <Select.Option value="metalness">金属度贴图</Select.Option>
          <Select.Option value="height">高度贴图</Select.Option>
          <Select.Option value="ao">环境光遮蔽贴图</Select.Option>
        </Select>
      </div>

      {loading ? (
        <div className="texture-selector-loading">
          <Spin size="large" />
        </div>
      ) : textures.length === 0 ? (
        <Empty description="没有找到贴图" />
      ) : (
        <>
          <List
            grid={{ gutter: 16, column: 4 }}
            dataSource={textures}
            renderItem={(texture) => (
              <List.Item>
                <Card
                  hoverable
                  className={`texture-card ${selectedTextureId === texture.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(texture)}
                  cover={
                    <div className="texture-card-cover">
                      <img
                        alt={texture.name}
                        src={getContentUrl(texture.contentHash)}
                        style={{ height: 120, objectFit: 'cover' }}
                        onError={(e) => {
                          // 图片加载失败时显示统一的占位图样式
                          e.currentTarget.style.backgroundColor = '#f0f0f0';
                        }}
                      />
                      {texture.type && (
                        <div className="texture-type-badge">
                          {getTextureTypeName(texture.type)}
                        </div>
                      )}
                      {selectedTextureId === texture.id && (
                        <div className="texture-selected-overlay">
                          <div className="texture-selected-icon">✓</div>
                        </div>
                      )}
                    </div>
                  }
                  actions={[
                    <Tooltip title={texture.isFavorite ? '取消收藏' : '收藏'} key="favorite">
                      <Button
                        type="text"
                        icon={texture.isFavorite ? <HeartFilled /> : <HeartOutlined />}
                        onClick={(e) => handleToggleFavorite(e, texture.id)}
                      />
                    </Tooltip>,
                    <Button
                      type="text"
                      key="select"
                      onClick={() => handleSelect(texture)}
                    >
                      {selectedTextureId === texture.id ? '已选择' : '选择'}
                    </Button>
                  ]}
                >
                  <Card.Meta
                    title={texture.name}
                    description={
                      <div>
                        <div>{texture.category}</div>
                        <div className="texture-tags">
                          {texture.tags && texture.tags.map(tag => (
                            <Tag
                              key={tag.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTagClick(tag.name);
                              }}
                            >
                              {tag.name}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />

          {pagination && pagination.total > pagination.limit && (
            <div className="texture-selector-pagination">
              <Pagination
                current={page}
                pageSize={pagination.limit}
                total={pagination.total}
                onChange={handlePageChange}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}

      <div className="texture-selector-footer">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenUploadModal}
        >
          上传新贴图
        </Button>
      </div>

      {/* 贴图上传模态框 */}
      <TextureUploadModal
        open={isUploadModalOpen}
        onCancel={handleCloseUploadModal}
        onSuccess={handleUploadSuccess}
        textureType={textureType}
      />

      <style jsx>{`
        .texture-selector {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .texture-selector-header {
          display: flex;
          margin-bottom: 16px;
        }

        .texture-selector-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 300px;
        }

        .texture-selector-pagination {
          display: flex;
          justify-content: center;
          margin-top: 16px;
        }

        .texture-selector-footer {
          margin-top: 16px;
          display: flex;
          justify-content: flex-end;
        }

        :global(.texture-card.selected) {
          border: 2px solid #1890ff;
        }

        :global(.texture-tags) {
          margin-top: 8px;
        }

        :global(.texture-card-cover) {
          position: relative;
          overflow: hidden;
        }

        :global(.texture-type-badge) {
          position: absolute;
          top: 8px;
          right: 8px;
          background-color: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
        }

        :global(.texture-selected-overlay) {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(24, 144, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        :global(.texture-selected-icon) {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: #1890ff;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}
