'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface BoxConfig {
  width: number;
  height: number;
  depth: number;
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
}

interface ParametricBoxesProps {
  parameters: {
    spacing: number;
    boxes: BoxConfig[];
  };
}

export default function ParametricBoxes({ parameters }: ParametricBoxesProps) {
  // 默认参数
  const {
    spacing = 2,
    boxes = [
      {
        width: 1,
        height: 1,
        depth: 1,
        position: [-2, 0, 0],
        rotation: [0, 0, 0],
        color: '#ff0000'
      },
      {
        width: 1,
        height: 1,
        depth: 1,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        color: '#00ff00'
      },
      {
        width: 1,
        height: 1,
        depth: 1,
        position: [2, 0, 0],
        rotation: [0, 0, 0],
        color: '#0000ff'
      }
    ]
  } = parameters;

  // 引用组
  const groupRef = useRef<THREE.Group>(null);

  // 创建盒子
  const createBoxes = () => {
    if (!groupRef.current) return;

    // 清除现有的部件
    while (groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0]);
    }

    // 创建几何体缓存（避免重复创建相同几何体）
    const geometryCache = new Map();

    // 处理每个盒子
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];

      // 获取或创建几何体
      const geometryKey = `${box.width}_${box.height}_${box.depth}`;
      let geometry;

      if (geometryCache.has(geometryKey)) {
        geometry = geometryCache.get(geometryKey);
      } else {
        geometry = new THREE.BoxGeometry(box.width, box.height, box.depth);
        geometryCache.set(geometryKey, geometry);
      }

      // 创建材质
      const material = new THREE.MeshStandardMaterial({
        color: box.color || '#cccccc'
      });

      // 创建网格
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // 设置位置
      if (box.position) {
        mesh.position.set(
          box.position[0] * spacing,
          box.position[1],
          box.position[2]
        );
      }

      // 设置旋转
      if (box.rotation) {
        mesh.rotation.set(
          THREE.MathUtils.degToRad(box.rotation[0]),
          THREE.MathUtils.degToRad(box.rotation[1]),
          THREE.MathUtils.degToRad(box.rotation[2])
        );
      }

      // 设置名称
      mesh.name = `Box_${i}`;

      // 添加到组
      groupRef.current.add(mesh);
    }
  };

  // 当参数变化时重新创建盒子
  useEffect(() => {
    console.log('Boxes parameters changed:', { spacing, boxes });
    createBoxes();
  }, [spacing, JSON.stringify(boxes)]);

  // 强制重新创建盒子，确保参数生效
  useEffect(() => {
    createBoxes();
  }, []);

  // 添加轻微的旋转动画
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} />
  );
}
