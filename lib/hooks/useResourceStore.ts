import { create } from 'zustand';

interface ResourceState {
  // 每种资源类型的存储
  resourcesByType: Record<string, any[]>;
  selectedResourcesByType: Record<string, any | null>;
  loadingByType: Record<string, boolean>;
  paginationByType: Record<string, any | null>;

  // 当前活动的资源类型
  activeResourceType: string;

  // 兼容旧接口
  resources: any[];
  selectedResource: any | null;
  loading: boolean;
  pagination: any | null;

  // 方法
  setActiveResourceType: (resourceType: string) => void;
  loadResources: (resourceType: string, params?: any) => Promise<any>;
  loadResourceById: (resourceType: string, resourceId: string) => Promise<any>;
  createResource: (resourceType: string, data: any) => Promise<any>;
  updateResource: (resourceType: string, resourceId: string, data: any) => Promise<any>;
  deleteResource: (resourceType: string, resourceId: string) => Promise<any>;
  selectResource: (resourceType: string, resource: any) => void;
  updateResourceProperty: (resourceType: string, property: string, value: any) => void;

  // 获取特定类型的资源
  getResources: (resourceType: string) => any[];
  getSelectedResource: (resourceType: string) => any | null;
  isLoading: (resourceType: string) => boolean;
  getPagination: (resourceType: string) => any | null;
}

export const useResourceStore = create<ResourceState>((set, get) => ({
  // 初始化状态
  resourcesByType: {},
  selectedResourcesByType: {},
  loadingByType: {},
  paginationByType: {},
  activeResourceType: '',

  // 兼容旧接口
  resources: [],
  selectedResource: null,
  loading: false,
  pagination: null,

  // 获取特定类型的资源
  getResources: (resourceType) => get().resourcesByType[resourceType] || [],
  getSelectedResource: (resourceType) => get().selectedResourcesByType[resourceType] || null,
  isLoading: (resourceType) => get().loadingByType[resourceType] || false,
  getPagination: (resourceType) => get().paginationByType[resourceType] || null,

  // 设置当前活动的资源类型
  setActiveResourceType: (resourceType) => {
    set({
      activeResourceType: resourceType,
      // 同步当前资源类型的状态到兼容接口
      resources: get().resourcesByType[resourceType] || [],
      selectedResource: get().selectedResourcesByType[resourceType] || null,
      loading: get().loadingByType[resourceType] || false,
      pagination: get().paginationByType[resourceType] || null
    });
  },

  loadResources: async (resourceType, params = {}) => {
    // 更新特定资源类型的加载状态
    const loadingByType = { ...get().loadingByType, [resourceType]: true };
    set({
      loadingByType,
      loading: get().activeResourceType === resourceType ? true : get().loading
    });

    try {
      // 构建查询参数
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      // 发送请求
      const response = await fetch(`/api/resources/${resourceType}?${queryParams.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load resources');
      }

      const data = await response.json();

      // 更新特定资源类型的状态
      const resourcesByType = { ...get().resourcesByType, [resourceType]: data.resources || [] };
      const paginationByType = { ...get().paginationByType, [resourceType]: data.pagination || null };
      const loadingByType = { ...get().loadingByType, [resourceType]: false };

      set({
        resourcesByType,
        paginationByType,
        loadingByType,
        // 如果是当前活动的资源类型，同步到兼容接口
        resources: resourceType === get().activeResourceType ? data.resources || [] : get().resources,
        pagination: resourceType === get().activeResourceType ? data.pagination || null : get().pagination,
        loading: resourceType === get().activeResourceType ? false : get().loading
      });

      return data;
    } catch (error) {
      console.error(`Error loading ${resourceType}:`, error);
      // 更新特定资源类型的加载状态
      const loadingByType = { ...get().loadingByType, [resourceType]: false };
      set({
        loadingByType,
        loading: get().activeResourceType === resourceType ? false : get().loading
      });
      throw error;
    }
  },

  loadResourceById: async (resourceType, resourceId) => {
    // 更新特定资源类型的加载状态
    const loadingByType = { ...get().loadingByType, [resourceType]: true };
    set({
      loadingByType,
      loading: get().activeResourceType === resourceType ? true : get().loading
    });

    try {
      // 发送请求
      const response = await fetch(`/api/resources/${resourceType}/${resourceId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load resource');
      }

      const resource = await response.json();

      // 更新特定资源类型的选中资源
      const selectedResourcesByType = { ...get().selectedResourcesByType, [resourceType]: resource };
      const loadingByType = { ...get().loadingByType, [resourceType]: false };

      set({
        selectedResourcesByType,
        loadingByType,
        // 如果是当前活动的资源类型，同步到兼容接口
        selectedResource: resourceType === get().activeResourceType ? resource : get().selectedResource,
        loading: resourceType === get().activeResourceType ? false : get().loading
      });

      return resource;
    } catch (error) {
      console.error(`Error loading ${resourceType} by ID:`, error);
      // 更新特定资源类型的加载状态
      const loadingByType = { ...get().loadingByType, [resourceType]: false };
      set({
        loadingByType,
        loading: get().activeResourceType === resourceType ? false : get().loading
      });
      throw error;
    }
  },

  createResource: async (resourceType, data) => {
    // 更新特定资源类型的加载状态
    const loadingByType = { ...get().loadingByType, [resourceType]: true };
    set({
      loadingByType,
      loading: get().activeResourceType === resourceType ? true : get().loading
    });

    try {
      // 发送请求
      const response = await fetch(`/api/resources/${resourceType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create resource');
      }

      const resource = await response.json();

      // 更新特定资源类型的资源列表
      const currentResources = get().resourcesByType[resourceType] || [];
      const resourcesByType = { ...get().resourcesByType, [resourceType]: [resource, ...currentResources] };
      const selectedResourcesByType = { ...get().selectedResourcesByType, [resourceType]: resource };
      const loadingByType = { ...get().loadingByType, [resourceType]: false };

      set({
        resourcesByType,
        selectedResourcesByType,
        loadingByType,
        // 如果是当前活动的资源类型，同步到兼容接口
        resources: resourceType === get().activeResourceType ? [resource, ...currentResources] : get().resources,
        selectedResource: resourceType === get().activeResourceType ? resource : get().selectedResource,
        loading: resourceType === get().activeResourceType ? false : get().loading
      });

      return resource;
    } catch (error) {
      console.error(`Error creating ${resourceType}:`, error);
      // 更新特定资源类型的加载状态
      const loadingByType = { ...get().loadingByType, [resourceType]: false };
      set({
        loadingByType,
        loading: get().activeResourceType === resourceType ? false : get().loading
      });
      throw error;
    }
  },

  updateResource: async (resourceType, resourceId, data) => {
    // 更新特定资源类型的加载状态
    const loadingByType = { ...get().loadingByType, [resourceType]: true };
    set({
      loadingByType,
      loading: get().activeResourceType === resourceType ? true : get().loading
    });

    try {
      // 发送请求
      const response = await fetch(`/api/resources/${resourceType}/${resourceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update resource');
      }

      const updatedResource = await response.json();

      // 更新特定资源类型的资源列表和选中的资源
      const currentResources = get().resourcesByType[resourceType] || [];
      const updatedResources = currentResources.map(resource =>
        resource.id === resourceId ? updatedResource : resource
      );

      const resourcesByType = { ...get().resourcesByType, [resourceType]: updatedResources };
      const selectedResourcesByType = { ...get().selectedResourcesByType, [resourceType]: updatedResource };
      const loadingByType = { ...get().loadingByType, [resourceType]: false };

      set({
        resourcesByType,
        selectedResourcesByType,
        loadingByType,
        // 如果是当前活动的资源类型，同步到兼容接口
        resources: resourceType === get().activeResourceType ? updatedResources : get().resources,
        selectedResource: resourceType === get().activeResourceType ? updatedResource : get().selectedResource,
        loading: resourceType === get().activeResourceType ? false : get().loading
      });

      return updatedResource;
    } catch (error) {
      console.error(`Error updating ${resourceType}:`, error);
      // 更新特定资源类型的加载状态
      const loadingByType = { ...get().loadingByType, [resourceType]: false };
      set({
        loadingByType,
        loading: get().activeResourceType === resourceType ? false : get().loading
      });
      throw error;
    }
  },

  deleteResource: async (resourceType, resourceId) => {
    // 更新特定资源类型的加载状态
    const loadingByType = { ...get().loadingByType, [resourceType]: true };
    set({
      loadingByType,
      loading: get().activeResourceType === resourceType ? true : get().loading
    });

    try {
      // 发送请求
      const response = await fetch(`/api/resources/${resourceType}/${resourceId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete resource');
      }

      // 更新特定资源类型的资源列表
      const currentResources = get().resourcesByType[resourceType] || [];
      const filteredResources = currentResources.filter(resource => resource.id !== resourceId);

      const currentSelectedResource = get().selectedResourcesByType[resourceType];
      const newSelectedResource = currentSelectedResource && currentSelectedResource.id === resourceId ? null : currentSelectedResource;

      const resourcesByType = { ...get().resourcesByType, [resourceType]: filteredResources };
      const selectedResourcesByType = { ...get().selectedResourcesByType, [resourceType]: newSelectedResource };
      const loadingByType = { ...get().loadingByType, [resourceType]: false };

      set({
        resourcesByType,
        selectedResourcesByType,
        loadingByType,
        // 如果是当前活动的资源类型，同步到兼容接口
        resources: resourceType === get().activeResourceType ? filteredResources : get().resources,
        selectedResource: resourceType === get().activeResourceType ? newSelectedResource : get().selectedResource,
        loading: resourceType === get().activeResourceType ? false : get().loading
      });

      return { success: true };
    } catch (error) {
      console.error(`Error deleting ${resourceType}:`, error);
      // 更新特定资源类型的加载状态
      const loadingByType = { ...get().loadingByType, [resourceType]: false };
      set({
        loadingByType,
        loading: get().activeResourceType === resourceType ? false : get().loading
      });
      throw error;
    }
  },

  selectResource: (resourceType, resource) => {
    // 更新特定资源类型的选中资源
    const selectedResourcesByType = { ...get().selectedResourcesByType, [resourceType]: resource };

    set({
      selectedResourcesByType,
      // 如果是当前活动的资源类型，同步到兼容接口
      selectedResource: resourceType === get().activeResourceType ? resource : get().selectedResource
    });
  },

  updateResourceProperty: (resourceType, property, value) => {
    const selectedResource = get().selectedResourcesByType[resourceType];

    if (selectedResource) {
      // 更新特定资源类型的选中资源属性
      const updatedResource = {
        ...selectedResource,
        [property]: value
      };

      const selectedResourcesByType = { ...get().selectedResourcesByType, [resourceType]: updatedResource };

      set({
        selectedResourcesByType,
        // 如果是当前活动的资源类型，同步到兼容接口
        selectedResource: resourceType === get().activeResourceType ? updatedResource : get().selectedResource
      });
    }
  }
}));
