import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { PoStatus } from "../model/po.model";

/**
 * Zustand 的正確用途示範：純 UI/client state（篩選條件、分頁位置）。
 * 紀律：server state（API 回應）一律不進 store，交給 TanStack Query。
 */
interface PoListFilterState {
  page: number;
  pageSize: number;
  status?: PoStatus;
  setPage: (page: number, pageSize: number) => void;
  setStatus: (status?: PoStatus) => void;
}

export const usePoListFilterStore = create<PoListFilterState>()(
  immer((set) => ({
    page: 1,
    pageSize: 10,
    status: undefined,
    setPage: (page, pageSize) =>
      set((state) => {
        state.page = page;
        state.pageSize = pageSize;
      }),
    setStatus: (status) =>
      set((state) => {
        state.status = status;
        state.page = 1; // 篩選變更回到第一頁
      }),
  })),
);
