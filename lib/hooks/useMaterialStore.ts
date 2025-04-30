'use client';

import { create } from 'zustand';

interface Material {
  id: string;
  name: string;
  type: string;
  category: string;
  baseProperties: Record<string, any>;
  maps: Record<string, string>;
  mapSettings: Record<string, any>;
}

interface MaterialApplication {
  id: string;
  configId: string;
  nodeId: string;
  materialId: string;
  material: Material;
}

interface MaterialState {
  // 旧状态（保持兼容性）
  currentMaterialData: any | null;
  selectedMeshMaterial: string | null;
  setCurrentMaterialData: (data: any | null) => void;
  setSelectedMeshMaterial: (material: string | null) => void;

  // 新状态
  materials: Material[];
  selectedMaterial: Material | null;
  loading: boolean;

  // 操作
  loadMaterials: () => Promise<Material[]>;
  loadMaterialApplication: (configId: string, nodeId: string) => Promise<MaterialApplication | null>;
  saveMaterialApplication: (configId: string, nodeId: string, materialId: string) => Promise<MaterialApplication>;
  createMaterial: (materialData: Partial<Material>) => Promise<Material>;
  updateMaterial: (materialId: string, materialData: Partial<Material>) => Promise<Material>;
  selectMaterial: (material: Material) => void;
  updateMaterialProperty: (property: string, value: any) => void;
}

export const useMaterialStore = create<MaterialState>((set, get) => ({
  // 旧状态（保持兼容性）
  currentMaterialData: null,
  selectedMeshMaterial: null,
  setCurrentMaterialData: (data) => set({ currentMaterialData: data }),
  setSelectedMeshMaterial: (material) => set({ selectedMeshMaterial: material }),

  // 新状态
  materials: [],
  selectedMaterial: null,
  loading: false,

  // 操作
  loadMaterials: async () => {
    set({ loading: true });
    try {
      const response = await fetch('/api/materials');
      if (!response.ok) {
        throw new Error('Failed to load materials');
      }
      const data = await response.json();
      set({ materials: data });
      return data;
    } catch (error) {
      console.error('Error loading materials:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loadMaterialApplication: async (configId, nodeId) => {
    set({ loading: true });
    try {
      const response = await fetch(`/api/configs/${configId}/materials/${nodeId}`);

      if (response.status === 404) {
        // 如果没有找到材质应用，设置默认材质
        const defaultMaterial = {
          id: '',
          name: 'Default Material',
          type: 'standard',
          category: 'default',
          baseProperties: {
            color: '#ffffff',
            metalness: 0,
            roughness: 0.5,
            aoMapIntensity: 1,
            normalScale: 1,
            emissiveIntensity: 0,
            emissive: '#000000'
          },
          maps: {},
          mapSettings: {
            repeat: [1, 1],
            offset: [0, 0],
            rotation: 0
          }
        };
        set({ selectedMaterial: defaultMaterial });
        return null;
      }

      if (!response.ok) {
        throw new Error('Failed to load material application');
      }

      const data = await response.json();
      set({ selectedMaterial: data.material });
      return data;
    } catch (error) {
      console.error('Error loading material application:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  saveMaterialApplication: async (configId, nodeId, materialId) => {
    set({ loading: true });
    try {
      const response = await fetch(`/api/configs/${configId}/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nodeId,
          materialId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save material application');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error saving material application:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createMaterial: async (materialData) => {
    set({ loading: true });
    try {
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(materialData)
      });

      if (!response.ok) {
        throw new Error('Failed to create material');
      }

      const newMaterial = await response.json();
      set(state => ({ materials: [...state.materials, newMaterial] }));
      return newMaterial;
    } catch (error) {
      console.error('Error creating material:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateMaterial: async (materialId, materialData) => {
    set({ loading: true });
    try {
      const response = await fetch(`/api/materials/${materialId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(materialData)
      });

      if (!response.ok) {
        throw new Error('Failed to update material');
      }

      const updatedMaterial = await response.json();
      set(state => ({
        materials: state.materials.map(m => m.id === materialId ? updatedMaterial : m),
        selectedMaterial: state.selectedMaterial?.id === materialId ? updatedMaterial : state.selectedMaterial
      }));

      return updatedMaterial;
    } catch (error) {
      console.error('Error updating material:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  selectMaterial: (material) => {
    set({ selectedMaterial: material });
  },

  updateMaterialProperty: (property, value) => {
    set(state => {
      if (!state.selectedMaterial) return state;

      if (property.includes('.')) {
        // 处理嵌套属性，如 'baseProperties.color'
        const [section, key] = property.split('.');
        return {
          ...state,
          selectedMaterial: {
            ...state.selectedMaterial,
            [section]: {
              ...state.selectedMaterial[section],
              [key]: value
            }
          }
        };
      } else {
        // 处理顶级属性
        return {
          ...state,
          selectedMaterial: {
            ...state.selectedMaterial,
            [property]: value
          }
        };
      }
    });
  }
}));
