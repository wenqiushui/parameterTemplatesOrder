'use client';

import { useEffect, useState } from 'react';
import { Card, Select, Spin } from 'antd';
import { useNodeStore } from '@/lib/hooks/useNodeStore';
import { useMeshStore } from '@/lib/hooks/useMeshStore';
import { useMaterialStore } from '@/lib/hooks/useMaterialStore';
import Image from 'next/image';

export default function MaterialSelector() {
  const { currentNodeData } = useNodeStore();
  const { selectedMeshData, setSelectedMeshData } = useMeshStore();
  const { setSelectedMeshMaterial } = useMaterialStore();
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  
  // 加载材质
  useEffect(() => {
    if (!currentNodeData || !currentNodeData.candidateMaterials || currentNodeData.candidateMaterials.length === 0) {
      return;
    }
    
    const loadMaterials = async () => {
      setLoading(true);
      
      try {
        // 获取材质数据
        const materialPromises = currentNodeData.candidateMaterials.map(async (material: any) => {
          // 从路径中提取材质 ID
          const materialId = material.path.split('/').pop()?.replace('.json', '') || '';
          
          // 获取材质详情
          const response = await fetch(`/api/materials/${materialId}`);
          if (!response.ok) throw new Error(`Failed to fetch material: ${materialId}`);
          
          const materialData = await response.json();
          
          return {
            ...materialData,
            thumbnail: material.thumbnail || '/images/default-material.jpg'
          };
        });
        
        const loadedMaterials = await Promise.all(materialPromises);
        setMaterials(loadedMaterials);
        
        // 设置默认材质
        if (loadedMaterials.length > 0 && selectedMeshData && selectedMeshData.length > 0) {
          const defaultMaterial = currentNodeData.defaultMaterial?.path
            ? currentNodeData.defaultMaterial.path.split('/').pop()?.replace('.json', '')
            : loadedMaterials[0].id;
          
          handleMaterialSelect(defaultMaterial);
        }
      } catch (error) {
        console.error('Error loading materials:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMaterials();
  }, [currentNodeData, selectedMeshData]);
  
  // 处理材质选择
  const handleMaterialSelect = (materialId: string) => {
    if (!selectedMeshData || selectedMeshData.length === 0 || !currentNodeData) return;
    
    // 更新选中的网格材质
    const updatedMeshData = selectedMeshData.map(mesh => ({
      ...mesh,
      materialId
    }));
    
    setSelectedMeshData(updatedMeshData);
    setSelectedMeshMaterial(materialId);
  };
  
  // 如果没有节点数据或网格数据，不渲染任何内容
  if (!currentNodeData || !selectedMeshData || selectedMeshData.length === 0) {
    return <div>Select a node and mesh first</div>;
  }
  
  return (
    <div className="material-selector">
      <div className="selector-label">Select Material:</div>
      
      {loading ? (
        <div className="loading-container" style={{ textAlign: 'center', padding: '20px' }}>
          <Spin tip="Loading materials..." />
        </div>
      ) : (
        <div className="materials-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: '10px',
          marginTop: '10px'
        }}>
          {materials.map(material => (
            <Card
              key={material.id}
              hoverable
              style={{ 
                width: '100%',
                border: selectedMeshData[0]?.materialId === material.id 
                  ? '2px solid #1890ff' 
                  : '1px solid #f0f0f0'
              }}
              bodyStyle={{ padding: '8px' }}
              onClick={() => handleMaterialSelect(material.id)}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '100%', height: '60px', position: 'relative', marginBottom: '5px' }}>
                  <Image
                    src={material.thumbnail}
                    alt={material.name}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {material.name}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
