'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface ModelViewerProps {
  // 基本配置
  width?: string | number;
  height?: string | number;
  backgroundColor?: string;

  // 相机设置
  cameraPosition?: [number, number, number];
  cameraFov?: number;

  // 控制选项
  enableControls?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;

  // 模型相关
  scene?: THREE.Scene;
  model?: THREE.Object3D;
  autoRotate?: boolean;

  // 事件回调
  onInitialized?: (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) => void;
  onFrame?: (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) => void;
  onClick?: (event: MouseEvent, intersection: THREE.Intersection | null) => void;
}

export default function ModelViewer({
  width = '100%',
  height = '100%',
  backgroundColor = '#f0f0f0',
  cameraPosition = [5, 5, 5],
  cameraFov = 75,
  enableControls = true,
  enableZoom = true,
  enablePan = true,
  scene: externalScene,
  model,
  autoRotate = false,
  onInitialized,
  onFrame,
  onClick,
}: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // 初始化 Three.js
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(backgroundColor);
    renderer.shadowMap.enabled = true;

    // 设置尺寸
    const setSize = () => {
      if (container && renderer) {
        const width = typeof container.clientWidth === 'number' ? container.clientWidth : 300;
        const height = typeof container.clientHeight === 'number' ? container.clientHeight : 200;
        renderer.setSize(width, height);

        if (cameraRef.current) {
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
        }
      }
    };

    setSize();
    container.appendChild(renderer.domElement);

    // 创建场景
    const scene = externalScene || new THREE.Scene();

    // 创建相机
    const camera = new THREE.PerspectiveCamera(cameraFov, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(...cameraPosition);

    // 创建控制器
    let controls: OrbitControls | null = null;
    if (enableControls) {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controls.enableZoom = enableZoom;
      controls.enablePan = enablePan;
      controls.autoRotate = autoRotate;
    }

    // 添加灯光
    if (!externalScene) {
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 5, 5);
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      // 添加环境光半球光，减少对环境贴图的依赖
      const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
      scene.add(hemisphereLight);
    }

    // 添加模型
    if (model) {
      scene.add(model);

      // 调整相机位置
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      const cameraZ = Math.abs(maxDim / Math.sin(fov / 2));

      camera.position.z = center.z + cameraZ * 1.5;

      if (controls) {
        controls.target.copy(center);
        controls.update();
      }
    }

    // 保存引用
    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    controlsRef.current = controls;

    // 调用初始化回调
    if (onInitialized) {
      onInitialized(renderer, scene, camera);
    }

    // 添加点击事件
    const handleClick = (event: MouseEvent) => {
      if (!onClick) return;

      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
      const y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera({ x, y }, camera);

      const intersects = raycaster.intersectObjects(scene.children, true);
      const intersection = intersects.length > 0 ? intersects[0] : null;

      onClick(event, intersection);
    };

    if (onClick) {
      renderer.domElement.addEventListener('click', handleClick);
    }

    // 动画循环
    const animate = () => {
      const animationId = requestAnimationFrame(animate);

      if (controls) {
        controls.update();
      }

      if (onFrame) {
        onFrame(renderer, scene, camera);
      }

      renderer.render(scene, camera);

      return animationId;
    };

    const animationId = animate();

    // 监听窗口大小变化
    window.addEventListener('resize', setSize);

    // 清理函数
    return () => {
      cancelAnimationFrame(animationId);

      if (onClick) {
        renderer.domElement.removeEventListener('click', handleClick);
      }

      window.removeEventListener('resize', setSize);

      if (controls) {
        controls.dispose();
      }

      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [
    backgroundColor,
    cameraFov,
    cameraPosition,
    enableControls,
    enablePan,
    enableZoom,
    externalScene,
    model,
    autoRotate,
    onInitialized,
    onFrame,
    onClick,
  ]);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
      }}
    />
  );
}
