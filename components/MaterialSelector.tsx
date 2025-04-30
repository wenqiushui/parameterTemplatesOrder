import { useEffect, useState } from 'react';
import { useResourceStore } from '@/lib/hooks/useResourceStore';
import { useContentStore } from '@/lib/hooks/useContentStore';
import { Card, List, Button, Input, Select, Spin, Empty, Pagination } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';

interface MaterialSelectorProps {
  onSelect: (material: any) => void;
  selectedMaterialId?: string;
}

export default function MaterialSelector({ onSelect, selectedMaterialId }: MaterialSelectorProps) {
  const { getResources, isLoading, getPagination, loadResources } = useResourceStore();
  const { getContentUrl } = useContentStore();

  // 获取材质资源
  const materials = getResources('materials');
  const loading = isLoading('materials');
  const pagination = getPagination('materials');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  // 加载材质列表
  useEffect(() => {
    loadResources('materials', {
      search,
      category,
      page,
      limit: 12
    });
  }, [loadResources, search, category, page]);

  // 处理材质选择
  const handleSelect = (material: any) => {
    onSelect(material);
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  // 处理分类筛选
  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  // 处理分页
  const handlePageChange = (page: number) => {
    setPage(page);
  };

  // 获取分类名称
  const getCategoryName = (category: string) => {
    const categoryNames: Record<string, string> = {
      'metal': '金属',
      'wood': '木材',
      'plastic': '塑料',
      'fabric': '织物',
      'stone': '石材',
      'glass': '玻璃',
      'custom': '自定义'
    };
    return categoryNames[category] || category;
  };

  return (
    <div className="material-selector">
      <div className="material-selector-header">
        <Input.Search
          placeholder="搜索材质"
          onSearch={handleSearch}
          style={{ width: 200, marginRight: 16 }}
          prefix={<SearchOutlined />}
        />
        <Select
          placeholder="选择分类"
          style={{ width: 150 }}
          onChange={handleCategoryChange}
          allowClear
        >
          <Select.Option value="metal">金属</Select.Option>
          <Select.Option value="wood">木材</Select.Option>
          <Select.Option value="plastic">塑料</Select.Option>
          <Select.Option value="fabric">织物</Select.Option>
          <Select.Option value="stone">石材</Select.Option>
          <Select.Option value="glass">玻璃</Select.Option>
          <Select.Option value="custom">自定义</Select.Option>
        </Select>
      </div>

      {loading ? (
        <div className="material-selector-loading">
          <Spin size="large" />
        </div>
      ) : materials.length === 0 ? (
        <Empty description="没有找到材质" />
      ) : (
        <>
          <List
            grid={{ gutter: 16, column: 3 }}
            dataSource={materials}
            renderItem={(material) => (
              <List.Item>
                <Card
                  hoverable
                  className={`material-card ${selectedMaterialId === material.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(material)}
                  cover={
                    <div className="material-preview-container">
                      {material.maps && material.maps.map ? (
                        <img
                          alt={material.name}
                          src={getContentUrl(material.maps.map)}
                          style={{ height: 100, objectFit: 'cover' }}
                          onError={(e) => {
                            // 图片加载失败时显示统一的占位图样式
                            e.currentTarget.style.backgroundColor = '#f0f0f0';
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            height: 100,
                            backgroundColor: material.baseProperties && material.baseProperties.color ? material.baseProperties.color : '#f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        />
                      )}
                      <div className="material-type-badge">
                        {material.type === 'standard' ? '标准' :
                         material.type === 'physical' ? '物理' :
                         material.type === 'toon' ? '卡通' : material.type}
                      </div>
                      {material.category && (
                        <div className="material-category-badge">
                          {getCategoryName(material.category)}
                        </div>
                      )}
                    </div>
                  }
                >
                  <Card.Meta title={material.name} description={material.category} />
                </Card>
              </List.Item>
            )}
          />

          {pagination && pagination.total > pagination.limit && (
            <div className="material-selector-pagination">
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

      <div className="material-selector-footer">
        <Button type="primary" icon={<PlusOutlined />}>
          创建新材质
        </Button>
      </div>

      <style jsx>{`
        .material-selector {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .material-selector-header {
          display: flex;
          margin-bottom: 16px;
        }

        .material-selector-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 300px;
        }

        .material-selector-pagination {
          display: flex;
          justify-content: center;
          margin-top: 16px;
        }

        .material-selector-footer {
          margin-top: 16px;
          display: flex;
          justify-content: flex-end;
        }

        :global(.material-card.selected) {
          border: 2px solid #1890ff;
        }

        :global(.material-preview-container) {
          position: relative;
          overflow: hidden;
        }

        :global(.material-type-badge) {
          position: absolute;
          top: 8px;
          right: 8px;
          background-color: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
        }

        :global(.material-category-badge) {
          position: absolute;
          bottom: 8px;
          left: 8px;
          background-color: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}
