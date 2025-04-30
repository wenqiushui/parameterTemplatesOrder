import { NextRequest, NextResponse } from 'next/server';
import { templateService } from '@/lib/services/templateService';
import * as THREE from 'three';
import fs from 'fs';
import path from 'path';

// 处理生成请求
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;

    // 获取模板元数据
    const metadata = await templateService.getTemplateMetadata(templateId);

    if (!metadata) {
      return new NextResponse(JSON.stringify({ error: 'Template not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    let parameters: Record<string, any> = {};

    // 解析参数
    for (const [key, value] of searchParams.entries()) {
      try {
        // 尝试解析为 JSON
        parameters[key] = JSON.parse(value);
      } catch (e) {
        // 如果不是有效的 JSON，则直接使用字符串值
        // 对于数字类型的参数，尝试转换为数字
        if (!isNaN(Number(value))) {
          parameters[key] = Number(value);
        } else {
          parameters[key] = value;
        }
      }
    }

    // 验证参数
    try {
      // 使用默认参数作为基础
      const defaultParams = { ...metadata.defaultParameters };
      const schema = metadata.parameterSchema;

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

      // 使用调整后的参数
      console.log(`Using adjusted parameters:`, defaultParams);
      parameters = defaultParams;
    } catch (error) {
      console.warn('Parameter validation warning:', error.message);
    }

    // 根据模板类型返回不同的示例 GLB 文件
    let modelBuffer: Buffer;

    // 检查示例模型目录是否存在
    const sampleDir = path.join(process.cwd(), 'public', 'samples');
    if (!fs.existsSync(sampleDir)) {
      fs.mkdirSync(sampleDir, { recursive: true });
    }

    if (templateId === 'boxes') {
      // 盒子模型 - 返回一个简单的盒子 GLB 文件
      const boxPath = path.join(sampleDir, 'box.glb');

      // 如果示例文件不存在，创建一个 JSON 响应
      if (!fs.existsSync(boxPath)) {
        // 返回一个 JSON 响应，告诉客户端使用内置的盒子几何体
        return NextResponse.json({
          type: 'primitive',
          geometry: 'box',
          parameters: {
            width: parameters.width || 1,
            height: parameters.height || 1,
            depth: parameters.depth || 1
          },
          material: {
            color: '#3080e8'
          }
        });
      }

      modelBuffer = fs.readFileSync(boxPath);
    } else if (templateId === 'chair') {
      // 椅子模型 - 返回一个简单的椅子 GLB 文件
      const chairPath = path.join(sampleDir, 'chair.glb');

      // 如果示例文件不存在，创建一个 JSON 响应
      if (!fs.existsSync(chairPath)) {
        // 返回一个 JSON 响应，告诉客户端使用内置的椅子组件
        return NextResponse.json({
          type: 'primitive',
          geometry: 'chair',
          parameters: {
            seatWidth: parameters.seatWidth || 0.5,
            seatDepth: parameters.seatDepth || 0.5,
            seatHeight: parameters.seatHeight || 0.45,
            backHeight: parameters.backHeight || 0.8,
            legThickness: parameters.legThickness || 0.04
          },
          material: {
            color: '#8B4513'
          }
        });
      }

      modelBuffer = fs.readFileSync(chairPath);
    } else {
      // 未知模板 - 返回一个错误响应
      return NextResponse.json({ error: 'Unknown template type' }, { status: 400 });
    }

    // 返回 GLB 文件
    return new NextResponse(modelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Content-Disposition': `attachment; filename="${templateId}_model.glb"`,
        // 添加缓存控制头，避免浏览器缓存
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });
  } catch (error) {
    console.error('Error generating model:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to generate model' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
