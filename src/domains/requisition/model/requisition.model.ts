import { z } from "zod";
import type { StatusTagMeta } from "@/domains/shared/components/status-tag";

/*
 * 骨架階段手寫型別；接通中台後改為 re-export
 * `@/domains/shared/api/generated/schema` 的 DTO（npm run gen:api）。
 */

export type ReqStatus = "Draft" | "PendingApproval" | "Rejected" | "Approved" | "Issued";

export interface ReqStatusHistoryEntry {
  status: ReqStatus;
  by: string;
  at: string;
  reason?: string;
}

/** 能力旗標：由中台的 Aggregate 計算，前端只讀不推導 */
export interface ReqCapabilities {
  canWithdraw: boolean;
  canApprove: boolean;
  canReject: boolean;
  /** 倉管對已核准單發料 */
  canIssue: boolean;
}

export interface ReqListItem {
  id: string;
  reqNo: string;
  department: string;
  purpose: string;
  neededDate: string;
  status: ReqStatus;
  updatedAt: string;
}

export interface ReqLine {
  sku: string;
  name: string;
  unit: string;
  qty: number;
}

export interface ReqDetail extends ReqListItem, ReqCapabilities {
  lines: ReqLine[];
  statusHistory: ReqStatusHistoryEntry[];
}

/**
 * 「狀態 → 畫面行為」對照表：元件只查表渲染，不寫 if 業務規則；
 * 「能不能按」另讀 DTO 能力旗標。
 */
export interface ReqStatusView {
  tag: StatusTagMeta;
  showRejectReason: boolean;
  isTerminal: boolean;
}

export const reqStatusViewMap: Record<ReqStatus, ReqStatusView> = {
  Draft: { tag: { label: "草稿", color: "default" }, showRejectReason: false, isTerminal: false },
  PendingApproval: { tag: { label: "待核准", color: "processing" }, showRejectReason: false, isTerminal: false },
  Rejected: { tag: { label: "已退回", color: "error" }, showRejectReason: true, isTerminal: false },
  Approved: { tag: { label: "已核准（待發料）", color: "warning" }, showRejectReason: false, isTerminal: false },
  Issued: { tag: { label: "已發料", color: "success" }, showRejectReason: false, isTerminal: true },
};

/*
 * 多步驟表單的 zod：拆表頭 / 明細兩張子 schema 供 Steps 逐步驗證，
 * 送出前再用 reqDraftSchema 驗整包——三份 schema 同源，加欄位改一處。
 */
export const reqHeaderSchema = z.object({
  department: z.string().min(1, "請選擇領用部門"),
  purpose: z.string().min(1, "用途說明必填").max(100, "用途說明請勿超過 100 字"),
  neededDate: z.string().min(1, "需求日期必填"),
});
export type ReqHeaderDraft = z.infer<typeof reqHeaderSchema>;

export const reqLineSchema = z.object({
  sku: z.string().min(1),
  name: z.string(),
  unit: z.string(),
  qty: z.number().int("數量須為整數").positive("數量須大於 0"),
});
export type ReqLineDraft = z.infer<typeof reqLineSchema>;

export const reqDraftSchema = z.object({
  header: reqHeaderSchema,
  lines: z.array(reqLineSchema).min(1, "至少需要一筆領料明細"),
});
export type ReqDraftValues = z.infer<typeof reqDraftSchema>;

export const reqRejectFormSchema = z.object({
  reason: z.string().min(1, "退回原因必填").max(200, "退回原因請勿超過 200 字"),
});
export type ReqRejectFormValues = z.infer<typeof reqRejectFormSchema>;

/** 領用部門選項（示範用；真實系統由中台主檔提供） */
export const DEPARTMENTS = ["裁剪課", "車縫課", "整燙包裝課", "樣品室"] as const;
