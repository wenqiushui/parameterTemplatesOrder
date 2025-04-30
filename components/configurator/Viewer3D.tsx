'use client';

import { useEffect, useRef, useState } from 'react';
import { Spin } from 'antd';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { useModelStore } from '@/lib/hooks/useModelStore';
import { useNodeStore } from '@/lib/hooks/useNodeStore';
import { useMeshStore } from '@/lib/hooks/useMeshStore';
import { useMaterialStore } from '@/lib/hooks/useMaterialStore';

interface Viewer3DProps {
  highlightedNodeId?: string | null;
  onNodeSelect?: (nodeId: string) => void;
  scene?: {
    environmentMapId?: string | null;
    backgroundType?: string;
    backgroundColor?: string;
    exposure?: number;
    toneMapping?: string;
  } | null;
}

export default function Viewer3D({ highlightedNodeId, onNodeSelect, scene }: Viewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 场景对象引用
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const highlightedObjectRef = useRef<THREE.Object3D | null>(null);
  const originalMaterialsRef = useRef<Map<string, THREE.Material | THREE.Material[]>>(new Map());

  // 使用状态管理
  const { productData } = useModelStore();
  const { setCurrentNodeData } = useNodeStore();
  const { selectedMeshData } = useMeshStore();
  const { selectedMeshMaterial } = useMaterialStore();

  // 初始化 Three.js 场景
  useEffect(() => {
    if (!containerRef.current) return;

    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);
    cameraRef.current = camera;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    rendererRef.current = renderer;

    // 添加到容器
    containerRef.current.appendChild(renderer.domElement);

    // 添加控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // 添加灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 添加坐标轴辅助
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // 添加网格地面
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

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

  // 加载模型
  useEffect(() => {
    if (!productData || !sceneRef.current) return;

    setLoading(true);
    setError(null);

    // 移除之前的模型
    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current = null;
    }

    // 清除原始材质引用
    originalMaterialsRef.current.clear();

    // 加载模型
    const loader = new GLTFLoader();

    loader.load(
      `/api/models/${productData.id}/glb`,
      (gltf) => {
        if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;

        // 添加模型到场景
        const model = gltf.scene;
        sceneRef.current.add(model);
        modelRef.current = model;

        // 存储原始材质
        model.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            originalMaterialsRef.current.set(object.uuid, object.material);
          }
        });

        // 添加点击事件
        if (onNodeSelect) {
          const raycaster = new THREE.Raycaster();
          const mouse = new THREE.Vector2();

          const handleClick = (event) => {
            if (!containerRef.current || !cameraRef.current || !modelRef.current) return;

            // 计算鼠标位置
            const rect = containerRef.current.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            // 射线检测
            raycaster.setFromCamera(mouse, cameraRef.current);
            const intersects = raycaster.intersectObject(modelRef.current, true);

            if (intersects.length > 0) {
              // 找到最近的交点
              const object = intersects[0].object;

              // 寻找父节点
              let parent = object;
              while (parent.parent && parent.parent !== modelRef.current) {
                parent = parent.parent;
              }

              // 触发选择事件
              onNodeSelect(parent.name);
            }
          };

          containerRef.current.addEventListener('click', handleClick);

          return () => {
            containerRef.current?.removeEventListener('click', handleClick);
          };
        }

        // 调整相机位置以适应模型
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = cameraRef.current.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

        cameraZ *= 1.5; // 增加一些距离

        cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
        cameraRef.current.lookAt(center);
        controlsRef.current.target.copy(center);

        // 设置第一个节点为当前节点
        if (productData.nodes && productData.nodes.length > 0) {
          setCurrentNodeData(productData.nodes[0]);
        }

        setLoading(false);
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error);
        setError('加载模型失败');
        setLoading(false);
      }
    );
  }, [productData, setCurrentNodeData, onNodeSelect]);

  // 更新节点高亮
  useEffect(() => {
    if (!modelRef.current || !highlightedNodeId) return;

    // 清除之前的高亮
    if (highlightedObjectRef.current) {
      // 恢复原始材质
      highlightedObjectRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          const originalMaterial = originalMaterialsRef.current.get(object.uuid);
          if (originalMaterial) {
            object.material = originalMaterial;
          }
        }
      });

      highlightedObjectRef.current = null;
    }

    // 查找要高亮的节点
    let highlightedObject = null;

    modelRef.current.traverse((object) => {
      if (object.name === highlightedNodeId) {
        highlightedObject = object;
      }
    });

    if (highlightedObject) {
      // 设置高亮材质
      const highlightMaterial = new THREE.MeshStandardMaterial({
        color: 0x2196f3,
        emissive: 0x2196f3,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.8
      });

      highlightedObject.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.material = highlightMaterial;
        }
      });

      highlightedObjectRef.current = highlightedObject;
    }
  }, [highlightedNodeId]);

  // 更新网格可见性
  useEffect(() => {
    if (!modelRef.current || !selectedMeshData) return;

    // 遍历模型中的所有网格
    modelRef.current.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        // 检查是否是选中的网格
        const meshData = selectedMeshData.find(data => data.id === object.name);

        // 更新可见性
        if (meshData) {
          object.visible = true;
        } else {
          object.visible = false;
        }
      }
    });
  }, [selectedMeshData]);

  // 更新环境贴图和场景设置
  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current) return;

    // 更新环境贴图
    if (scene?.environmentMapId) {
      const loadEnvironment = async () => {
        try {
          // 加载环境贴图
          const rgbeLoader = new RGBELoader();
          rgbeLoader.setDataType(THREE.FloatType);

          const texture = await new Promise<THREE.DataTexture>((resolve, reject) => {
            rgbeLoader.load(
              `/api/environments/${scene.environmentMapId}/content`,
              resolve,
              undefined,
              reject
            );
          });

          const pmremGenerator = new THREE.PMREMGenerator(rendererRef.current);
          pmremGenerator.compileEquirectangularShader();

          const envMap = pmremGenerator.fromEquirectangular(texture).texture;

          // 设置场景环境贴图
          sceneRef.current.environment = envMap;

          // 如果背景类型是环境贴图，设置背景
          if (scene.backgroundType === 'environment') {
            sceneRef.current.background = envMap;
          }

          // 释放资源
          texture.dispose();
          pmremGenerator.dispose();
        } catch (error) {
          console.error('Error loading environment map:', error);
        }
      };

      loadEnvironment();
    } else {
      // 如果没有环境贴图，使用默认环境
      const envMapLoader = new THREE.CubeTextureLoader();
      const envMap = envMapLoader.load([
        '/textures/env/px.jpg', '/textures/env/nx.jpg',
        '/textures/env/py.jpg', '/textures/env/ny.jpg',
        '/textures/env/pz.jpg', '/textures/env/nz.jpg'
      ]);
      sceneRef.current.environment = envMap;

      // 如果背景类型是环境贴图，设置背景
      if (scene?.backgroundType === 'environment') {
        sceneRef.current.background = envMap;
      }
    }

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

  // 更新材质
  useEffect(() => {
    if (!modelRef.current || !selectedMeshData || !selectedMeshMaterial) return;

    // 加载材质
    const loadMaterial = async () => {
      try {
        // 获取材质数据
        const response = await fetch(`/api/materials/${selectedMeshMaterial}`);
        if (!response.ok) throw new Error('Failed to fetch material');

        const materialData = await response.json();

        // 创建材质
        const material = new THREE.MeshStandardMaterial({
          color: materialData.baseProperties?.color || 0xcccccc,
          metalness: materialData.baseProperties?.metalness || 0,
          roughness: materialData.baseProperties?.roughness || 0.5,
          aoMapIntensity: materialData.baseProperties?.aoMapIntensity || 1,
          normalScale: new THREE.Vector2(materialData.baseProperties?.normalScale || 1, materialData.baseProperties?.normalScale || 1),
          emissive: materialData.baseProperties?.emissive || 0x000000,
          emissiveIntensity: materialData.baseProperties?.emissiveIntensity || 0
        });

        // 加载贴图
        if (materialData.maps) {
          for (const [mapType, textureId] of Object.entries(materialData.maps)) {
            const textureUrl = `/api/textures/${textureId}`;
            const texture = await new THREE.TextureLoader().loadAsync(textureUrl);

            // 应用贴图设置
            if (materialData.mapSettings) {
              if (materialData.mapSettings.repeat) {
                texture.repeat.set(
                  materialData.mapSettings.repeat[0] || 1,
                  materialData.mapSettings.repeat[1] || 1
                );
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
              }

              if (materialData.mapSettings.offset) {
                texture.offset.set(
                  materialData.mapSettings.offset[0] || 0,
                  materialData.mapSettings.offset[1] || 0
                );
              }

              if (materialData.mapSettings.rotation) {
                texture.rotation = materialData.mapSettings.rotation * Math.PI / 180;
              }
            }

            switch (mapType) {
              case 'map':
                material.map = texture;
                break;
              case 'normalMap':
                material.normalMap = texture;
                break;
              case 'roughnessMap':
                material.roughnessMap = texture;
                break;
              case 'metalnessMap':
                material.metalnessMap = texture;
                break;
              case 'aoMap':
                material.aoMap = texture;
                break;
              case 'emissiveMap':
                material.emissiveMap = texture;
                break;
              case 'transmissionMap':
                if (material.transmission !== undefined) {
                  material.transmissionMap = texture;
                }
                break;
              case 'thicknessMap':
                if (material.thickness !== undefined) {
                  material.thicknessMap = texture;
                }
                break;
              case 'clearcoatMap':
                if (material.clearcoat !== undefined) {
                  material.clearcoatMap = texture;
                }
                break;
              case 'clearcoatNormalMap':
                if (material.clearcoatNormalMap !== undefined) {
                  material.clearcoatNormalMap = texture;
                }
                break;
            }
          }
        }

        // 应用材质到选中的网格
        modelRef.current?.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            const meshData = selectedMeshData.find(data => data.id === object.name);
            if (meshData && meshData.materialId === selectedMeshMaterial) {
              object.material = material;

              // 存储原始材质
              originalMaterialsRef.current.set(object.uuid, material);
            }
          }
        });
      } catch (error) {
        console.error('Error loading material:', error);
      }
    };

    loadMaterial();
  }, [selectedMeshData, selectedMeshMaterial]);

  return (
    <div className="viewer-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {loading && (
        <div className="loading-overlay" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          zIndex: 10
        }}>
          <Spin tip="加载模型中..." />
        </div>
      )}

      {error && (
        <div className="error-overlay" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          zIndex: 10
        }}>
          <div className="error-message" style={{ color: 'red' }}>
            {error}
          </div>
        </div>
      )}

      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
