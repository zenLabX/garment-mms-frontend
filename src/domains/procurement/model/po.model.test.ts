import { describe, expect, it } from "vitest";
import { poStatusViewMap, rejectFormSchema } from "./po.model";

describe("poStatusViewMap（狀態 → 畫面行為對照表）", () => {
  it("草稿與已退回狀態品項可編輯，其餘唯讀", () => {
    expect(poStatusViewMap.Draft.itemsEditable).toBe(true);
    expect(poStatusViewMap.Rejected.itemsEditable).toBe(true);
    expect(poStatusViewMap.PendingApproval.itemsEditable).toBe(false);
    expect(poStatusViewMap.Approved.itemsEditable).toBe(false);
  });

  it("退回後（含重送待複核）要顯示退回原因，提醒處理", () => {
    expect(poStatusViewMap.Rejected.showRejectReason).toBe(true);
    expect(poStatusViewMap.PendingReview.showRejectReason).toBe(true);
    expect(poStatusViewMap.Draft.showRejectReason).toBe(false);
  });

  it("已核准 / 已結案為終態", () => {
    expect(poStatusViewMap.Approved.isTerminal).toBe(true);
    expect(poStatusViewMap.Closed.isTerminal).toBe(true);
    expect(poStatusViewMap.PendingReview.isTerminal).toBe(false);
  });
});

describe("rejectFormSchema", () => {
  it("退回原因必填且不可超過 200 字", () => {
    expect(rejectFormSchema.safeParse({ reason: "" }).success).toBe(false);
    expect(rejectFormSchema.safeParse({ reason: "交期過長" }).success).toBe(true);
    expect(rejectFormSchema.safeParse({ reason: "字".repeat(201) }).success).toBe(false);
  });
});
