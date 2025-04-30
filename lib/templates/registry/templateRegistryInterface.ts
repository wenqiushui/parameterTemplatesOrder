/**
 * 模板注册表接口
 * 
 * 定义了模板注册表的通用接口，可以在前后端共享
 */

import { BaseTemplate } from '../baseTemplate';

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  thumbnailUrl?: string;
  parameterSchema: Record<string, any>;
  generationMode: string;
  category?: string;
  tags?: string[];
  version?: string;
}

export interface ITemplateRegistry {
  /**
   * 注册模板
   * @param template 要注册的模板实例
   */
  register(template: BaseTemplate): void;
  
  /**
   * 获取模板实例
   * @param id 模板ID
   * @returns 模板实例或undefined
   */
  get(id: string): BaseTemplate | undefined;
  
  /**
   * 获取所有已注册的模板ID
   * @returns 模板ID数组
   */
  getAllTemplateIds(): string[];
  
  /**
   * 获取所有已注册的模板
   * @returns 模板实例数组
   */
  getAllTemplates(): BaseTemplate[];
  
  /**
   * 获取所有模板的元数据
   * @returns 模板元数据数组
   */
  getAllTemplateMetadata(): TemplateMetadata[];
  
  /**
   * 获取特定模板的元数据
   * @param id 模板ID
   * @returns 模板元数据或undefined
   */
  getTemplateMetadata(id: string): TemplateMetadata | undefined;
  
  /**
   * 从JSON创建模板实例
   * @param json 模板的JSON表示
   * @returns 模板实例或undefined
   */
  createFromJson(json: any): BaseTemplate | undefined;
  
  /**
   * 检查模板是否已注册
   * @param id 模板ID
   * @returns 是否已注册
   */
  has(id: string): boolean;
  
  /**
   * 取消注册模板
   * @param id 模板ID
   * @returns 是否成功取消注册
   */
  unregister(id: string): boolean;
  
  /**
   * 清除所有已注册的模板
   */
  clear(): void;
}
