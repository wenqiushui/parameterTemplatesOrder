/**
 * 模板扫描服务
 *
 * 负责扫描模板文件并将元数据保存到数据库
 */

import fs from 'fs/promises';
import path from 'path';
import { BaseTemplate } from '@/lib/templates/baseTemplate';
import { saveTemplateMetadata as dbSaveTemplateMetadata, initTemplateMetadataTable } from '@/lib/models/TemplateMetadata';
import { TemplateMetadataRecord } from '@/lib/models/TemplateMetadata';

// 模板文件模式
const TEMPLATE_FILE_PATTERN = /^([A-Z][a-zA-Z0-9]+)Template\.ts$/;

/**
 * 模板扫描服务
 */
export class TemplateScanService {
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.resolve(process.cwd(), 'lib', 'templates', 'definitions');
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<boolean> {
    try {
      // 初始化模板元数据表
      const tableInitialized = await initTemplateMetadataTable();
      if (!tableInitialized) {
        console.error('[TemplateScanService] Failed to initialize template metadata table');
        return false;
      }

      return true;
    } catch (error) {
      console.error('[TemplateScanService] Error initializing service:', error);
      return false;
    }
  }

  /**
   * 扫描模板文件
   */
  async scanTemplateFiles(): Promise<string[]> {
    try {
      // 读取目录内容
      const files = await fs.readdir(this.templatesDir);

      // 过滤出模板文件
      const templateFiles = files.filter(file =>
        file.match(TEMPLATE_FILE_PATTERN) &&
        file !== 'baseTemplate.ts' &&
        !file.startsWith('.')
      );

      console.log(`[TemplateScanService] Found ${templateFiles.length} template files:`, templateFiles);

      return templateFiles;
    } catch (error) {
      console.error('[TemplateScanService] Error scanning template files:', error);
      return [];
    }
  }

  /**
   * 保存模板元数据到数据库
   */
  async saveTemplateMetadata(metadata: any): Promise<boolean> {
    try {
      // 确保元数据有必要的字段
      const templateMetadata: Partial<TemplateMetadataRecord> = {
        id: metadata.id,
        name: metadata.name || `Template ${metadata.id}`,
        description: metadata.description || '',
        thumbnailUrl: metadata.thumbnailUrl || `/thumbnails/${metadata.id}.png`,
        generationMode: metadata.generationMode || 'browser',
        category: metadata.category || 'other',
        tags: metadata.tags || [],
        version: metadata.version || '1.0.0',
        defaultParameters: metadata.defaultParameters || {},
        parameterSchema: metadata.parameterSchema || {}
      };

      console.log(`[TemplateScanService] Saving template metadata: ${templateMetadata.id}, generationMode: ${templateMetadata.generationMode}`);

      // 保存到数据库
      const saved = await dbSaveTemplateMetadata(templateMetadata as any);

      if (saved) {
        console.log(`[TemplateScanService] Saved template metadata: ${templateMetadata.id}`);
      } else {
        console.error(`[TemplateScanService] Failed to save template metadata: ${templateMetadata.id}`);
      }

      return saved;
    } catch (error) {
      console.error(`[TemplateScanService] Error saving template metadata:`, error);
      return false;
    }
  }

  /**
   * 加载模板并保存元数据到数据库
   */
  async loadTemplatesAndSaveMetadata(): Promise<string[]> {
    try {
      // 扫描模板文件
      const templateFiles = await this.scanTemplateFiles();

      // 加载模板并保存元数据
      const savedIds: string[] = [];

      for (const file of templateFiles) {
        try {
          // 从文件名提取模板ID
          const match = file.match(TEMPLATE_FILE_PATTERN);
          if (!match) continue;

          // 将首字母小写
          const templateId = match[1].charAt(0).toLowerCase() + match[1].slice(1);

          console.log(`[TemplateScanService] Processing template file: ${file}, ID: ${templateId}`);

          // 构建模板文件的完整路径
          const templatePath = path.join(this.templatesDir, file);

          try {
            // 动态导入模板模块
            // const templateModule = await import(templatePath); // Original problematic dynamic import
            const templateModule = await import(`@/lib/templates/definitions/${file}`); // Use alias and template literal for better bundler analysis

            // 检查模块是否导出了模板类
            if (!templateModule.default) {
              console.warn(`[TemplateScanService] Template file ${file} does not export a default class`);
              continue;
            }

            // 创建模板实例
            const TemplateClass = templateModule.default;
            const template = new TemplateClass();

            console.log(`[TemplateScanService] Created template instance: ${template.id}, name: ${template.name}`);

            // 获取模板参数架构
            let parameterSchema = {};
            try {
              parameterSchema = template.getParameterSchema ? template.getParameterSchema() : template.parameterSchema;
            } catch (error) {
              console.warn(`[TemplateScanService] Error getting parameter schema for ${templateId}:`, error);
              parameterSchema = template.parameterSchema || {};
            }

            // 获取默认参数
            let defaultParameters = {};
            try {
              defaultParameters = template.getDefaultParameters ? template.getDefaultParameters() : template.defaultParameters;
            } catch (error) {
              console.warn(`[TemplateScanService] Error getting default parameters for ${templateId}:`, error);
              defaultParameters = template.defaultParameters || {};
            }

            // 确保模板有正确的生成模式
            const generationMode = template.generationMode || 'browser';

            // 保存模板元数据到数据库
            const metadata = {
              id: template.id,
              name: template.name || `Template ${templateId}`,
              description: template.description || '',
              thumbnailUrl: template.thumbnailUrl || `/thumbnails/${template.id}.png`,
              generationMode: generationMode,
              category: template.category || 'other',
              tags: template.tags || [],
              version: template.version || '1.0.0',
              defaultParameters: defaultParameters,
              parameterSchema: parameterSchema
            };

            console.log(`[TemplateScanService] Saving metadata for template: ${template.id}, generationMode: ${generationMode}`);

            // const saved = await saveTemplateMetadata(metadata); // Incorrect function call
            const saved = await dbSaveTemplateMetadata(metadata as any); // Corrected function call using alias

            if (saved) {
              savedIds.push(template.id);
              console.log(`[TemplateScanService] Saved metadata for template: ${template.id}`);
            } else {
              console.error(`[TemplateScanService] Failed to save metadata for template: ${template.id}`);
            }
          } catch (importError) {
            console.error(`[TemplateScanService] Error importing template module ${file}:`, importError);

            // 尝试直接读取文件内容
            try {
              const fileContent = await fs.readFile(templatePath, 'utf-8');

              // 提取模板 ID
              const idMatch = fileContent.match(/readonly\s+id\s*=\s*['"]([^'"]+)['"]/);
              const id = idMatch ? idMatch[1] : templateId;

              // 提取模板名称
              const nameMatch = fileContent.match(/readonly\s+name\s*=\s*['"]([^'"]+)['"]/);
              const name = nameMatch ? nameMatch[1] : `Template ${id}`;

              // 提取模板描述
              const descMatch = fileContent.match(/readonly\s+description\s*=\s*['"]([^'"]+)['"]/);
              const description = descMatch ? descMatch[1] : '';

              // 提取生成模式
              const modeMatch = fileContent.match(/readonly\s+generationMode\s*=\s*ModelGenerationMode\.([A-Z]+)/);
              const generationMode = modeMatch ? modeMatch[1].toLowerCase() : 'browser';

              console.log(`[TemplateScanService] Extracted from file: id=${id}, name=${name}, generationMode=${generationMode}`);

              // 保存基本元数据
              const metadata = {
                id,
                name,
                description,
                thumbnailUrl: `/thumbnails/${id}.png`,
                generationMode,
                category: 'other',
                tags: [],
                version: '1.0.0',
                defaultParameters: {},
                parameterSchema: {}
              };

              const saved = await saveTemplateMetadata(metadata);

              if (saved) {
                savedIds.push(id);
                console.log(`[TemplateScanService] Saved basic metadata for template: ${id}`);
              } else {
                console.error(`[TemplateScanService] Failed to save basic metadata for template: ${id}`);
              }
            } catch (readError) {
              console.error(`[TemplateScanService] Error reading template file ${file}:`, readError);
            }
          }
        } catch (error) {
          console.error(`[TemplateScanService] Error processing template file ${file}:`, error);
        }
      }

      console.log(`[TemplateScanService] Saved metadata for ${savedIds.length} templates:`, savedIds);

      return savedIds;
    } catch (error) {
      console.error('[TemplateScanService] Error loading templates and saving metadata:', error);
      return [];
    }
  }
}

// 创建单例实例
export const templateScanService = new TemplateScanService();
