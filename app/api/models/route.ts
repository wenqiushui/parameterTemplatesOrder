/**
 * 模型实例 API
 *
 * 该 API 提供了模型实例的 CRUD 操作
 * 它允许保存、加载、更新和删除模型实例
 */

import { NextRequest, NextResponse } from 'next/server';
import { templateModelService } from '@/lib/services/templateModelService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/models - 获取当前用户的所有模型实例
export async function GET(request: NextRequest) {
  try {
    // 获取当前用户
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 获取用户的所有模型实例
    const models = await templateModelService.getUserModelInstances(session.user.id);

    // 返回结果
    return NextResponse.json({
      success: true,
      models
    });
  } catch (error: any) {
    console.error('Error getting user models:', error);
    return NextResponse.json(
      { error: 'Failed to get user models', message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/models - 创建新的模型实例
export async function POST(request: NextRequest) {
  try {
    // 获取当前用户
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 检查内容类型
    const contentType = request.headers.get('content-type') || '';

    // 处理 JSON 请求
    if (contentType.includes('application/json')) {
      // 解析请求体
      const body = await request.json();
      const { templateId, parameters, name } = body;

      // 验证请求参数
      if (!templateId) {
        return NextResponse.json(
          { error: 'Template ID is required' },
          { status: 400 }
        );
      }

      if (!parameters) {
        return NextResponse.json(
          { error: 'Parameters are required' },
          { status: 400 }
        );
      }

      if (!name) {
        return NextResponse.json(
          { error: 'Name is required' },
          { status: 400 }
        );
      }

      // 保存模型实例
      const modelId = await templateModelService.saveModelInstance(
        templateId,
        parameters,
        name,
        session.user.id
      );

      // 返回结果
      return NextResponse.json({
        success: true,
        modelId
      });
    }
    // 处理 multipart/form-data 请求（文件上传）
    else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const glbFile = formData.get('glbFile') as File;
      const productDataStr = formData.get('productData') as string;

      if (!glbFile || !productDataStr) {
        return NextResponse.json(
          { error: '缺少必要的文件或数据' },
          { status: 400 }
        );
      }

      const productData = JSON.parse(productDataStr);

      // 处理文件上传和模型创建
      // 这里需要实现文件上传和模型创建的逻辑
      // ...

      return NextResponse.json({ success: true, id: productData.id });
    }
    else {
      return NextResponse.json(
        { error: 'Unsupported content type' },
        { status: 415 }
      );
    }
  } catch (error: any) {
    console.error('Error creating model instance:', error);
    return NextResponse.json(
      { error: 'Failed to create model instance', message: error.message },
      { status: 500 }
    );
  }
}
