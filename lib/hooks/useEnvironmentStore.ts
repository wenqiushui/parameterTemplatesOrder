'use client';

import { create } from 'zustand';

interface EnvironmentMap {
  id: string;
  name: string;
  description?: string;
  contentHash: string;
  thumbnail: string;
  format: string;
  type: string;
  intensity: number;
  size: number;
  resolution: number;
  isPreset: boolean;
  createdBy: string;
  processedCubemap?: string;
}

interface Scene {
  id: string;
  name: string;
  description?: string;
  environmentMapId?: string;
  environmentMap?: EnvironmentMap;
  backgroundType: string;
  backgroundColor: string;
  exposure: number;
  toneMapping: string;
  createdBy: string;
}

interface EnvironmentState {
  environments: EnvironmentMap[];
  loading: boolean;
  
  loadEnvironments: () => Promise<EnvironmentMap[]>;
  uploadEnvironment: (formData: FormData) => Promise<EnvironmentMap>;
  createScene: (sceneData: Partial<Scene>) => Promise<Scene>;
  updateScene: (sceneId: string, sceneData: Partial<Scene>) => Promise<Scene>;
}

export const useEnvironmentStore = create<EnvironmentState>((set, get) => ({
  environments: [],
  loading: false,
  
  loadEnvironments: async () => {
    set({ loading: true });
    try {
      const response = await fetch('/api/environments');
      
      if (!response.ok) {
        throw new Error('Failed to load environments');
      }
      
      const data = await response.json();
      set({ environments: data });
      
      return data;
    } catch (error) {
      console.error('Error loading environments:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  uploadEnvironment: async (formData) => {
    set({ loading: true });
    try {
      const response = await fetch('/api/environments', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload environment');
      }
      
      const environment = await response.json();
      
      // 更新环境贴图列表
      set(state => ({
        environments: [environment, ...state.environments]
      }));
      
      return environment;
    } catch (error) {
      console.error('Error uploading environment:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  createScene: async (sceneData) => {
    set({ loading: true });
    try {
      const response = await fetch('/api/scenes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sceneData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create scene');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating scene:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  updateScene: async (sceneId, sceneData) => {
    set({ loading: true });
    try {
      const response = await fetch(`/api/scenes/${sceneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sceneData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update scene');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating scene:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));
