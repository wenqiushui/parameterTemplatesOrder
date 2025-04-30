/**
 * 模板扫描脚本
 * 
 * 用于扫描模板文件并将元数据保存到数据库
 * 可以在开发环境或部署前运行
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 模板文件模式
const TEMPLATE_FILE_PATTERN = /^([A-Z][a-zA-Z0-9]+)Template\.ts$/;

// 模板目录
const templatesDir = path.resolve(process.cwd(), 'lib', 'templates');

// 扫描模板文件
function scanTemplateFiles() {
  try {
    // 读取目录内容
    const files = fs.readdirSync(templatesDir);
    
    // 过滤出模板文件
    const templateFiles = files.filter(file => 
      file.match(TEMPLATE_FILE_PATTERN) && 
      file !== 'baseTemplate.ts' && 
      !file.startsWith('.')
    );
    
    console.log(`Found ${templateFiles.length} template files:`, templateFiles);
    
    return templateFiles;
  } catch (error) {
    console.error('Error scanning template files:', error);
    return [];
  }
}

// 调用 API 扫描模板
async function callScanTemplatesAPI() {
  try {
    // 获取 Next.js 开发服务器 URL
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // 构建 API URL
    const apiUrl = `${serverUrl}/api/admin/scan-templates`;
    
    // 调用 API
    console.log(`Calling API: ${apiUrl}`);
    
    // 使用 curl 调用 API
    const result = execSync(`curl -X POST ${apiUrl}`, { encoding: 'utf-8' });
    
    console.log('API response:', result);
    
    return true;
  } catch (error) {
    console.error('Error calling scan templates API:', error);
    return false;
  }
}

// 主函数
async function main() {
  console.log('Scanning template files...');
  
  // 扫描模板文件
  const templateFiles = scanTemplateFiles();
  
  if (templateFiles.length === 0) {
    console.error('No template files found');
    process.exit(1);
  }
  
  console.log('Calling scan templates API...');
  
  // 调用 API 扫描模板
  const success = await callScanTemplatesAPI();
  
  if (success) {
    console.log('Templates scanned and saved to database successfully');
    process.exit(0);
  } else {
    console.error('Failed to scan templates');
    process.exit(1);
  }
}

// 运行主函数
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
