'use client';

import { create } from 'zustand';

interface MeshState {
  selectedMeshData: any[] | null;
  setSelectedMeshData: (data: any[] | null) => void;
}

export const useMeshStore = create<MeshState>((set) => ({
  selectedMeshData: null,
  setSelectedMeshData: (data) => set({ selectedMeshData: data })
}));
