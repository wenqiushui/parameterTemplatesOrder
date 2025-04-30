'use client';

import { create } from 'zustand';

interface Texture {
  id: string;
  contentHash: string;
  name: string;
  description?: string;
  type: string;
  category: string;
  width: number;
  height: number;
  format: string;
  size: number;
  thumbnail: string;
  isPublic: boolean;
  createdBy: string;
  isFavorite?: boolean;
  tags: Array<{ id: string; name: string }>;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface TextureState {
  textures: Texture[];
  loading: boolean;
  pagination: Pagination | null;
  tags: Array<{ id: string; name: string }>;
  
  loadTextures: (params?: any) => Promise<{ textures: Texture[]; pagination: Pagination }>;
  loadTags: () => Promise<Array<{ id: string; name: string }>>;
  uploadTexture: (formData: FormData) => Promise<Texture>;
  toggleFavorite: (textureId: string, isFavorite: boolean) => Promise<void>;
  createTag: (name: string, description?: string) => Promise<{ id: string; name: string }>;
}

export const useTextureStore = create<TextureState>((set, get) => ({
  textures: [],
  loading: false,
  pagination: null,
  tags: [],
  
  loadTextures: async (params = {}) => {
    set({ loading: true });
    try {
      // 构建查询参数
      const queryParams = new URLSearchParams();
      
      if (params.type) queryParams.append('type', params.type);
      if (params.category) queryParams.append('category', params.category);
      if (params.tags) queryParams.append('tags', params.tags);
      if (params.search) queryParams.append('search', params.search);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      // 确定 API 端点
      let endpoint = '/api/textures';
      if (params.favorites) {
        endpoint = '/api/textures/favorites';
      }
      
      // 发送请求
      const response = await fetch(`${endpoint}?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to load textures');
      }
      
      const data = await response.json();
      set({ 
        textures: data.textures,
        pagination: data.pagination
      });
      
      return data;
    } catch (error) {
      console.error('Error loading textures:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  loadTags: async () => {
    set({ loading: true });
    try {
      const response = await fetch('/api/textures/tags');
      
      if (!response.ok) {
        throw new Error('Failed to load tags');
      }
      
      const data = await response.json();
      set({ tags: data });
      
      return data;
    } catch (error) {
      console.error('Error loading tags:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  uploadTexture: async (formData) => {
    set({ loading: true });
    try {
      const response = await fetch('/api/textures', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload texture');
      }
      
      const texture = await response.json();
      
      // 更新贴图列表
      set(state => ({
        textures: [texture, ...state.textures]
      }));
      
      return texture;
    } catch (error) {
      console.error('Error uploading texture:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  toggleFavorite: async (textureId, isFavorite) => {
    try {
      const response = await fetch(`/api/textures/${textureId}/favorite`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }
      
      // 更新贴图收藏状态
      set(state => ({
        textures: state.textures.map(texture => 
          texture.id === textureId 
            ? { ...texture, isFavorite: !isFavorite } 
            : texture
        )
      }));
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  },
  
  createTag: async (name, description) => {
    set({ loading: true });
    try {
      const response = await fetch('/api/textures/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, description })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create tag');
      }
      
      const tag = await response.json();
      
      // 更新标签列表
      set(state => ({
        tags: [...state.tags, tag]
      }));
      
      return tag;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));
