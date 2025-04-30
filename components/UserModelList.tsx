'use client';

/**
 * 用户模型列表组件
 *
 * 该组件用于显示用户的模型实例列表
 * 它可以从数据库加载用户的模型实例，并提供选择和操作功能
 */

import { useState, useEffect } from 'react';
import { List, Card, Button, Spin, message, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { templateModelService } from '@/lib/services/templateModelService';
import { ModelInstance } from '@/lib/services/templateModelService';

interface UserModelListProps {
  userId: string;
  onSelectModel?: (modelId: string) => void;
  onDeleteModel?: (modelId: string) => void;
  onEditModel?: (modelId: string) => void;
}

export default function UserModelList({
  userId,
  onSelectModel,
  onDeleteModel,
  onEditModel
}: UserModelListProps) {
  const [models, setModels] = useState<ModelInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 加载用户模型列表
  const loadModels = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Loading models for user: ${userId}`);
      const userModels = await templateModelService.getUserModelInstances(userId);
      console.log(`Loaded ${userModels.length} models`);
      setModels(userModels);
    } catch (err: any) {
      console.error('Error loading user models:', err);
      setError(err.message);
      message.error(`加载模型列表失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // 初始加载
  useEffect(() => {
    loadModels();
  }, [userId]);
  
  // 删除模型
  const handleDeleteModel = async (modelId: string) => {
    try {
      console.log(`Deleting model: ${modelId}`);
      await templateModelService.deleteModelInstance(modelId);
      message.success('模型已删除');
      
      // 刷新列表
      loadModels();
      
      // 调用回调
      if (onDeleteModel) {
        onDeleteModel(modelId);
      }
    } catch (err: any) {
      console.error('Error deleting model:', err);
      message.error(`删除模型失败: ${err.message}`);
    }
  };
  
  // 渲染模型列表
  return (
    <div className="user-model-list">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin tip="加载模型中..." />
        </div>
      ) : error ? (
        <div style={{ color: 'red', padding: '20px' }}>
          <p>加载模型列表失败: {error}</p>
          <Button type="primary" onClick={loadModels}>重试</Button>
        </div>
      ) : models.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>暂无模型</p>
        </div>
      ) : (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={models}
          renderItem={(model) => (
            <List.Item>
              <Card
                title={model.name}
                hoverable
                onClick={() => onSelectModel && onSelectModel(model.id)}
                actions={[
                  <Button 
                    key="view" 
                    type="text" 
                    icon={<EyeOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectModel && onSelectModel(model.id);
                    }}
                  >
                    查看
                  </Button>,
                  <Button 
                    key="edit" 
                    type="text" 
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditModel && onEditModel(model.id);
                    }}
                  >
                    编辑
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title="确定要删除这个模型吗？"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      handleDeleteModel(model.id);
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    >
                      删除
                    </Button>
                  </Popconfirm>
                ]}
              >
                <p>模板: {model.templateId}</p>
                <p>创建时间: {new Date(model.createdAt).toLocaleString()}</p>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
