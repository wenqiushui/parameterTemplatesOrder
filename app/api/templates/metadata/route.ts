import { NextResponse } from 'next/server';
import { getAllTemplateMetadata } from '@/lib/models/TemplateMetadata';
import { templateScanService } from '@/lib/services/templateScanService';

// 标记是否已经扫描过模板
let hasScannedTemplates = false;

// GET /api/templates/metadata - 获取所有模板的元数据
export async function GET() {
  try {
    // 初始化模板扫描服务
    await templateScanService.initialize();

    // 获取所有模板元数据
    console.log('Getting all template metadata...');
    let metadata = await getAllTemplateMetadata();
    console.log(`Found ${metadata.length} templates in database:`, metadata.map(t => t.id));

    // 如果没有模板或者还没有扫描过，尝试扫描模板文件
    if (metadata.length === 0 || !hasScannedTemplates) {
      console.log(`${metadata.length === 0 ? 'No templates found in database' : 'First request'}, scanning template files...`);

      // 扫描模板文件并保存元数据
      const savedIds = await templateScanService.loadTemplatesAndSaveMetadata();
      console.log(`Scanned and saved ${savedIds.length} templates:`, savedIds);

      // 标记已经扫描过模板
      hasScannedTemplates = true;

      // 重新获取模板元数据
      metadata = await getAllTemplateMetadata();
      console.log(`Found ${metadata.length} templates after scanning:`, metadata.map(t => t.id));
    }

    // 返回数据库中的模板元数据
    console.log(`Returning ${metadata.length} template metadata objects`);
    return NextResponse.json(metadata, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching template metadata:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
