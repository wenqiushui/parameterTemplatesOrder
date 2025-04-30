// 导入模板注册表
const { templateRegistry } = require('../lib/templates/templateRegistry');

// 模板类现在通过 lib/templates/index.ts 自动导入

// 检查模板注册
console.log('Template registry initialized with templates:', templateRegistry.getAllTemplateIds());

// 获取所有模板
const templates = templateRegistry.getAllTemplates();
console.log(`Found ${templates.length} templates:`, templates.map(t => t.id));

// 检查每个模板
templates.forEach(template => {
  console.log(`Template: ${template.id}`);
  console.log(`  Name: ${template.name}`);
  console.log(`  Description: ${template.description}`);
  console.log(`  Generation Mode: ${template.generationMode}`);
  console.log(`  Parameter Schema:`, template.getParameterSchema());
  console.log(`  Default Parameters:`, template.parameters);
});
