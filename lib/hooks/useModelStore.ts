'use client';

import { create } from 'zustand';

// 定义状态类型
interface ModelState {
  productData: any | null;
  currentDracoVersion: string;
  setProductData: (data: any | null) => void;
  setCurrentDracoVersion: (version: string) => void;
}

// 创建状态存储
export const useModelStore = create<ModelState>((set) => ({
  productData: null,
  currentDracoVersion: 'original',
  setProductData: (data) => set({ productData: data }),
  setCurrentDracoVersion: (version) => set({ currentDracoVersion: version })
}));
