import type { MaterialDetail } from "@/domains/material/model/material.model";

/**
 * 物料主檔 in-memory 資料庫。
 * 注意：inventory 看板的讀模型、requisition 的可用量查詢都從這份資料派生
 * ——假資料維持單一來源，改一處全連動（見 docs/需求變動痛點與對策.md 二）。
 */
export const materialDb: MaterialDetail[] = [
  { id: "mat-001", sku: "FAB-COT-320", name: "精梳棉 320g", category: "Fabric", unit: "碼", safetyStock: 500, stdCost: 88, spec: "門幅 150cm、成分 100% 棉", updatedAt: "2026-06-18" },
  { id: "mat-002", sku: "FAB-COT-260", name: "精梳棉 260g", category: "Fabric", unit: "碼", safetyStock: 400, stdCost: 76, spec: "門幅 150cm、成分 100% 棉", updatedAt: "2026-06-20" },
  { id: "mat-003", sku: "FAB-PLY-180", name: "聚酯纖維 180g", category: "Fabric", unit: "碼", safetyStock: 400, stdCost: 62, spec: "門幅 160cm", updatedAt: "2026-06-22" },
  { id: "mat-004", sku: "FAB-DNM-420", name: "牛仔布 420g", category: "Fabric", unit: "碼", safetyStock: 300, stdCost: 120, updatedAt: "2026-06-10" },
  { id: "mat-005", sku: "ACC-BTN-014", name: "四孔樹脂鈕扣 14mm", category: "Accessory", unit: "個", safetyStock: 5000, stdCost: 1.2, updatedAt: "2026-06-25" },
  { id: "mat-006", sku: "ACC-ZIP-020", name: "尼龍拉鍊 20cm", category: "Accessory", unit: "條", safetyStock: 2000, stdCost: 6.5, updatedAt: "2026-06-26" },
  { id: "mat-007", sku: "ACC-LBL-001", name: "織標主嘜", category: "Accessory", unit: "片", safetyStock: 8000, stdCost: 0.8, updatedAt: "2026-06-15" },
  { id: "mat-008", sku: "ACC-THR-604", name: "縫紉線 604 白", category: "Accessory", unit: "捲", safetyStock: 600, stdCost: 18, updatedAt: "2026-06-28" },
  { id: "mat-009", sku: "PKG-BAG-001", name: "OPP 自黏袋", category: "Packaging", unit: "個", safetyStock: 10000, stdCost: 0.5, updatedAt: "2026-06-12" },
  { id: "mat-010", sku: "PKG-BOX-005", name: "五層瓦楞外箱", category: "Packaging", unit: "個", safetyStock: 800, stdCost: 22, updatedAt: "2026-06-24" },
  { id: "mat-011", sku: "PKG-TAG-002", name: "吊牌（含膠針）", category: "Packaging", unit: "組", safetyStock: 6000, stdCost: 1.5, updatedAt: "2026-06-29" },
  { id: "mat-012", sku: "FAB-LIN-240", name: "亞麻混紡 240g", category: "Fabric", unit: "碼", safetyStock: 250, stdCost: 145, updatedAt: "2026-07-01" },
];

let nextId = materialDb.length + 1;

export function nextMaterialId(): string {
  return `mat-${String(nextId++).padStart(3, "0")}`;
}
