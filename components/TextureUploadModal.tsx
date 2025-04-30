'use client';

import { useState } from 'react';
import { Modal, Form, Input, Select, Upload, Button, Switch, Tag, message } from 'antd';
import { PlusOutlined, UploadOutlined, InboxOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

const { Option } = Select;
const { Dragger } = Upload;

interface TextureUploadModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: (texture: any) => void;
  textureType?: string;
}

export default function TextureUploadModal({ open, onCancel, onSuccess, textureType }: TextureUploadModalProps) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (fileList.length === 0) {
        message.error('请选择要上传的贴图文件');
        return;
      }
      
      setUploading(true);
      
      // 创建 FormData
      const formData = new FormData();
      formData.append('file', fileList[0].originFileObj as Blob);
      formData.append('name', values.name);
      formData.append('description', values.description || '');
      formData.append('type', values.type);
      formData.append('category', values.category);
      formData.append('isPublic', values.isPublic ? 'true' : 'false');
      formData.append('tags', tags.join(','));
      
      // 发送请求
      const response = await fetch('/api/resources/textures', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '上传贴图失败');
      }
      
      const texture = await response.json();
      
      message.success('贴图上传成功');
      onSuccess(texture);
      
      // 重置表单
      form.resetFields();
      setFileList([]);
      setTags([]);
    } catch (error) {
      console.error('Error uploading texture:', error);
      message.error('上传贴图失败: ' + (error.message || '未知错误'));
    } finally {
      setUploading(false);
    }
  };
  
  // 处理文件上传
  const handleFileChange: UploadProps['onChange'] = ({ fileList }) => {
    setFileList(fileList.slice(-1)); // 只保留最后一个文件
  };
  
  // 处理标签输入显示
  const showInput = () => {
    setInputVisible(true);
  };
  
  // 处理标签输入隐藏
  const handleInputConfirm = () => {
    if (inputValue && !tags.includes(inputValue)) {
      setTags([...tags, inputValue]);
    }
    setInputVisible(false);
    setInputValue('');
  };
  
  // 处理标签删除
  const handleTagClose = (removedTag: string) => {
    const newTags = tags.filter(tag => tag !== removedTag);
    setTags(newTags);
  };
  
  // 上传组件属性
  const uploadProps: UploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      // 检查文件类型
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件!');
        return Upload.LIST_IGNORE;
      }
      
      // 检查文件大小
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('图片必须小于 10MB!');
        return Upload.LIST_IGNORE;
      }
      
      // 自动设置名称
      if (!form.getFieldValue('name')) {
        form.setFieldValue('name', file.name.split('.')[0]);
      }
      
      return false;
    },
    fileList,
    onChange: handleFileChange,
    maxCount: 1
  };
  
  return (
    <Modal
      title="上传贴图"
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="上传"
      cancelText="取消"
      confirmLoading={uploading}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          type: textureType || 'baseColor',
          category: 'generic',
          isPublic: true
        }}
      >
        <Form.Item
          name="file"
          label="贴图文件"
          rules={[{ required: true, message: '请上传贴图文件' }]}
        >
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持 JPG, PNG, WebP 等图片格式，文件大小不超过 10MB
            </p>
          </Dragger>
        </Form.Item>
        
        <Form.Item
          name="name"
          label="贴图名称"
          rules={[{ required: true, message: '请输入贴图名称' }]}
        >
          <Input placeholder="输入贴图名称" />
        </Form.Item>
        
        <Form.Item
          name="description"
          label="描述"
        >
          <Input.TextArea placeholder="输入贴图描述（可选）" rows={2} />
        </Form.Item>
        
        <Form.Item
          name="type"
          label="贴图类型"
          rules={[{ required: true, message: '请选择贴图类型' }]}
        >
          <Select placeholder="选择贴图类型">
            <Option value="baseColor">颜色贴图</Option>
            <Option value="normal">法线贴图</Option>
            <Option value="roughness">粗糙度贴图</Option>
            <Option value="metalness">金属度贴图</Option>
            <Option value="height">高度贴图</Option>
            <Option value="ao">环境光遮蔽贴图</Option>
            <Option value="emissive">自发光贴图</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name="category"
          label="贴图分类"
          rules={[{ required: true, message: '请选择贴图分类' }]}
        >
          <Select placeholder="选择贴图分类">
            <Option value="fabric">织物</Option>
            <Option value="wood">木材</Option>
            <Option value="metal">金属</Option>
            <Option value="stone">石材</Option>
            <Option value="plastic">塑料</Option>
            <Option value="glass">玻璃</Option>
            <Option value="leather">皮革</Option>
            <Option value="concrete">混凝土</Option>
            <Option value="generic">通用</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          label="标签"
          extra="添加标签以便更好地分类和搜索贴图"
        >
          <div style={{ marginBottom: 16 }}>
            {tags.map(tag => (
              <Tag
                key={tag}
                closable
                onClose={() => handleTagClose(tag)}
                style={{ marginBottom: 8 }}
              >
                {tag}
              </Tag>
            ))}
            
            {inputVisible ? (
              <Input
                type="text"
                size="small"
                style={{ width: 78 }}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onBlur={handleInputConfirm}
                onPressEnter={handleInputConfirm}
                autoFocus
              />
            ) : (
              <Tag onClick={showInput} style={{ borderStyle: 'dashed', cursor: 'pointer' }}>
                <PlusOutlined /> 添加标签
              </Tag>
            )}
          </div>
        </Form.Item>
        
        <Form.Item
          name="isPublic"
          label="公开可见"
          valuePropName="checked"
          extra="公开的贴图可以被其他用户使用"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
