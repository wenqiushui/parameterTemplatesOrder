'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface ParametricWindowProps {
  parameters: {
    width: number;
    height: number;
    thickness: number;
    color: string;
  };
}

export default function ParametricWindow({ parameters }: ParametricWindowProps) {
  // 默认参数
  const {
    width = 0.6,
    height = 0.6,
    thickness = 0.02,
    color = '#87CEFA'
  } = parameters;

  // 引用组
  const groupRef = useRef<THREE.Group>(null);

  // 创建窗户
  const createWindow = () => {
    if (!groupRef.current) return;

    // 清除现有的部件
    while (groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0]);
    }

    // 窗框宽度
    const frameWidth = 0.05;

    // 创建窗户框架
    const outerFrameGeometry = new THREE.BoxGeometry(width, height, thickness);
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      side: THREE.DoubleSide
    });
    const outerFrame = new THREE.Mesh(outerFrameGeometry, frameMaterial);
    outerFrame.name = 'window_outer_frame';

    // 窗户玻璃
    const glassGeometry = new THREE.BoxGeometry(width - frameWidth*2, height - frameWidth*2, thickness/2);
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: color || '#87CEFA',
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    glass.name = 'window_glass';
    glass.position.z = thickness/4; // 稍微突出一点

    // 创建窗户组
    const windowGroup = new THREE.Group();
    windowGroup.name = 'window';
    windowGroup.add(outerFrame);
    windowGroup.add(glass);

    // 将窗户的原点设置在左下角
    windowGroup.position.set(width/2, height/2, 0);

    // 添加到组
    groupRef.current.add(windowGroup);
  };

  // 当参数变化时重新创建窗户
  useEffect(() => {
    console.log('Window parameters changed:', { width, height, thickness, color });
    createWindow();
  }, [width, height, thickness, color]);

  // 强制重新创建窗户，确保参数生效
  useEffect(() => {
    createWindow();
  }, []);

  // 添加轻微的旋转动画
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  // 添加调试日志
  useEffect(() => {
    console.log('ParametricWindow rendered with parameters:', parameters);
  }, []);

  return (
    <group ref={groupRef} position={[0, 0, 0]} />
  );
}
