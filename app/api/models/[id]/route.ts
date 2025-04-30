/**
 * 单个模型实例 API
 *
 * 该 API 提供了单个模型实例的操作
 * 它允许获取、更新和删除单个模型实例
 */

import { NextRequest, NextResponse } from 'next/server';
import { templateModelService } from '@/lib/services/templateModelService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/models/[id] - 获取单个模型实例
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取当前用户
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 获取模型实例
    const modelData = await templateModelService.loadModelInstance(params.id);

    // 返回结果
    return NextResponse.json({
      success: true,
      model: modelData
    });
  } catch (error: any) {
    console.error(`Error getting model instance ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to get model instance', message: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/models/[id] - 更新模型实例
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取当前用户
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { name, parameters } = body;

    // 验证请求参数
    if (!name && !parameters) {
      return NextResponse.json(
        { error: 'At least one of name or parameters is required' },
        { status: 400 }
      );
    }

    // 更新模型实例
    await templateModelService.updateModelInstance(params.id, {
      name,
      parameters
    });

    // 返回结果
    return NextResponse.json({
      success: true
    });
  } catch (error: any) {
    console.error(`Error updating model instance ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update model instance', message: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/models/[id] - 删除模型实例
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取当前用户
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 删除模型实例
    await templateModelService.deleteModelInstance(params.id);

    // 返回结果
    return NextResponse.json({
      success: true
    });
  } catch (error: any) {
    console.error(`Error deleting model instance ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete model instance', message: error.message },
      { status: 500 }
    );
  }
}
