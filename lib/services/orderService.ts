import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { ConfigService } from './configService';

export class OrderService {
  constructor(private configService: ConfigService) {}
  
  // 创建订单
  async createOrder(userId, items) {
    // 验证配置存在
    for (const item of items) {
      await this.configService.getConfiguration(item.configId);
    }
    
    // 计算总价
    let totalPrice = 0;
    for (const item of items) {
      totalPrice += item.price * item.quantity;
    }
    
    // 开始事务
    const orderId = uuidv4();
    
    try {
      // 创建订单
      await db.order.create({
        data: {
          id: orderId,
          userId,
          status: 'pending',
          totalPrice,
          items: {
            create: items.map(item => ({
              id: uuidv4(),
              configId: item.configId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        }
      });
      
      return orderId;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
  }
  
  // 获取订单
  async getOrder(orderId) {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            config: {
              include: {
                model: true
              }
            }
          }
        }
      }
    });
    
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    return {
      id: order.id,
      userId: order.userId,
      status: order.status,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        id: item.id,
        configId: item.configId,
        configName: item.config.name,
        modelName: item.config.model.name,
        quantity: item.quantity,
        price: item.price
      }))
    };
  }
  
  // 更新订单状态
  async updateOrderStatus(orderId, status) {
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
    
    await db.order.update({
      where: { id: orderId },
      data: { status }
    });
    
    return orderId;
  }
  
  // 获取用户的所有订单
  async getUserOrders(userId) {
    const orders = await db.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            config: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return orders.map(order => ({
      id: order.id,
      status: order.status,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
      itemCount: order.items.length,
      items: order.items.map(item => ({
        configName: item.config.name,
        quantity: item.quantity,
        price: item.price
      }))
    }));
  }
  
  // 取消订单
  async cancelOrder(orderId) {
    const order = await this.getOrder(orderId);
    
    if (order.status === 'shipped' || order.status === 'delivered') {
      throw new Error('Cannot cancel an order that has been shipped or delivered');
    }
    
    await this.updateOrderStatus(orderId, 'cancelled');
    
    return orderId;
  }
}
