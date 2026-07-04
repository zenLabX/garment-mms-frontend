import type { InventoryDashboardFilter, StockAvailability } from "@/domains/inventory/api/inventory.api";
import type {
  CategoryStockRow,
  InboundTrendPoint,
  InventorySummary,
  LowStockItem,
  StockLevel,
} from "@/domains/inventory/model/inventory.model";
import type { MaterialDetail } from "@/domains/material/model/material.model";
import { materialCategoryViewMap, MATERIAL_CATEGORIES } from "@/domains/material/model/material.model";
import { materialDb } from "./material-data";
import { poDb } from "./data";
import { reqDb } from "./requisition-data";

/**
 * 庫存讀模型「模擬中台的投影」：不自己維護一份靜態數字，
 * 而是從 materialDb / reqDb（/ poDb）派生——所以核准、發料會真的改變看板數字，
 * 跨 domain invalidation 的 demo 才有肉眼可見的效果。
 */

/** 在庫量（可變狀態）：初始值 = 安全庫存 × 係數，發料時扣減 */
const onHandBySku = new Map<string, number>();

const INITIAL_FACTORS = [0.45, 1.6, 2.1, 0.8, 3.2, 1.4, 0.6, 2.4, 3.5, 1.2, 0.35, 1.8];

export function getOnHand(sku: string): number {
  if (!onHandBySku.has(sku)) {
    const index = materialDb.findIndex((m) => m.sku === sku);
    const material = materialDb[index];
    const factor = INITIAL_FACTORS[index] ?? 2;
    onHandBySku.set(sku, material ? Math.round(material.safetyStock * factor) : 0);
  }
  return onHandBySku.get(sku) ?? 0;
}

export function adjustOnHand(sku: string, delta: number) {
  onHandBySku.set(sku, Math.max(0, getOnHand(sku) + delta));
}

/** 已占用 = 待核准 / 已核准（未發料）領料單的明細加總 */
export function getReserved(sku: string): number {
  return reqDb
    .filter((r) => r.status === "PendingApproval" || r.status === "Approved")
    .flatMap((r) => r.lines)
    .filter((l) => l.sku === sku)
    .reduce((sum, l) => sum + l.qty, 0);
}

export function computeAvailability(sku: string): StockAvailability {
  const onHand = getOnHand(sku);
  const reserved = getReserved(sku);
  return { sku, onHand, reserved, available: onHand - reserved };
}

// ── 看板讀模型（模擬中台投影，全部從交易資料派生） ─────────────────────────

/** 倉別派生規則：布料進主料倉，其餘進副料倉 */
function warehouseOf(material: MaterialDetail): string {
  return material.category === "Fabric" ? "W1" : "W2";
}

function filteredMaterials({ warehouse, category }: InventoryDashboardFilter): MaterialDetail[] {
  return materialDb.filter(
    (m) => (!warehouse || warehouseOf(m) === warehouse) && (!category || m.category === category),
  );
}

/** 庫存分級（中台規則）：低於安全庫存一半 = 告急；低於安全庫存 = 偏低 */
function levelOf(material: MaterialDetail): StockLevel {
  const onHand = getOnHand(material.sku);
  if (onHand < material.safetyStock * 0.5) return "Critical";
  if (onHand < material.safetyStock) return "Warning";
  return "Healthy";
}

/** 在途量 = 已核准（未結案）採購單品項加總——所以「核准 PO」會真的改變看板數字 */
function getInTransit(sku: string): number {
  return poDb
    .filter((po) => po.status === "Approved")
    .flatMap((po) => po.items)
    .filter((item) => item.sku === sku)
    .reduce((sum, item) => sum + item.qty, 0);
}

export function computeSummary(filter: InventoryDashboardFilter): InventorySummary {
  const materials = filteredMaterials(filter);
  return {
    totalStockValue: Math.round(materials.reduce((sum, m) => sum + getOnHand(m.sku) * m.stdCost, 0)),
    lowStockCount: materials.filter((m) => levelOf(m) !== "Healthy").length,
    inTransitQty: materials.reduce((sum, m) => sum + getInTransit(m.sku), 0),
    pendingIssueCount: reqDb.filter((r) => r.status === "Approved").length,
  };
}

export function computeCategoryStock(filter: InventoryDashboardFilter): CategoryStockRow[] {
  return MATERIAL_CATEGORIES.filter((c) => !filter.category || c === filter.category).map((category) => {
    const materials = filteredMaterials(filter).filter((m) => m.category === category);
    return {
      category,
      categoryLabel: materialCategoryViewMap[category].label,
      onHandValue: Math.round(materials.reduce((sum, m) => sum + getOnHand(m.sku) * m.stdCost, 0)),
      inTransitValue: Math.round(materials.reduce((sum, m) => sum + getInTransit(m.sku) * m.stdCost, 0)),
    };
  });
}

const LEVEL_ORDER: Record<StockLevel, number> = { Critical: 0, Warning: 1, Healthy: 2 };

export function computeLowStock(
  filter: InventoryDashboardFilter,
  page: number,
  pageSize: number,
): { items: LowStockItem[]; total: number } {
  const rows = filteredMaterials(filter)
    .map((m) => ({
      id: m.id,
      sku: m.sku,
      name: m.name,
      unit: m.unit,
      onHand: getOnHand(m.sku),
      reserved: getReserved(m.sku),
      safetyStock: m.safetyStock,
      level: levelOf(m),
    }))
    .filter((row) => row.level !== "Healthy")
    .sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
  return { items: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length };
}

/** 近 12 週趨勢：確定性假數列（以篩選後物料的安全庫存量級為基底），最後一週反映實際發料 */
export function computeInboundTrend(filter: InventoryDashboardFilter): InboundTrendPoint[] {
  const materials = filteredMaterials(filter);
  const base = Math.max(50, Math.round(materials.reduce((sum, m) => sum + m.safetyStock, 0) / 20));
  const issuedTotal = reqDb
    .filter((r) => r.status === "Issued")
    .flatMap((r) => r.lines)
    .filter((l) => materials.some((m) => m.sku === l.sku))
    .reduce((sum, l) => sum + l.qty, 0);

  return Array.from({ length: 12 }, (_, i) => ({
    period: `W${i + 1}`,
    inbound: Math.round(base * (1 + 0.35 * Math.sin(i / 1.8))),
    issued:
      i === 11
        ? Math.round(base * 0.8) + issuedTotal // 最後一週疊上實際發料量 → 發料後圖會動
        : Math.round(base * (0.85 + 0.3 * Math.cos(i / 2.2))),
  }));
}
