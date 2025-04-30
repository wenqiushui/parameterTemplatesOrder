'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import ParametricDoor from './ParametricDoor';
import ParametricWindow from './ParametricWindow';

interface ParametricWallProps {
  parameters: {
    width: number;
    height: number;
    thickness: number;
    color: string;
    hasDoor: boolean;
    hasWindow: boolean;
  };
}

export default function ParametricWall({ parameters }: ParametricWallProps) {
  // 默认参数
  const {
    width = 4.0,
    height = 3.0,
    thickness = 0.2,
    color = '#E8E8E8',
    hasDoor = true,
    hasWindow = true
  } = parameters;

  // 引用组
  const groupRef = useRef<THREE.Group>(null);
  const wallRef = useRef<THREE.Mesh>(null);

  // 创建墙
  const createWall = () => {
    if (!groupRef.current) return;

    // 清除现有的部件
    while (groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0]);
    }

    // 创建墙体
    const wallGeometry = new THREE.BoxGeometry(width, height, thickness);
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: color || '#E8E8E8',
      side: THREE.DoubleSide
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.name = 'wall';
    wallRef.current = wall;

    // 将墙的原点设置在左下角
    wall.position.set(width/2, height/2, 0);

    // 添加到组
    groupRef.current.add(wall);

    // 计算窗户参数
    const windowWidth = width / 4;  // ww = w/4
    const windowHeight = height / 4; // wh = h/4
    const windowX = width / 3;      // 窗户左侧距离墙左侧为墙宽的三分之一
    const windowY = height / 3;     // 窗户底部距离墙底部为墙高的三分之一

    // 计算门参数
    const doorHeight = 0.8 * height; // dh = 0.8*h
    const doorWidth = 0.5 + width * 0.1; // dw = 500+w*0.1 (假设单位是米，500mm = 0.5m)
    const doorX = windowX;          // 门的左下角与窗户的左下角重合

    // 添加窗户
    if (hasWindow) {
      // 在墙上挖窗户洞
      cutHoleInWall(wall, windowX, windowY, windowWidth, windowHeight, thickness);

      // 创建窗户组
      const windowGroup = new THREE.Group();
      windowGroup.name = 'window_group';
      windowGroup.position.set(windowX, windowY, 0);

      // 添加到组
      groupRef.current.add(windowGroup);
    }

    // 添加门
    if (hasDoor) {
      // 在墙上挖门洞
      cutHoleInWall(wall, doorX, 0, doorWidth, doorHeight, thickness);

      // 创建门组
      const doorGroup = new THREE.Group();
      doorGroup.name = 'door_group';
      doorGroup.position.set(doorX, 0, 0);

      // 添加到组
      groupRef.current.add(doorGroup);
    }
  };

  // 在墙上挖洞
  const cutHoleInWall = (wall: THREE.Mesh, x: number, y: number, width: number, height: number, thickness: number) => {
    // 创建一个与洞口相同大小的盒子，并将其材质设置为透明
    const holeGeometry = new THREE.BoxGeometry(width, height, thickness * 1.2);
    const holeMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });

    const hole = new THREE.Mesh(holeGeometry, holeMaterial);
    hole.position.set(x + width/2, y + height/2, 0);
    wall.add(hole);
  };

  // 当参数变化时重新创建墙
  useEffect(() => {
    console.log('Wall parameters changed:', { width, height, thickness, color, hasDoor, hasWindow });
    createWall();
  }, [width, height, thickness, color, hasDoor, hasWindow]);

  // 强制重新创建墙，确保参数生效
  useEffect(() => {
    createWall();
  }, []);

  // 添加轻微的旋转动画
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  // 添加调试日志
  useEffect(() => {
    console.log('ParametricWall rendered with parameters:', parameters);
  }, []);

  // 计算窗户参数
  const windowWidth = width / 4;
  const windowHeight = height / 4;
  const windowX = width / 3;
  const windowY = height / 3;

  // 计算门参数
  const doorHeight = 0.8 * height;
  const doorWidth = 0.5 + width * 0.1;
  const doorX = windowX;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* 墙体在createWall中创建 */}

      {/* 窗户 */}
      {hasWindow && (
        <group position={[windowX, windowY, 0]}>
          <ParametricWindow parameters={{
            width: windowWidth,
            height: windowHeight,
            thickness: thickness * 1.1,
            color: '#87CEFA'
          }} />
        </group>
      )}

      {/* 门 */}
      {hasDoor && (
        <group position={[doorX, 0, 0]}>
          <ParametricDoor parameters={{
            width: doorWidth,
            height: doorHeight,
            thickness: thickness * 1.1,
            color: '#8B4513'
          }} />
        </group>
      )}
    </group>
  );
}
