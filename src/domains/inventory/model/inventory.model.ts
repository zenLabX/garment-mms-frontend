import type { StatusTagMeta } from "@/domains/shared/components/status-tag";
import type { MaterialCategory } from "@/domains/material/model/material.model";

/*
 * 骨架階段手寫型別；接通中台後改為 re-export
 * `@/domains/shared/api/generated/schema` 的 DTO（npm run gen:api）。
 *
 * 這個 domain 全是「讀模型」：數字（含庫存分級 level）由中台投影算好回傳，
 * 前端只查表上色，不自己算「低不低於安全庫存」。
 */

/** 庫存分級由中台計算後回傳，前端不重算 */
export type StockLevel = "Healthy" | "Warning" | "Critical";

export const stockLevelViewMap: Record<StockLevel, StatusTagMeta> = {
  Healthy: { label: "正常", color: "success" },
  Warning: { label: "偏低", color: "warning" },
  Critical: { label: "告急", color: "error" },
};

export interface InventorySummary {
  /** 在庫金額合計（onHand × 標準成本） */
  totalStockValue: number;
  /** 低於安全庫存的料號數 */
  lowStockCount: number;
  /** 在途採購量（已核准未結案 PO 的品項數量合計） */
  inTransitQty: number;
  /** 已核准待發料的領料單數 */
  pendingIssueCount: number;
}

export interface CategoryStockRow {
  category: MaterialCategory;
  categoryLabel: string;
  onHandValue: number;
  inTransitValue: number;
}

export interface InboundTrendPoint {
  period: string;
  inbound: number;
  issued: number;
}

export interface LowStockItem {
  id: string;
  sku: string;
  name: string;
  unit: string;
  onHand: number;
  reserved: number;
  safetyStock: number;
  level: StockLevel;
}

/** 倉別主檔（示範用；真實系統由中台主檔提供） */
export const WAREHOUSES = [
  { value: "W1", label: "W1 主料倉" },
  { value: "W2", label: "W2 副料倉" },
] as const;
