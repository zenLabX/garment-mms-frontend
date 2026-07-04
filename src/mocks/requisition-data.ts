import type {
  ReqCapabilities,
  ReqDetail,
  ReqStatus,
} from "@/domains/requisition/model/requisition.model";
import type { DemoUserId } from "./demo-user";

/**
 * 領料申請 in-memory 資料庫。
 * 能力旗標計算「模擬中台 Aggregate」——真實系統中這段邏輯在後端，前端永遠只讀旗標。
 */

type ReqRecord = Omit<ReqDetail, keyof ReqCapabilities>;

export const reqDb: ReqRecord[] = [
  {
    id: "req-501",
    reqNo: "REQ-2026-00501",
    department: "裁剪課",
    purpose: "訂單 #A-1018 裁剪用料（草稿）",
    neededDate: "2026-07-15",
    status: "Draft",
    updatedAt: "2026-07-02",
    lines: [{ sku: "FAB-PLY-180", name: "聚酯纖維 180g", unit: "碼", qty: 200 }],
    statusHistory: [{ status: "Draft", by: "Amy（採購員）", at: "2026-07-02T09:00" }],
  },
  {
    id: "req-502",
    reqNo: "REQ-2026-00502",
    department: "裁剪課",
    purpose: "訂單 #A-1020 裁剪用料",
    neededDate: "2026-07-10",
    status: "PendingApproval",
    updatedAt: "2026-07-03",
    lines: [
      { sku: "FAB-COT-320", name: "精梳棉 320g", unit: "碼", qty: 150 },
      { sku: "ACC-THR-604", name: "縫紉線 604 白", unit: "捲", qty: 40 },
    ],
    statusHistory: [
      { status: "Draft", by: "Amy（採購員）", at: "2026-07-03T10:00" },
      { status: "PendingApproval", by: "Amy（採購員）", at: "2026-07-03T10:12" },
    ],
  },
  {
    id: "req-503",
    reqNo: "REQ-2026-00503",
    department: "樣品室",
    purpose: "開發款樣衣",
    neededDate: "2026-07-08",
    status: "Rejected",
    updatedAt: "2026-07-01",
    lines: [{ sku: "FAB-LIN-240", name: "亞麻混紡 240g", unit: "碼", qty: 60 }],
    statusHistory: [
      { status: "Draft", by: "Amy（採購員）", at: "2026-06-30T15:00" },
      { status: "PendingApproval", by: "Amy（採購員）", at: "2026-06-30T15:05" },
      { status: "Rejected", by: "Lisa（代理 Ken（課長））", at: "2026-07-01T09:40", reason: "請補開發單號後重送" },
    ],
  },
  {
    id: "req-504",
    reqNo: "REQ-2026-00504",
    department: "車縫課",
    purpose: "訂單 #A-1015 車縫輔料",
    neededDate: "2026-07-06",
    status: "Approved",
    updatedAt: "2026-07-02",
    lines: [
      { sku: "ACC-ZIP-020", name: "尼龍拉鍊 20cm", unit: "條", qty: 500 },
      { sku: "ACC-BTN-014", name: "四孔樹脂鈕扣 14mm", unit: "個", qty: 2000 },
    ],
    statusHistory: [
      { status: "Draft", by: "Amy（採購員）", at: "2026-07-01T11:00" },
      { status: "PendingApproval", by: "Amy（採購員）", at: "2026-07-01T11:20" },
      { status: "Approved", by: "Lisa（代理 Ken（課長））", at: "2026-07-02T08:50" },
    ],
  },
  {
    id: "req-505",
    reqNo: "REQ-2026-00505",
    department: "整燙包裝課",
    purpose: "訂單 #A-1012 包裝出貨",
    neededDate: "2026-06-28",
    status: "Issued",
    updatedAt: "2026-06-27",
    lines: [
      { sku: "PKG-BAG-001", name: "OPP 自黏袋", unit: "個", qty: 3000 },
      { sku: "PKG-TAG-002", name: "吊牌（含膠針）", unit: "組", qty: 3000 },
    ],
    statusHistory: [
      { status: "Draft", by: "Amy（採購員）", at: "2026-06-25T14:00" },
      { status: "PendingApproval", by: "Amy（採購員）", at: "2026-06-25T14:10" },
      { status: "Approved", by: "Lisa（代理 Ken（課長））", at: "2026-06-26T09:00" },
      { status: "Issued", by: "Wanda（倉管）", at: "2026-06-27T10:30" },
    ],
  },
];

let nextReqNo = 506;

export function nextReqIdentity(): { id: string; reqNo: string } {
  const seq = String(nextReqNo++).padStart(5, "0");
  return { id: `req-${seq}`, reqNo: `REQ-2026-${seq}` };
}

const APPROVABLE: ReqStatus[] = ["PendingApproval"];

/** 模擬中台 Aggregate 的 CanXxx(user)：狀態 × 角色一起判斷 */
export function computeReqCapabilities(req: ReqRecord, userId: DemoUserId): ReqCapabilities {
  const isCreator = userId === "amy"; // 示範資料中所有單據皆 Amy 建立
  const isApprover = userId === "lisa"; // Lisa 代理 Ken 簽核
  const isWarehouse = userId === "wanda"; // Wanda 倉管負責發料
  return {
    canWithdraw: isCreator && APPROVABLE.includes(req.status),
    canApprove: isApprover && APPROVABLE.includes(req.status),
    canReject: isApprover && APPROVABLE.includes(req.status),
    canIssue: isWarehouse && req.status === "Approved",
  };
}

export function toReqDetailDto(req: ReqRecord, userId: DemoUserId): ReqDetail {
  return { ...req, ...computeReqCapabilities(req, userId) };
}
