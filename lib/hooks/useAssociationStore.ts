import { create } from 'zustand';

interface AssociationState {
  associations: any[];
  loading: boolean;
  
  loadAssociations: (sourceType: string, sourceId: string, targetType: string) => Promise<any>;
  createAssociation: (sourceType: string, sourceId: string, targetType: string, data: any) => Promise<any>;
  deleteAssociation: (sourceType: string, sourceId: string, targetType: string, targetId: string) => Promise<any>;
}

export const useAssociationStore = create<AssociationState>((set, get) => ({
  associations: [],
  loading: false,
  
  loadAssociations: async (sourceType, sourceId, targetType) => {
    set({ loading: true });
    
    try {
      // 发送请求
      const response = await fetch(`/api/associations/${sourceType}/${sourceId}/${targetType}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load associations');
      }
      
      const associations = await response.json();
      
      set({
        associations,
        loading: false
      });
      
      return associations;
    } catch (error) {
      console.error(`Error loading associations:`, error);
      set({ loading: false });
      throw error;
    }
  },
  
  createAssociation: async (sourceType, sourceId, targetType, data) => {
    set({ loading: true });
    
    try {
      // 发送请求
      const response = await fetch(`/api/associations/${sourceType}/${sourceId}/${targetType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create association');
      }
      
      const association = await response.json();
      
      // 更新关联列表
      const associations = get().associations;
      
      // 对于材质应用，我们需要根据 nodeId 更新或添加
      if (sourceType === 'configs' && targetType === 'materials') {
        const index = associations.findIndex(a => a.nodeId === data.nodeId);
        
        if (index !== -1) {
          associations[index] = association;
        } else {
          associations.push(association);
        }
      } else {
        associations.push(association);
      }
      
      set({
        associations: [...associations],
        loading: false
      });
      
      return association;
    } catch (error) {
      console.error(`Error creating association:`, error);
      set({ loading: false });
      throw error;
    }
  },
  
  deleteAssociation: async (sourceType, sourceId, targetType, targetId) => {
    set({ loading: true });
    
    try {
      // 发送请求
      const response = await fetch(`/api/associations/${sourceType}/${sourceId}/${targetType}?targetId=${targetId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete association');
      }
      
      // 更新关联列表
      let associations = get().associations;
      
      // 对于材质应用，我们需要根据 nodeId 删除
      if (sourceType === 'configs' && targetType === 'materials') {
        associations = associations.filter(a => a.nodeId !== targetId);
      } else if (sourceType === 'textures' && targetType === 'favorites') {
        associations = associations.filter(a => a.id !== sourceId);
      }
      
      set({
        associations,
        loading: false
      });
      
      return { success: true };
    } catch (error) {
      console.error(`Error deleting association:`, error);
      set({ loading: false });
      throw error;
    }
  }
}));
