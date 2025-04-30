import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/userService';

const userService = new UserService();

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();
    
    // 验证请求数据
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: '缺少必要的参数' },
        { status: 400 }
      );
    }
    
    // 创建用户
    const user = await userService.createUser(username, email, password);
    
    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'Failed to register user: ' + error.message },
      { status: 500 }
    );
  }
}
