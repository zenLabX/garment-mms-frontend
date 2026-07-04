import { z } from "zod";
import type { StatusTagMeta } from "@/domains/shared/components/status-tag";

/*
 * 骨架階段手寫型別；接通中台後改為 re-export
 * `@/domains/shared/api/generated/schema` 的 DTO（npm run gen:api）。
 */

export type PoStatus = "Draft" | "PendingApproval" | "Rejected" | "PendingReview" | "Approved" | "Closed";

export interface PoStatusHistoryEntry {
  status: PoStatus;
  by: string;
  at: string;
  reason?: string;
}

export interface PoItem {
  sku: string;
  name: string;
  color: string;
  qty: number;
  unit: string;
  unitPrice: number;
  leadTimeDays: number;
  riskFlag: "OnTime" | "Delayed";
}

/** 能力旗標：由中台的 Aggregate 計算（如 po.CanApprove(user)），前端只讀不推導 */
export interface PoCapabilities {
  canEdit: boolean;
  canWithdraw: boolean;
  canApprove: boolean;
  canReject: boolean;
}

export interface PoListItem {
  id: string;
  poNo: string;
  supplier: string;
  totalAmount: number;
  status: PoStatus;
  updatedAt: string;
}

export interface PoDetail extends PoListItem, PoCapabilities {
  items: PoItem[];
  statusHistory: PoStatusHistoryEntry[];
  /** 他人處理中鎖定（未來由 SignalR 推播寫入） */
  lockedBy?: string;
  readModels: {
    stockTrend: { dates: string[]; onHand: number[]; safetyStock: number; belowSafety: boolean };
    budget: { orderAmount: number; monthlyRemaining: number; overBudget: boolean };
  };
}

export const rejectFormSchema = z.object({
  reason: z.string().min(1, "退回原因必填").max(200, "退回原因請勿超過 200 字"),
});
export type RejectFormValues = z.infer<typeof rejectFormSchema>;

/**
 * 「狀態 → 畫面行為」對照表（需求.md §3-2 的程式化）。
 * 元件只查表渲染，不寫 if 業務規則；「能不能按」另讀 DTO 能力旗標。
 */
export interface PoStatusView {
  tag: StatusTagMeta;
  itemsEditable: boolean;
  showRejectReason: boolean;
  isTerminal: boolean;
}

export const poStatusViewMap: Record<PoStatus, PoStatusView> = {
  Draft: { tag: { label: "草稿", color: "default" }, itemsEditable: true, showRejectReason: false, isTerminal: false },
  PendingApproval: { tag: { label: "待簽核", color: "processing" }, itemsEditable: false, showRejectReason: false, isTerminal: false },
  Rejected: { tag: { label: "已退回", color: "error" }, itemsEditable: true, showRejectReason: true, isTerminal: false },
  PendingReview: { tag: { label: "待複核", color: "processing" }, itemsEditable: false, showRejectReason: true, isTerminal: false },
  Approved: { tag: { label: "已核准", color: "success" }, itemsEditable: false, showRejectReason: false, isTerminal: true },
  Closed: { tag: { label: "已結案", color: "default" }, itemsEditable: false, showRejectReason: false, isTerminal: true },
};
