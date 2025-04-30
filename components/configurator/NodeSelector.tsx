'use client';

import { Select } from 'antd';
import { useModelStore } from '@/lib/hooks/useModelStore';
import { useNodeStore } from '@/lib/hooks/useNodeStore';

export default function NodeSelector() {
  const { productData } = useModelStore();
  const { currentNodeData, setCurrentNodeData } = useNodeStore();
  
  // 处理节点选择
  const handleNodeChange = (nodeId: string) => {
    if (!productData || !productData.nodes) return;
    
    const selectedNode = productData.nodes.find((node: any) => node.id === nodeId);
    if (selectedNode) {
      setCurrentNodeData(selectedNode);
    }
  };
  
  // 如果没有产品数据，不渲染任何内容
  if (!productData || !productData.nodes || productData.nodes.length === 0) {
    return <div>No nodes available</div>;
  }
  
  return (
    <div className="node-selector">
      <div className="selector-label">Select Node:</div>
      <Select
        style={{ width: '100%' }}
        value={currentNodeData?.id}
        onChange={handleNodeChange}
        options={productData.nodes.map((node: any) => ({
          value: node.id,
          label: node.name || node.label || node.id
        }))}
      />
    </div>
  );
}
