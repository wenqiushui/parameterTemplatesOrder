'use client';

import { useState } from 'react';
import { Modal, Form, Input, Upload, Button, Slider, message } from 'antd';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

const { Dragger } = Upload;

interface EnvironmentUploadModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: (environment: any) => void;
}

export default function EnvironmentUploadModal({ open, onCancel, onSuccess }: EnvironmentUploadModalProps) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (fileList.length === 0) {
        message.error('请选择要上传的环境贴图文件');
        return;
      }

      setUploading(true);

      // 创建 FormData
      const formData = new FormData();
      formData.append('file', fileList[0].originFileObj as Blob);
      formData.append('name', values.name);
      formData.append('description', values.description || '');
      formData.append('intensity', values.intensity.toString());

      // 发送请求
      const response = await fetch('/api/resources/environments', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '上传环境贴图失败');
      }

      const environment = await response.json();

      message.success('环境贴图上传成功');
      onSuccess(environment);

      // 重置表单
      form.resetFields();
      setFileList([]);
    } catch (error) {
      console.error('Error uploading environment:', error);
      message.error('上传环境贴图失败: ' + (error.message || '未知错误'));
    } finally {
      setUploading(false);
    }
  };

  // 处理文件上传
  const handleFileChange: UploadProps['onChange'] = ({ fileList }) => {
    setFileList(fileList.slice(-1)); // 只保留最后一个文件
  };

  // 上传组件属性
  const uploadProps: UploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      // 检查文件类型
      const fileName = file.name.toLowerCase();
      const isValidFormat = fileName.endsWith('.hdr') ||
                           fileName.endsWith('.exr') ||
                           fileName.endsWith('.jpg') ||
                           fileName.endsWith('.jpeg') ||
                           fileName.endsWith('.png');

      if (!isValidFormat) {
        message.error('只能上传 HDR, EXR, JPG 或 PNG 格式的文件!');
        return Upload.LIST_IGNORE;
      }

      // 检查文件大小
      const isLt20M = file.size / 1024 / 1024 < 20;
      if (!isLt20M) {
        message.error('文件必须小于 20MB!');
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
      title="上传环境贴图"
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
          intensity: 1.0
        }}
      >
        <Form.Item
          name="file"
          label="环境贴图文件"
          rules={[{ required: true, message: '请上传环境贴图文件' }]}
        >
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持 HDR, EXR, JPG, PNG 格式，推荐使用 HDR 格式以获得最佳效果
            </p>
          </Dragger>
        </Form.Item>

        <Form.Item
          name="name"
          label="环境贴图名称"
          rules={[{ required: true, message: '请输入环境贴图名称' }]}
        >
          <Input placeholder="输入环境贴图名称" />
        </Form.Item>

        <Form.Item
          name="description"
          label="描述"
        >
          <Input.TextArea placeholder="输入环境贴图描述（可选）" rows={2} />
        </Form.Item>

        <Form.Item
          name="intensity"
          label="光照强度"
        >
          <Slider
            min={0}
            max={2}
            step={0.1}
            onChange={(value) => form.setFieldsValue({ intensity: value })}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
