import { NextResponse } from 'next/server';
import { templateDependencyService } from '@/lib/services/templateDependencyService';
import { ensureAllTemplatesRegistered } from '@/lib/templates/discovery';

// GET /api/templates/dependencies - 获取模板依赖分析结果
export async function GET() {
  try {
    console.log('GET /api/templates/dependencies - Getting template dependencies');
    
    // 确保所有模板都已注册
    await ensureAllTemplatesRegistered();
    
    // 分析所有模板依赖
    const dependencies = templateDependencyService.analyzeAllTemplateDependencies();
    
    return NextResponse.json(dependencies, { status: 200 });
  } catch (error: any) {
    console.error('Error getting template dependencies:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
