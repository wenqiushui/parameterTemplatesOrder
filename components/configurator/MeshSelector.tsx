'use client';

import { Select } from 'antd';
import { useNodeStore } from '@/lib/hooks/useNodeStore';
import { useMeshStore } from '@/lib/hooks/useMeshStore';
import { useEffect } from 'react';

export default function MeshSelector() {
  const { currentNodeData } = useNodeStore();
  const { selectedMeshData, setSelectedMeshData } = useMeshStore();
  
  // 当节点变化时，重置选中的网格
  useEffect(() => {
    if (currentNodeData && currentNodeData.candidateMeshes) {
      // 默认选中第一个网格
      const defaultMesh = currentNodeData.candidateMeshes.find(
        (mesh: any) => mesh.id === currentNodeData.defaultMesh
      ) || currentNodeData.candidateMeshes[0];
      
      if (defaultMesh) {
        setSelectedMeshData([{
          id: defaultMesh.id,
          nodeId: currentNodeData.id,
          materialId: null
        }]);
      }
    }
  }, [currentNodeData, setSelectedMeshData]);
  
  // 处理网格选择
  const handleMeshChange = (meshId: string) => {
    if (!currentNodeData) return;
    
    setSelectedMeshData([{
      id: meshId,
      nodeId: currentNodeData.id,
      materialId: selectedMeshData?.[0]?.materialId || null
    }]);
  };
  
  // 如果没有节点数据，不渲染任何内容
  if (!currentNodeData || !currentNodeData.candidateMeshes || currentNodeData.candidateMeshes.length === 0) {
    return <div>No meshes available</div>;
  }
  
  return (
    <div className="mesh-selector">
      <div className="selector-label">Select Mesh:</div>
      <Select
        style={{ width: '100%' }}
        value={selectedMeshData?.[0]?.id}
        onChange={handleMeshChange}
        options={currentNodeData.candidateMeshes.map((mesh: any) => ({
          value: mesh.id,
          label: mesh.name || mesh.label || mesh.id
        }))}
      />
    </div>
  );
}
