import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

interface EnvironmentPreviewProps {
  environmentId?: string | null;
  scene?: {
    backgroundType?: string;
    backgroundColor?: string;
    exposure?: number;
    toneMapping?: string;
  };
}

export default function EnvironmentPreview({ environmentId, scene }: EnvironmentPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  
  // 初始化场景
  useEffect(() => {
    if (!containerRef.current) return;
    
    // 创建场景
    const threeScene = new THREE.Scene();
    sceneRef.current = threeScene;
    
    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      50, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.z = 3;
    cameraRef.current = camera;
    
    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // 创建控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;
    
    // 创建预览球体
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      metalness: 1.0,
      roughness: 0.0
    });
    const sphere = new THREE.Mesh(geometry, material);
    threeScene.add(sphere);
    sphereRef.current = sphere;
    
    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();
    
    // 处理窗口大小变化
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);
  
  // 加载环境贴图
  useEffect(() => {
    // 默认不加载环境贴图，只有在外部触发时才加载
    // 此处逻辑移除，等待外部通过props或方法调用加载环境贴图
  }, [environmentId, scene?.backgroundType]);
  
  // 更新场景设置
  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current) return;
    
    // 更新背景
    if (scene?.backgroundType === 'color') {
      sceneRef.current.background = new THREE.Color(scene.backgroundColor);
    } else if (scene?.backgroundType === 'none') {
      sceneRef.current.background = null;
    }
    
    // 更新曝光度
    if (rendererRef.current && scene?.exposure) {
      rendererRef.current.toneMappingExposure = scene.exposure;
    }
    
    // 更新色调映射
    if (rendererRef.current && scene?.toneMapping) {
      switch (scene.toneMapping) {
        case 'ACESFilmic':
          rendererRef.current.toneMapping = THREE.ACESFilmicToneMapping;
          break;
        case 'Linear':
          rendererRef.current.toneMapping = THREE.LinearToneMapping;
          break;
        case 'Reinhard':
          rendererRef.current.toneMapping = THREE.ReinhardToneMapping;
          break;
        case 'Cineon':
          rendererRef.current.toneMapping = THREE.CineonToneMapping;
          break;
      }
    }
  }, [scene]);
  
  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: 300, 
        borderRadius: 4,
        overflow: 'hidden'
      }} 
    />
  );
}
