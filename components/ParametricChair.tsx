'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface ParametricChairProps {
  parameters: {
    seatWidth: number;
    seatDepth: number;
    seatHeight: number;
    backHeight: number;
    legThickness: number;
  };
}

export default function ParametricChair({ parameters }: ParametricChairProps) {
  // 默认参数
  const {
    seatWidth = 0.5,
    seatDepth = 0.5,
    seatHeight = 0.45,
    backHeight = 0.8,
    legThickness = 0.04
  } = parameters;

  // 引用组
  const groupRef = useRef<THREE.Group>(null);

  // 创建椅子部件
  const createChairParts = () => {
    if (!groupRef.current) return;

    // 清除现有的部件
    while (groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0]);
    }

    // 创建座位
    const seatGeometry = new THREE.BoxGeometry(seatWidth, 0.05, seatDepth);
    const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.y = seatHeight;
    seat.castShadow = true;
    seat.receiveShadow = true;
    seat.name = 'seat';
    groupRef.current.add(seat);

    // 创建靠背
    const backGeometry = new THREE.BoxGeometry(seatWidth, backHeight, 0.05);
    const backMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const back = new THREE.Mesh(backGeometry, backMaterial);
    back.position.y = seatHeight + backHeight / 2;
    back.position.z = -seatDepth / 2 + 0.025;
    back.castShadow = true;
    back.receiveShadow = true;
    back.name = 'back';
    groupRef.current.add(back);

    // 创建腿
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x5C4033 });

    // 前左腿
    const legFrontLeft = createLeg(legThickness, seatHeight, legMaterial);
    legFrontLeft.position.set(-seatWidth / 2 + legThickness / 2, seatHeight / 2, seatDepth / 2 - legThickness / 2);
    legFrontLeft.name = 'legFrontLeft';
    groupRef.current.add(legFrontLeft);

    // 前右腿
    const legFrontRight = createLeg(legThickness, seatHeight, legMaterial);
    legFrontRight.position.set(seatWidth / 2 - legThickness / 2, seatHeight / 2, seatDepth / 2 - legThickness / 2);
    legFrontRight.name = 'legFrontRight';
    groupRef.current.add(legFrontRight);

    // 后左腿
    const legBackLeft = createLeg(legThickness, seatHeight, legMaterial);
    legBackLeft.position.set(-seatWidth / 2 + legThickness / 2, seatHeight / 2, -seatDepth / 2 + legThickness / 2);
    legBackLeft.name = 'legBackLeft';
    groupRef.current.add(legBackLeft);

    // 后右腿
    const legBackRight = createLeg(legThickness, seatHeight, legMaterial);
    legBackRight.position.set(seatWidth / 2 - legThickness / 2, seatHeight / 2, -seatDepth / 2 + legThickness / 2);
    legBackRight.name = 'legBackRight';
    groupRef.current.add(legBackRight);
  };

  // 创建椅子腿
  const createLeg = (thickness: number, height: number, material: THREE.Material): THREE.Mesh => {
    const legGeometry = new THREE.BoxGeometry(thickness, height, thickness);
    const leg = new THREE.Mesh(legGeometry, material);
    leg.castShadow = true;
    leg.receiveShadow = true;
    return leg;
  };

  // 当参数变化时重新创建椅子
  useEffect(() => {
    console.log('Chair parameters changed:', { seatWidth, seatDepth, seatHeight, backHeight, legThickness });
    createChairParts();
  }, [seatWidth, seatDepth, seatHeight, backHeight, legThickness]);

  // 强制重新创建椅子，确保参数生效
  useEffect(() => {
    createChairParts();
  }, []);

  // 添加轻微的旋转动画
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.5, 0]} />
  );
}
