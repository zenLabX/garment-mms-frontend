import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ReqHeaderDraft, ReqLineDraft } from "../model/requisition.model";

/**
 * 多步驟表單草稿：UI state vs server state 的分界判準——
 * 「還沒送出 = UI state（放這裡）；按下送出、API 回 201 那一刻起 = server state（TanStack Query）」。
 * 送出成功後立即 resetDraft()，之後畫面一律從 Query 讀，草稿不留副本。
 *
 * 草稿只活在記憶體：切頁再回來還在，F5 消失。若需求要「重整不丟」，
 * 加 zustand persist middleware 一行即可——仍然不碰 server state。
 */
interface RequisitionDraftState {
  step: number;
  header: ReqHeaderDraft;
  lines: ReqLineDraft[];
  setStep: (step: number) => void;
  patchHeader: (patch: Partial<ReqHeaderDraft>) => void;
  addLine: (line: ReqLineDraft) => void;
  removeLine: (sku: string) => void;
  resetDraft: () => void;
}

const emptyHeader: ReqHeaderDraft = { department: "", purpose: "", neededDate: "" };

export const useRequisitionDraftStore = create<RequisitionDraftState>()(
  immer((set) => ({
    step: 0,
    header: { ...emptyHeader },
    lines: [],
    setStep: (step) =>
      set((state) => {
        state.step = step;
      }),
    patchHeader: (patch) =>
      set((state) => {
        Object.assign(state.header, patch);
      }),
    addLine: (line) =>
      set((state) => {
        const existing = state.lines.find((l) => l.sku === line.sku);
        if (existing) {
          existing.qty += line.qty; // 同料號累加，不重複列
        } else {
          state.lines.push(line);
        }
      }),
    removeLine: (sku) =>
      set((state) => {
        state.lines = state.lines.filter((l) => l.sku !== sku);
      }),
    resetDraft: () =>
      set((state) => {
        state.step = 0;
        state.header = { ...emptyHeader };
        state.lines = [];
      }),
  })),
);
