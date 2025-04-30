import { v4 as uuidv4 } from 'uuid';
import { hash, compare } from 'bcrypt';
import { db } from '@/lib/db';

export class UserService {
  constructor() {}
  
  // 创建用户
  async createUser(username, email, password) {
    // 检查邮箱是否已存在
    const existingUser = await db.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      throw new Error('Email already in use');
    }
    
    // 哈希密码
    const hashedPassword = await hash(password, 10);
    
    // 创建用户
    const user = await db.user.create({
      data: {
        id: uuidv4(),
        username,
        email,
        password: hashedPassword
      }
    });
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    };
  }
  
  // 验证用户
  async validateUser(email, password) {
    const user = await db.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return null;
    }
    
    const isPasswordValid = await compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    };
  }
  
  // 获取用户
  async getUser(userId) {
    const user = await db.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    };
  }
  
  // 更新用户
  async updateUser(userId, updates) {
    const user = await this.getUser(userId);
    
    const updatedUser = {
      username: updates.username || user.username,
      email: updates.email || user.email
    };
    
    // 如果提供了新密码，哈希它
    if (updates.password) {
      updatedUser['password'] = await hash(updates.password, 10);
    }
    
    // 更新用户
    await db.user.update({
      where: { id: userId },
      data: updatedUser
    });
    
    return {
      id: userId,
      username: updatedUser.username,
      email: updatedUser.email
    };
  }
  
  // 删除用户
  async deleteUser(userId) {
    await db.user.delete({
      where: { id: userId }
    });
    
    return userId;
  }
}
