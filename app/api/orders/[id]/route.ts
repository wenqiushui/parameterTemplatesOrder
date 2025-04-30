import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ModelService } from '@/lib/services/modelService';
import { MaterialService } from '@/lib/services/materialService';
import { ConfigService } from '@/lib/services/configService';
import { OrderService } from '@/lib/services/orderService';

// 初始化服务
const modelService = new ModelService();
const materialService = new MaterialService();
const configService = new ConfigService(modelService, materialService);
const orderService = new OrderService(configService);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取会话
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 获取订单
    const order = await orderService.getOrder(params.id);
    
    // 检查权限
    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取会话
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { status } = await request.json();
    
    // 验证请求数据
    if (!status) {
      return NextResponse.json(
        { error: '缺少必要的参数' },
        { status: 400 }
      );
    }
    
    // 获取订单
    const order = await orderService.getOrder(params.id);
    
    // 检查权限
    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // 更新订单状态
    const orderId = await orderService.updateOrderStatus(params.id, status);
    
    return NextResponse.json({ orderId });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取会话
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 获取订单
    const order = await orderService.getOrder(params.id);
    
    // 检查权限
    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // 取消订单
    const orderId = await orderService.cancelOrder(params.id);
    
    return NextResponse.json({ orderId });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
