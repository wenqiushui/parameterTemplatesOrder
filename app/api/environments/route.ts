import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 获取环境贴图列表
export async function GET(request: NextRequest) {
  try {
    // 查询所有环境贴图
    const environments = await db.environmentMap.findMany({
      select: {
        id: true,
        name: true,
        format: true,
        thumbnail: true,
        intensity: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(environments);
  } catch (error) {
    console.error('Error fetching environments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch environments' },
      { status: 500 }
    );
  }
}