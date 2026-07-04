import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ReqStatus } from "../model/requisition.model";

/** 純 UI state：篩選條件、分頁位置。server state 一律交給 TanStack Query。 */
interface ReqListFilterState {
  page: number;
  pageSize: number;
  status?: ReqStatus;
  setPage: (page: number, pageSize: number) => void;
  setStatus: (status?: ReqStatus) => void;
}

export const useReqListFilterStore = create<ReqListFilterState>()(
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
        state.page = 1;
      }),
  })),
);
