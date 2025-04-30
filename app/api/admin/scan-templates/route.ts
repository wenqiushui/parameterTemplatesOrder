/**
 * 模板扫描 API 端点
 * 
 * 用于管理员触发模板扫描和元数据更新
 */

import { NextResponse } from 'next/server';
import { templateScanService } from '@/lib/services/templateScanService';

/**
 * POST /api/admin/scan-templates
 * 扫描模板文件并更新数据库
 */
export async function POST() {
  try {
    // 初始化服务
    const initialized = await templateScanService.initialize();
    
    if (!initialized) {
      return NextResponse.json(
        { error: 'Failed to initialize template scan service' },
        { status: 500 }
      );
    }
    
    // 扫描模板并保存元数据
    const savedIds = await templateScanService.loadTemplatesAndSaveMetadata();
    
    // 返回结果
    return NextResponse.json({
      success: true,
      message: `Scanned and saved metadata for ${savedIds.length} templates`,
      templateIds: savedIds
    });
  } catch (error) {
    console.error('Error in POST /api/admin/scan-templates:', error);
    return NextResponse.json(
      { error: 'Failed to scan templates' },
      { status: 500 }
    );
  }
}
