import { NextResponse } from 'next/server';
import { templateDependencyService } from '@/lib/services/templateDependencyService';
import { ensureAllTemplatesRegistered } from '@/lib/templates/discovery';

// POST /api/templates/analyze-dependencies - 分析模板依赖
export async function POST() {
  try {
    console.log('POST /api/templates/analyze-dependencies - Analyzing template dependencies');
    
    // 确保所有模板都已注册
    await ensureAllTemplatesRegistered();
    
    // 分析所有模板依赖
    const dependencies = templateDependencyService.analyzeAllTemplateDependencies();
    
    // 更新模板生成模式
    templateDependencyService.updateTemplateGenerationModes();
    
    return NextResponse.json(dependencies, { status: 200 });
  } catch (error: any) {
    console.error('Error analyzing template dependencies:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
