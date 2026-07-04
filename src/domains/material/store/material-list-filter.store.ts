import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

/**
 * Zustand 的正確用途示範：純 UI/client state（篩選條件、分頁位置）。
 * 紀律：server state（API 回應）一律不進 store，交給 TanStack Query。
 */
interface MaterialListFilterState {
  page: number;
  pageSize: number;
  keyword?: string;
  setPage: (page: number, pageSize: number) => void;
  setKeyword: (keyword?: string) => void;
}

export const useMaterialListFilterStore = create<MaterialListFilterState>()(
  immer((set) => ({
    page: 1,
    pageSize: 10,
    keyword: undefined,
    setPage: (page, pageSize) =>
      set((state) => {
        state.page = page;
        state.pageSize = pageSize;
      }),
    setKeyword: (keyword) =>
      set((state) => {
        state.keyword = keyword || undefined;
        state.page = 1; // 搜尋條件變更回到第一頁
      }),
  })),
);
