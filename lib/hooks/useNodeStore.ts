'use client';

import { create } from 'zustand';

interface NodeState {
  currentNodeData: any | null;
  setCurrentNodeData: (data: any | null) => void;
}

export const useNodeStore = create<NodeState>((set) => ({
  currentNodeData: null,
  setCurrentNodeData: (data) => set({ currentNodeData: data })
}));
