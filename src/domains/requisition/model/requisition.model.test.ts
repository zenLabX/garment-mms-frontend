import { describe, expect, it } from "vitest";
import { reqDraftSchema, reqHeaderSchema, reqLineSchema, reqStatusViewMap } from "./requisition.model";

const validHeader = { department: "裁剪課", purpose: "訂單 #A-1024 裁剪用料", neededDate: "2026-07-15" };
const validLine = { sku: "FAB-COT-320", name: "精梳棉 320g", unit: "碼", qty: 100 };

describe("reqHeaderSchema / reqLineSchema（Steps 逐步驗證）", () => {
  it("表頭缺任一欄位不通過", () => {
    expect(reqHeaderSchema.safeParse(validHeader).success).toBe(true);
    expect(reqHeaderSchema.safeParse({ ...validHeader, department: "" }).success).toBe(false);
    expect(reqHeaderSchema.safeParse({ ...validHeader, neededDate: "" }).success).toBe(false);
  });

  it("明細數量須為正整數", () => {
    expect(reqLineSchema.safeParse(validLine).success).toBe(true);
    expect(reqLineSchema.safeParse({ ...validLine, qty: 0 }).success).toBe(false);
    expect(reqLineSchema.safeParse({ ...validLine, qty: -5 }).success).toBe(false);
    expect(reqLineSchema.safeParse({ ...validLine, qty: 1.5 }).success).toBe(false);
  });
});

describe("reqDraftSchema（送出前驗整包）", () => {
  it("至少需要一筆明細", () => {
    expect(reqDraftSchema.safeParse({ header: validHeader, lines: [] }).success).toBe(false);
    expect(reqDraftSchema.safeParse({ header: validHeader, lines: [validLine] }).success).toBe(true);
  });
});

describe("reqStatusViewMap（狀態 → 畫面行為對照表）", () => {
  it("已退回要顯示退回原因", () => {
    expect(reqStatusViewMap.Rejected.showRejectReason).toBe(true);
    expect(reqStatusViewMap.Draft.showRejectReason).toBe(false);
  });

  it("已發料為終態", () => {
    expect(reqStatusViewMap.Issued.isTerminal).toBe(true);
    expect(reqStatusViewMap.Approved.isTerminal).toBe(false);
  });
});
