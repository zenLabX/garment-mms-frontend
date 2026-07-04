import { describe, expect, it } from "vitest";
import { MATERIAL_CATEGORIES, materialCategoryViewMap, materialFormSchema } from "./material.model";

const validValues = {
  sku: "FAB-COT-320",
  name: "精梳棉 320g",
  category: "Fabric",
  unit: "碼",
  safetyStock: 500,
  stdCost: 88,
};

describe("materialFormSchema（API 邊界驗證）", () => {
  it("合法輸入通過", () => {
    expect(materialFormSchema.safeParse(validValues).success).toBe(true);
  });

  it("料號格式須為 XXX-XXX-000", () => {
    expect(materialFormSchema.safeParse({ ...validValues, sku: "fab-cot-320" }).success).toBe(false);
    expect(materialFormSchema.safeParse({ ...validValues, sku: "FABCOT320" }).success).toBe(false);
    expect(materialFormSchema.safeParse({ ...validValues, sku: "FAB-COT-3200" }).success).toBe(false);
  });

  it("安全庫存不可為負、須為整數", () => {
    expect(materialFormSchema.safeParse({ ...validValues, safetyStock: -1 }).success).toBe(false);
    expect(materialFormSchema.safeParse({ ...validValues, safetyStock: 10.5 }).success).toBe(false);
  });

  it("分類僅接受清單內的值", () => {
    expect(materialFormSchema.safeParse({ ...validValues, category: "Unknown" }).success).toBe(false);
  });
});

describe("materialCategoryViewMap（分類 → 畫面對照表）", () => {
  it("每個分類都有對照（Record 型別已在編譯期保證，這裡驗 label 非空）", () => {
    for (const category of MATERIAL_CATEGORIES) {
      expect(materialCategoryViewMap[category].label).toBeTruthy();
    }
  });
});
