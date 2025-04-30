'use client';

/**
 * 参数化组件注册表
 *
 * 这个文件负责自动注册和管理所有参数化组件
 * 当添加新的参数化组件时，只需要在这里导入并注册即可
 */

import { lazy } from 'react';

// 导入参数化组件
import ParametricBoxes from '../ParametricBoxes';
import ParametricDoor from '../ParametricDoor';
import ParametricWindow from '../ParametricWindow';
import ParametricWall from '../ParametricWall';
import ParametricChair from '../ParametricChair';

// 参数化组件注册表
const parametricComponents: Record<string, React.ComponentType<any>> = {
  'boxes': ParametricBoxes,
  'door': ParametricDoor,
  'window': ParametricWindow,
  'wall': ParametricWall,
  'chair': ParametricChair,
  // 在这里添加新的参数化组件
};

/**
 * 获取参数化组件
 * @param templateId 模板ID
 * @returns 参数化组件或默认组件
 */
export function getParametricComponent(templateId: string): React.ComponentType<any> {
  console.log(`Getting parametric component for template: ${templateId}`);

  // 检查是否有对应的参数化组件
  if (parametricComponents[templateId]) {
    console.log(`Found parametric component for template: ${templateId}`);
    return parametricComponents[templateId];
  }

  // 返回默认组件
  console.log(`No parametric component found for template: ${templateId}, using default`);
  return DefaultParametricComponent;
}

/**
 * 默认参数化组件
 * 当没有找到对应的参数化组件时使用
 */
function DefaultParametricComponent({ parameters }: { parameters: Record<string, any> }) {
  console.log('Rendering default parametric component with parameters:', parameters);

  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
}

/**
 * 注册参数化组件
 * @param templateId 模板ID
 * @param component 参数化组件
 */
export function registerParametricComponent(templateId: string, component: React.ComponentType<any>): void {
  console.log(`Registering parametric component for template: ${templateId}`);
  parametricComponents[templateId] = component;
}

/**
 * 动态参数化组件
 * 根据模板ID动态加载对应的参数化组件
 */
export function DynamicParametricComponent({
  templateId,
  parameters
}: {
  templateId: string;
  parameters: Record<string, any>
}) {
  console.log(`Rendering dynamic parametric component for template: ${templateId}`);
  console.log(`Parameters:`, parameters);

  try {
    // 获取参数化组件
    const Component = getParametricComponent(templateId);

    // 渲染组件
    return (
      <>
        {/* 添加调试信息 */}
        <group position={[0, -1, 0]} visible={false}>
          <mesh>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshBasicMaterial color="blue" />
          </mesh>
        </group>

        {/* 渲染组件 */}
        <Component parameters={parameters} />
      </>
    );
  } catch (error) {
    console.error(`Error rendering parametric component for template ${templateId}:`, error);

    // 返回一个错误指示器
    return (
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }
}
