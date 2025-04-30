'use client';

import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';

interface CustomEnvironmentProps {
  preset?: string;
  background?: boolean;
  children?: React.ReactNode;
}

// 预设环境贴图映射
const PRESET_MAPS = {
  sunset: '/textures/env/sunset.jpg',
  dawn: '/textures/env/dawn.jpg',
  night: '/textures/env/night.jpg',
  warehouse: '/textures/env/warehouse.jpg',
  forest: '/textures/env/forest.jpg',
  apartment: '/textures/env/apartment.jpg',
  studio: '/textures/env/studio.jpg',
  city: '/textures/env/city.jpg',
  park: '/textures/env/park.jpg',
  lobby: '/textures/env/lobby.jpg',
  // 添加更多预设
};

// 默认环境贴图
const DEFAULT_MAP = '/textures/env/studio.jpg';

export default function CustomEnvironment({ 
  preset = 'sunset', 
  background = false,
  children
}: CustomEnvironmentProps) {
  const { scene } = useThree();
  const [error, setError] = useState<string | null>(null);
  
  // 获取预设贴图路径
  const texturePath = PRESET_MAPS[preset] || DEFAULT_MAP;
  
  useEffect(() => {
    // 创建一个简单的环境贴图
    const createDefaultEnvMap = () => {
      // 创建一个简单的立方体贴图
      const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128);
      const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
      
      // 创建一个简单的场景
      const tempScene = new THREE.Scene();
      tempScene.background = new THREE.Color(0x88ccff);
      
      // 渲染立方体贴图
      cubeCamera.update(scene.renderer, tempScene);
      
      // 设置环境贴图
      scene.environment = cubeRenderTarget.texture;
      
      if (background) {
        scene.background = cubeRenderTarget.texture;
      }
    };
    
    // 加载环境贴图
    const loadEnvironmentMap = async () => {
      try {
        // 创建纹理加载器
        const textureLoader = new THREE.TextureLoader();
        
        // 加载纹理
        const texture = await new Promise<THREE.Texture>((resolve, reject) => {
          textureLoader.load(
            texturePath,
            resolve,
            undefined,
            reject
          );
        });
        
        // 设置纹理参数
        texture.mapping = THREE.EquirectangularReflectionMapping;
        
        // 设置环境贴图
        scene.environment = texture;
        
        // 如果需要，设置背景
        if (background) {
          scene.background = texture;
        }
      } catch (err) {
        console.error('Error loading environment map:', err);
        setError(err.message || 'Failed to load environment map');
        
        // 创建默认环境贴图
        createDefaultEnvMap();
      }
    };
    
    loadEnvironmentMap();
    
    // 清理函数
    return () => {
      if (scene.environment) {
        (scene.environment as THREE.Texture).dispose();
      }
      
      if (background && scene.background && scene.background instanceof THREE.Texture) {
        scene.background.dispose();
      }
    };
  }, [scene, texturePath, background]);
  
  return <>{children}</>;
}
