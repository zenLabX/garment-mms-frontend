import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { MaterialCategory } from "@/domains/material/model/material.model";

/**
 * 看板全域篩選器（純 UI state）：warehouse / category 一改，
 * 四張卡的 query key 同時變 → 全部自動重抓——元件之間零通訊。
 */
interface InventoryDashboardFilterState {
  warehouse?: string;
  category?: MaterialCategory;
  lowStockPage: number;
  lowStockPageSize: number;
  setWarehouse: (warehouse?: string) => void;
  setCategory: (category?: MaterialCategory) => void;
  setLowStockPage: (page: number, pageSize: number) => void;
}

export const useInventoryDashboardFilterStore = create<InventoryDashboardFilterState>()(
  immer((set) => ({
    warehouse: undefined,
    category: undefined,
    lowStockPage: 1,
    lowStockPageSize: 5,
    setWarehouse: (warehouse) =>
      set((state) => {
        state.warehouse = warehouse;
        state.lowStockPage = 1; // 篩選變更回到第一頁
      }),
    setCategory: (category) =>
      set((state) => {
        state.category = category;
        state.lowStockPage = 1;
      }),
    setLowStockPage: (page, pageSize) =>
      set((state) => {
        state.lowStockPage = page;
        state.lowStockPageSize = pageSize;
      }),
  })),
);
