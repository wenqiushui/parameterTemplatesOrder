'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface ParametricDoorProps {
  parameters: {
    width: number;
    height: number;
    thickness: number;
    color: string;
  };
}

export default function ParametricDoor({ parameters }: ParametricDoorProps) {
  // 默认参数
  const {
    width = 0.8,
    height = 2.0,
    thickness = 0.04,
    color = '#8B4513'
  } = parameters;

  // 引用组
  const groupRef = useRef<THREE.Group>(null);

  // 创建门
  const createDoor = () => {
    if (!groupRef.current) return;

    // 清除现有的部件
    while (groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0]);
    }

    // 创建门框架
    const doorGeometry = new THREE.BoxGeometry(width, height, thickness);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: color || '#8B4513',
      side: THREE.DoubleSide
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.name = 'door';

    // 将门的原点设置在左下角
    door.position.set(width/2, height/2, 0);

    // 添加门把手
    const handleRadius = 0.02;
    const handleGeometry = new THREE.SphereGeometry(handleRadius, 16, 16);
    const handleMaterial = new THREE.MeshStandardMaterial({ color: '#C0C0C0' });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(width * 0.8, height * 0.5, thickness/2 + handleRadius);

    // 添加到组
    groupRef.current.add(door);
    groupRef.current.add(handle);
  };

  // 当参数变化时重新创建门
  useEffect(() => {
    console.log('Door parameters changed:', { width, height, thickness, color });
    createDoor();
  }, [width, height, thickness, color]);

  // 强制重新创建门，确保参数生效
  useEffect(() => {
    createDoor();
  }, []);

  // 添加轻微的旋转动画
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  // 添加调试日志
  useEffect(() => {
    console.log('ParametricDoor rendered with parameters:', parameters);
  }, []);

  return (
    <group ref={groupRef} position={[0, 0, 0]} />
  );
}
