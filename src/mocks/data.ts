import type { CurrentUser } from "@/domains/identity/model/identity.model";
import type { PoCapabilities, PoDetail, PoStatus } from "@/domains/procurement/model/po.model";
import type { DemoUserId } from "./demo-user";

/**
 * 離線示範用 in-memory 資料庫（取材自 docs/需求.md §3-1 的情境）。
 * 能力旗標計算在這裡「模擬中台 Aggregate」——真實系統中這段邏輯在後端，前端永遠只讀旗標。
 */

export const USERS: Record<DemoUserId, CurrentUser> = {
  amy: { id: "amy", name: "Amy", roleLabel: "採購員" },
  lisa: {
    id: "lisa",
    name: "Lisa",
    roleLabel: "副理",
    actingFor: { id: "ken", name: "Ken（課長）", reason: "Ken 休假 6/30–7/4" },
  },
  wanda: { id: "wanda", name: "Wanda", roleLabel: "倉管" },
};

type PoRecord = Omit<PoDetail, keyof PoCapabilities>;

const trendDates = Array.from({ length: 12 }, (_, i) => `${4 + Math.floor(i / 4)}/${(i % 4) * 7 + 1}`);

export const poDb: PoRecord[] = [
  {
    id: "po-871",
    poNo: "PO-2026-00871",
    supplier: "宏遠興業",
    totalAmount: 176_000,
    status: "PendingReview",
    updatedAt: "2026-06-30",
    items: [
      { sku: "FAB-COT-320", name: "精梳棉 320g", color: "藏青", qty: 1200, unit: "碼", unitPrice: 88, leadTimeDays: 21, riskFlag: "OnTime" },
      { sku: "FAB-COT-320", name: "精梳棉 320g", color: "米白", qty: 800, unit: "碼", unitPrice: 88, leadTimeDays: 35, riskFlag: "Delayed" },
    ],
    statusHistory: [
      { status: "Draft", by: "Amy（採購員）", at: "2026-06-28T09:12" },
      { status: "PendingApproval", by: "Amy（採購員）", at: "2026-06-28T09:40" },
      { status: "Rejected", by: "Ken（課長）", at: "2026-06-29T14:05", reason: "供應商交期超過生產排程，請改單或換供應商" },
      { status: "PendingReview", by: "Amy（採購員）", at: "2026-06-30T10:22" },
    ],
    readModels: {
      stockTrend: {
        dates: trendDates,
        onHand: [980, 920, 860, 790, 700, 640, 560, 480, 410, 350, 290, 240],
        safetyStock: 500,
        belowSafety: true,
      },
      budget: { orderAmount: 176_000, monthlyRemaining: 90_000, overBudget: true },
    },
  },
  {
    id: "po-872",
    poNo: "PO-2026-00872",
    supplier: "聚陽紡織",
    totalAmount: 45_600,
    status: "Draft",
    updatedAt: "2026-07-02",
    items: [
      { sku: "FAB-PLY-180", name: "聚酯纖維 180g", color: "黑", qty: 600, unit: "碼", unitPrice: 76, leadTimeDays: 14, riskFlag: "OnTime" },
    ],
    statusHistory: [{ status: "Draft", by: "Amy（採購員）", at: "2026-07-02T11:00" }],
    readModels: {
      stockTrend: { dates: trendDates, onHand: [820, 810, 800, 780, 790, 770, 760, 750, 740, 760, 750, 745], safetyStock: 400, belowSafety: false },
      budget: { orderAmount: 45_600, monthlyRemaining: 90_000, overBudget: false },
    },
  },
  {
    id: "po-870",
    poNo: "PO-2026-00870",
    supplier: "宏遠興業",
    totalAmount: 132_000,
    status: "Approved",
    updatedAt: "2026-06-25",
    items: [
      { sku: "FAB-COT-260", name: "精梳棉 260g", color: "白", qty: 1500, unit: "碼", unitPrice: 88, leadTimeDays: 18, riskFlag: "OnTime" },
    ],
    statusHistory: [
      { status: "Draft", by: "Amy（採購員）", at: "2026-06-20T10:00" },
      { status: "PendingApproval", by: "Amy（採購員）", at: "2026-06-20T14:00" },
      { status: "Approved", by: "Ken（課長）", at: "2026-06-25T09:30" },
    ],
    readModels: {
      stockTrend: { dates: trendDates, onHand: [300, 350, 420, 500, 620, 700, 780, 850, 900, 950, 1000, 1100], safetyStock: 400, belowSafety: false },
      budget: { orderAmount: 132_000, monthlyRemaining: 266_000, overBudget: false },
    },
  },
];

const APPROVABLE: PoStatus[] = ["PendingApproval", "PendingReview"];

/** 模擬中台 Aggregate 的 CanXxx(user)：狀態 × 角色 × 代理關係一起判斷 */
export function computeCapabilities(po: PoRecord, userId: DemoUserId): PoCapabilities {
  const isCreator = userId === "amy"; // 示範資料中所有單據皆 Amy 建立
  const isApprover = userId === "lisa"; // Lisa 代理 Ken 簽核
  return {
    canEdit: isCreator && (po.status === "Draft" || po.status === "Rejected"),
    canWithdraw: isCreator && APPROVABLE.includes(po.status),
    canApprove: isApprover && APPROVABLE.includes(po.status),
    canReject: isApprover && APPROVABLE.includes(po.status),
  };
}

export function toDetailDto(po: PoRecord, userId: DemoUserId): PoDetail {
  return { ...po, ...computeCapabilities(po, userId) };
}
