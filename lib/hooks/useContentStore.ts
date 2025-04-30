import { create } from 'zustand';

interface ContentState {
  contentUrls: Record<string, string>;

  getContentUrl: (contentHash: string, type?: string) => string;
}

export const useContentStore = create<ContentState>((set, get) => ({
  contentUrls: {},

  getContentUrl: (contentHash, type = 'texture') => {
    if (!contentHash) {
      return '';
    }

    // 直接返回静态资源路径，不再缓存URL
    // 这样避免在渲染过程中更新状态
    return `/storage/${type}s/${contentHash.substring(0, 2)}/${contentHash}`;
  }
}));
