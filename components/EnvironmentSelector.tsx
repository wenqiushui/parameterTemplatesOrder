import { useEffect, useState } from 'react';
import { useResourceStore } from '@/lib/hooks/useResourceStore';
import { useContentStore } from '@/lib/hooks/useContentStore';
import { Card, List, Button, Input, Spin, Empty, Pagination, Slider, Radio, ColorPicker } from 'antd';
import { SearchOutlined, PlusOutlined, EnvironmentOutlined } from '@ant-design/icons';
import EnvironmentUploadModal from './EnvironmentUploadModal';

interface EnvironmentSelectorProps {
  onSelect: (environment: any) => void;
  onSceneChange: (sceneSettings: any) => void;
  selectedEnvironmentId?: string;
  sceneSettings?: any;
}

export default function EnvironmentSelector({
  onSelect,
  onSceneChange,
  selectedEnvironmentId,
  sceneSettings = {}
}: EnvironmentSelectorProps) {
  const { getResources, isLoading, getPagination, loadResources } = useResourceStore();
  const { getContentUrl } = useContentStore();

  // 获取环境资源
  const environments = getResources('environments');
  const loading = isLoading('environments');
  const pagination = getPagination('environments');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [settings, setSettings] = useState({
    backgroundType: sceneSettings.backgroundType || 'environment',
    backgroundColor: sceneSettings.backgroundColor || '#f0f0f0',
    exposure: sceneSettings.exposure || 1.0,
    toneMapping: sceneSettings.toneMapping || 'ACESFilmic'
  });

  // 加载环境贴图列表
  useEffect(() => {
    loadResources('environments', {
      search,
      page,
      limit: 8
    });
  }, [loadResources, search, page]);

  // 处理环境贴图选择
  const handleSelect = (environment) => {
    onSelect(environment);

    // 更新场景设置
    const newSettings = {
      ...settings,
      environmentMapId: environment.id
    };

    setSettings(newSettings);
    onSceneChange(newSettings);
  };

  // 处理搜索
  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  // 处理分页
  const handlePageChange = (page) => {
    setPage(page);
  };

  // 处理背景类型变更
  const handleBackgroundTypeChange = (e) => {
    const backgroundType = e.target.value;

    const newSettings = {
      ...settings,
      backgroundType
    };

    setSettings(newSettings);
    onSceneChange(newSettings);
  };

  // 处理背景颜色变更
  const handleBackgroundColorChange = (color) => {
    const backgroundColor = color.toHexString();

    const newSettings = {
      ...settings,
      backgroundColor
    };

    setSettings(newSettings);
    onSceneChange(newSettings);
  };

  // 处理曝光度变更
  const handleExposureChange = (exposure) => {
    const newSettings = {
      ...settings,
      exposure
    };

    setSettings(newSettings);
    onSceneChange(newSettings);
  };

  // 处理色调映射变更
  const handleToneMappingChange = (e) => {
    const toneMapping = e.target.value;

    const newSettings = {
      ...settings,
      toneMapping
    };

    setSettings(newSettings);
    onSceneChange(newSettings);
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
  const handleUploadSuccess = (environment) => {
    setIsUploadModalOpen(false);
    loadResources('environments', {
      search,
      page,
      limit: 8
    });
    onSelect(environment);
  };

  // 新增：用于暂存用户选择但未应用的环境贴图ID
  const [pendingEnvironmentId, setPendingEnvironmentId] = useState<string | null>(null);

  // 修改环境贴图选择逻辑：只暂存选择，不立即应用
  const handlePendingSelect = (environment) => {
    setPendingEnvironmentId(environment.id);
  };

  // 新增：点击按钮后应用环境贴图
  const handleApplyEnvironment = () => {
    if (!pendingEnvironmentId) return;
    const selectedEnv = environments.find(env => env.id === pendingEnvironmentId);
    if (selectedEnv) {
      handleSelect(selectedEnv);
    }
  };

  return (
    <div className="environment-selector">
      <div className="environment-selector-header">
        <Input.Search
          placeholder="搜索环境贴图"
          onSearch={handleSearch}
          style={{ width: 200 }}
          prefix={<SearchOutlined />}
        />
      </div>
      {loading ? (
        <div className="environment-selector-loading">
          <Spin size="large" />
        </div>
      ) : environments.length === 0 ? (
        <Empty description="没有找到环境贴图" />
      ) : (
        <>
          <List
            grid={{ gutter: 16, column: 4 }}
            dataSource={environments}
            renderItem={(environment) => (
              <List.Item>
                <Card
                  hoverable
                  className={`environment-card ${pendingEnvironmentId === environment.id ? 'selected' : ''}`}
                  onClick={() => handlePendingSelect(environment)}
                  cover={
                    <div className="environment-preview-container">
                      <img
                        alt={environment.name}
                        src={getContentUrl(environment.thumbnail, 'thumbnail')}
                        style={{ height: 100, objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.style.backgroundColor = '#f0f0f0';
                        }}
                      />
                      <div className="environment-info-overlay">
                        <div className="environment-format-badge">
                          {environment.format || 'HDR'}
                        </div>
                        {environment.intensity && (
                          <div className="environment-intensity-badge">
                            强度: {environment.intensity}
                          </div>
                        )}
                      </div>
                    </div>
                  }
                >
                  <Card.Meta title={environment.name} />
                </Card>
              </List.Item>
            )}
          />
          {pagination && pagination.total > pagination.limit && (
            <div className="environment-selector-pagination">
              <Pagination
                current={page}
                pageSize={pagination.limit}
                total={pagination.total}
                onChange={handlePageChange}
                showSizeChanger={false}
              />
            </div>
          )}
          {/* 新增：更改环境贴图按钮 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <Button
              type="primary"
              disabled={!pendingEnvironmentId || pendingEnvironmentId === settings.environmentMapId}
              onClick={handleApplyEnvironment}
            >
              更改环境贴图
            </Button>
          </div>
        </>
      )}

      <div className="environment-settings">
        <h3>环境设置</h3>

        <div className="setting-item">
          <div className="setting-label">背景类型</div>
          <Radio.Group value={settings.backgroundType} onChange={handleBackgroundTypeChange}>
            <Radio.Button value="environment">环境贴图</Radio.Button>
            <Radio.Button value="color">纯色</Radio.Button>
            <Radio.Button value="transparent">透明</Radio.Button>
          </Radio.Group>
        </div>

        {settings.backgroundType === 'color' && (
          <div className="setting-item">
            <div className="setting-label">背景颜色</div>
            <ColorPicker value={settings.backgroundColor} onChange={handleBackgroundColorChange} />
          </div>
        )}

        <div className="setting-item">
          <div className="setting-label">曝光度: {settings.exposure.toFixed(2)}</div>
          <Slider
            min={0}
            max={2}
            step={0.01}
            value={settings.exposure}
            onChange={handleExposureChange}
          />
        </div>

        <div className="setting-item">
          <div className="setting-label">色调映射</div>
          <Radio.Group value={settings.toneMapping} onChange={handleToneMappingChange}>
            <Radio.Button value="ACESFilmic">ACES Filmic</Radio.Button>
            <Radio.Button value="Linear">Linear</Radio.Button>
            <Radio.Button value="Reinhard">Reinhard</Radio.Button>
          </Radio.Group>
        </div>
      </div>

      <div className="environment-selector-footer">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenUploadModal}
        >
          上传新环境贴图
        </Button>
      </div>

      {/* 环境贴图上传模态框 */}
      <EnvironmentUploadModal
        open={isUploadModalOpen}
        onCancel={handleCloseUploadModal}
        onSuccess={handleUploadSuccess}
      />

      <style jsx>{`
        .environment-selector {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .environment-selector-header {
          display: flex;
          margin-bottom: 16px;
        }

        .environment-selector-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
        }

        .environment-selector-pagination {
          display: flex;
          justify-content: center;
          margin-top: 16px;
        }

        .environment-settings {
          margin-top: 24px;
          padding: 16px;
          background-color: #f5f5f5;
          border-radius: 4px;
        }

        .setting-item {
          margin-bottom: 16px;
        }

        .setting-label {
          margin-bottom: 8px;
          font-weight: 500;
        }

        .environment-selector-footer {
          margin-top: 16px;
          display: flex;
          justify-content: flex-end;
        }

        :global(.environment-card.selected) {
          border: 2px solid #1890ff;
        }

        :global(.environment-preview-container) {
          position: relative;
          overflow: hidden;
        }

        :global(.environment-info-overlay) {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 4px 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        :global(.environment-format-badge) {
          font-size: 12px;
          font-weight: bold;
          background-color: rgba(0, 0, 0, 0.5);
          padding: 2px 6px;
          border-radius: 4px;
        }

        :global(.environment-intensity-badge) {
          font-size: 12px;
          background-color: rgba(0, 0, 0, 0.5);
          padding: 2px 6px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
