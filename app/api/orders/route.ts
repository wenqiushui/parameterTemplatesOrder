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

export async function GET(request: NextRequest) {
  try {
    // 获取会话
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 获取用户的所有订单
    const orders = await orderService.getUserOrders(session.user.id);
    
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 获取会话
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { items } = await request.json();
    
    // 验证请求数据
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: '缺少必要的参数' },
        { status: 400 }
      );
    }
    
    // 创建订单
    const orderId = await orderService.createOrder(session.user.id, items);
    
    return NextResponse.json({ orderId });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order: ' + error.message },
      { status: 500 }
    );
  }
}
