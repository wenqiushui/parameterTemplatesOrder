'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 购物车项类型
interface CartItem {
  configId: string;
  quantity: number;
  price: number;
}

// 购物车状态类型
interface CartState {
  cartItems: CartItem[];
  addItem: (configId: string, price: number) => void;
  updateItemQuantity: (configId: string, quantity: number) => void;
  removeItem: (configId: string) => void;
  clearCart: () => void;
}

// 创建购物车状态存储
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cartItems: [],
      
      // 添加商品到购物车
      addItem: (configId, price) => set((state) => {
        // 检查商品是否已在购物车中
        const existingItemIndex = state.cartItems.findIndex(
          item => item.configId === configId
        );
        
        if (existingItemIndex >= 0) {
          // 如果已存在，增加数量
          const updatedItems = [...state.cartItems];
          updatedItems[existingItemIndex].quantity += 1;
          return { cartItems: updatedItems };
        } else {
          // 如果不存在，添加新商品
          return {
            cartItems: [
              ...state.cartItems,
              { configId, quantity: 1, price }
            ]
          };
        }
      }),
      
      // 更新商品数量
      updateItemQuantity: (configId, quantity) => set((state) => {
        // 确保数量是有效的
        const validQuantity = Math.max(1, Math.min(99, quantity));
        
        // 更新商品数量
        const updatedItems = state.cartItems.map(item => 
          item.configId === configId
            ? { ...item, quantity: validQuantity }
            : item
        );
        
        return { cartItems: updatedItems };
      }),
      
      // 从购物车中移除商品
      removeItem: (configId) => set((state) => ({
        cartItems: state.cartItems.filter(item => item.configId !== configId)
      })),
      
      // 清空购物车
      clearCart: () => set({ cartItems: [] })
    }),
    {
      name: 'cart-storage', // 本地存储的键名
    }
  )
);
