import { NextRequest, NextResponse } from 'next/server';
import { templateRegistry } from '@/lib/templates';
import { registerTemplate } from '@/lib/templates/discovery';
import fs from 'fs';
import path from 'path';

// 处理预览请求
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;
    console.log(`GET /api/templates/${templateId}/preview - Generating preview`);

    // 检查模板是否存在，如果不存在则尝试注册
    if (!templateRegistry.has(templateId)) {
      console.log(`Template ${templateId} not found in registry, trying to register it`);
      const registered = await registerTemplate(templateId);

      if (!registered || !templateRegistry.has(templateId)) {
        console.error(`Failed to register template ${templateId}`);
        return new NextResponse(JSON.stringify({ error: 'Template not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      console.log(`Successfully registered template ${templateId}`);
    }

    // 获取模板
    const template = templateRegistry.get(templateId);
    console.log(`Retrieved template: ${template.id} (${template.name})`);

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const parameters: Record<string, any> = {};

    // 解析参数
    for (const [key, value] of searchParams.entries()) {
      try {
        // 尝试解析为 JSON
        parameters[key] = JSON.parse(value);
      } catch (e) {
        // 如果不是有效的 JSON，则直接使用字符串值
        parameters[key] = value;
      }
    }

    // 将字符串参数转换为数字
    Object.entries(parameters).forEach(([key, value]) => {
      if (typeof value === 'string' && !isNaN(Number(value))) {
        parameters[key] = Number(value);
      }
    });

    // 检查是否有特殊参数，如时间戳，如果有则忽略
    if (parameters._t) {
      delete parameters._t;
    }

    console.log(`Generating preview for template ${templateId} with parameters:`, parameters);

    try {
      // 设置参数
      template.setParameters(parameters);
    } catch (error) {
      console.warn('Parameter validation warning:', error.message);

      // 使用默认参数替换所有参数，确保模型能够生成
      const defaultParams = {};
      const schema = template.getParameterSchema();

      // 先使用默认值填充所有参数
      Object.entries(schema).forEach(([key, config]) => {
        if (config.default !== undefined) {
          defaultParams[key] = config.default;
        }
      });

      // 然后使用用户提供的有效参数覆盖默认值
      Object.entries(parameters).forEach(([key, value]) => {
        const config = schema[key];
        if (config) {
          // 检查数字参数是否在范围内
          if (typeof value === 'number' && config.min !== undefined && value < config.min) {
            defaultParams[key] = config.min;
          } else if (typeof value === 'number' && config.max !== undefined && value > config.max) {
            defaultParams[key] = config.max;
          } else {
            defaultParams[key] = value;
          }
        }
      });

      // 重新设置参数
      console.log(`Using adjusted parameters:`, defaultParams);
      template.setParameters(defaultParams);
    }

    // 定义简单模板和复杂模板
    const simpleTemplates = ['boxes', 'door', 'window', 'wall']; // 在浏览器端生成的简单模板
    const complexTemplates = ['chair']; // 需要服务器端生成的复杂模板

    let fileBuffer;

    // 根据模板类型选择不同的处理方式
    if (complexTemplates.includes(templateId)) {
      // 复杂模板：使用模板的 generate 方法生成模型
      console.log(`Generating complex model for template ${templateId}`);
      fileBuffer = await template.generate();
    } else {
      // 简单模板或未知模板：返回默认模型
      console.log(`Returning default model for template ${templateId} (client-side rendering)`);
      const defaultGlbPath = path.join(process.cwd(), 'public', 'models', 'cube.glb');

      // 检查文件是否存在
      if (!fs.existsSync(defaultGlbPath)) {
        return new NextResponse(JSON.stringify({ error: 'Default model not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      // 读取文件
      fileBuffer = fs.readFileSync(defaultGlbPath);
    }

    // 返回 GLB 文件
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Content-Disposition': `inline; filename="${templateId}_preview.glb"`,
        // 添加缓存控制头，避免浏览器缓存
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });
  } catch (error) {
    console.error('Error generating preview:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to generate preview' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
