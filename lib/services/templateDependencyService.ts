/**
 * 模板依赖分析服务
 *
 * 该服务负责分析模板依赖关系，并确定模板的生成模式
 */

import { BaseTemplate, ModelGenerationMode, TemplateDependency } from '@/lib/templates/baseTemplate';
import { templateRegistry } from '@/lib/templates/templateRegistry';

// 依赖分析结果
export interface DependencyAnalysisResult {
  templateId: string;
  dependencies: string[];
  generationMode: ModelGenerationMode;
  hasExternalDependencies: boolean;
}

// 模板依赖分析服务
class TemplateDependencyService {
  // 分析模板依赖
  analyzeTemplateDependencies(templateId: string): DependencyAnalysisResult | null {
    // 获取模板
    const template = templateRegistry.get(templateId);
    if (!template) {
      console.error(`Template not found: ${templateId}`);
      return null;
    }

    // 获取模板依赖项
    const templateDependencies = template.getDependencies();
    console.log(`Template ${templateId} has ${templateDependencies.length} dependencies from getDependencies()`);

    // 提取依赖ID
    const dependencies = templateDependencies.map(dep => dep.templateId);

    // 如果没有依赖，尝试从代码中查找
    if (dependencies.length === 0) {
      console.log(`No dependencies found from getDependencies(), trying to find in code`);

      // 获取模板代码
      const templateCode = template.generate.toString();

      // 查找依赖
      const codeDepedencies = this.findDependenciesInCode(templateCode);
      dependencies.push(...codeDepedencies);
    }

    // 检查是否有外部依赖
    const hasExternalDependencies = this.checkForExternalDependencies(dependencies);

    // 确定生成模式
    const generationMode = this.determineGenerationMode(template, dependencies, hasExternalDependencies);

    return {
      templateId,
      dependencies,
      generationMode,
      hasExternalDependencies
    };
  }

  // 在代码中查找依赖
  private findDependenciesInCode(code: string): string[] {
    const dependencies: string[] = [];

    // 查找模板ID
    const templateIdRegex = /templateId:\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = templateIdRegex.exec(code)) !== null) {
      dependencies.push(match[1]);
    }

    // 查找实例化
    const instantiationRegex = /new\s+([A-Za-z0-9_]+Template)\s*\(/g;
    while ((match = instantiationRegex.exec(code)) !== null) {
      // 将类名转换为模板ID
      const className = match[1];
      const templateId = className.replace(/Template$/, '').toLowerCase();
      if (!dependencies.includes(templateId)) {
        dependencies.push(templateId);
      }
    }

    return dependencies;
  }

  // 检查是否有外部依赖
  private checkForExternalDependencies(dependencies: string[]): boolean {
    for (const dependencyId of dependencies) {
      const dependency = templateRegistry.get(dependencyId);
      if (!dependency) {
        console.warn(`Dependency not found: ${dependencyId}`);
        continue;
      }

      if (dependency.generationMode === ModelGenerationMode.EXTERNAL) {
        return true;
      }
    }

    return false;
  }

  // 确定生成模式
  private determineGenerationMode(
    template: BaseTemplate,
    dependencies: string[],
    hasExternalDependencies: boolean
  ): ModelGenerationMode {
    // 首先检查模板是否是本地模板
    if (template.isLocalTemplate && typeof template.isLocalTemplate === 'function') {
      const isLocal = template.isLocalTemplate();
      console.log(`Template ${template.id} isLocalTemplate(): ${isLocal}`);

      if (isLocal) {
        return ModelGenerationMode.BROWSER;
      }
    }

    // 如果有外部依赖，则使用外部生成模式
    if (hasExternalDependencies) {
      return ModelGenerationMode.EXTERNAL;
    }

    // 如果没有依赖，则使用模板自己的生成模式
    if (dependencies.length === 0) {
      return template.generationMode;
    }

    // 如果所有依赖都是浏览器端生成的，则使用浏览器端生成模式
    let allBrowserDependencies = true;
    for (const dependencyId of dependencies) {
      const dependency = templateRegistry.get(dependencyId);
      if (!dependency) {
        console.warn(`Dependency not found: ${dependencyId}`);
        continue;
      }

      if (dependency.generationMode !== ModelGenerationMode.BROWSER) {
        allBrowserDependencies = false;
        break;
      }
    }

    if (allBrowserDependencies) {
      return ModelGenerationMode.BROWSER;
    }

    // 否则使用服务器端生成模式
    return ModelGenerationMode.SERVER;
  }

  // 分析所有模板依赖
  analyzeAllTemplateDependencies(): Record<string, DependencyAnalysisResult> {
    const results: Record<string, DependencyAnalysisResult> = {};

    // 获取所有模板ID
    const templateIds = templateRegistry.getAllTemplateIds();

    // 分析每个模板
    for (const templateId of templateIds) {
      const result = this.analyzeTemplateDependencies(templateId);
      if (result) {
        results[templateId] = result;
      }
    }

    return results;
  }

  // 更新模板生成模式
  updateTemplateGenerationModes(): void {
    // 分析所有模板依赖
    const analysisResults = this.analyzeAllTemplateDependencies();

    // 更新每个模板的生成模式
    for (const [templateId, result] of Object.entries(analysisResults)) {
      const template = templateRegistry.get(templateId);
      if (!template) {
        console.warn(`Template not found: ${templateId}`);
        continue;
      }

      // 更新生成模式
      // 注意：这里我们不能直接修改 template.generationMode，因为它是只读的
      // 但在实际应用中，我们可以通过其他方式更新生成模式
      console.log(`Template ${templateId} generation mode: ${template.generationMode} -> ${result.generationMode}`);
    }
  }
}

// 导出单例实例
export const templateDependencyService = new TemplateDependencyService();
