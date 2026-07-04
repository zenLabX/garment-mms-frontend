import { beforeEach, describe, expect, it } from "vitest";
import { useRequisitionDraftStore } from "./requisition-draft.store";

const line = { sku: "FAB-COT-320", name: "精梳棉 320g", unit: "碼", qty: 100 };

describe("requisition-draft.store（多步驟草稿：純 UI state）", () => {
  beforeEach(() => {
    useRequisitionDraftStore.getState().resetDraft();
  });

  it("addLine 同料號累加數量，不重複列", () => {
    const { addLine } = useRequisitionDraftStore.getState();
    addLine(line);
    addLine({ ...line, qty: 50 });
    const { lines } = useRequisitionDraftStore.getState();
    expect(lines).toHaveLength(1);
    expect(lines[0].qty).toBe(150);
  });

  it("removeLine 依料號移除", () => {
    const { addLine, removeLine } = useRequisitionDraftStore.getState();
    addLine(line);
    removeLine(line.sku);
    expect(useRequisitionDraftStore.getState().lines).toHaveLength(0);
  });

  it("resetDraft 清空草稿並回到第一步（送出成功後呼叫，之後畫面一律讀 Query）", () => {
    const { addLine, patchHeader, setStep } = useRequisitionDraftStore.getState();
    patchHeader({ department: "裁剪課" });
    addLine(line);
    setStep(2);
    useRequisitionDraftStore.getState().resetDraft();
    const state = useRequisitionDraftStore.getState();
    expect(state.step).toBe(0);
    expect(state.header.department).toBe("");
    expect(state.lines).toHaveLength(0);
  });
});
