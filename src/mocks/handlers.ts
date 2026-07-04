import { http, HttpResponse } from "msw";
import type { PoStatus } from "@/domains/procurement/model/po.model";
import type { MaterialCategory, MaterialFormValues } from "@/domains/material/model/material.model";
import type { ReqDraftValues, ReqStatus } from "@/domains/requisition/model/requisition.model";
import { getDemoUserId } from "./demo-user";
import { poDb, toDetailDto, USERS } from "./data";
import { materialDb, nextMaterialId } from "./material-data";
import {
  adjustOnHand,
  computeAvailability,
  computeCategoryStock,
  computeInboundTrend,
  computeLowStock,
  computeSummary,
} from "./inventory-data";
import { nextReqIdentity, reqDb, toReqDetailDto } from "./requisition-data";

const API = "/api";

function pushStatus(poId: string, status: PoStatus, reason?: string) {
  const po = poDb.find((p) => p.id === poId);
  if (!po) return null;
  const user = USERS[getDemoUserId()];
  const byLabel = user.actingFor ? `${user.name}（代理 ${user.actingFor.name}）` : `${user.name}（${user.roleLabel}）`;
  po.status = status;
  po.updatedAt = new Date().toISOString().slice(0, 10);
  po.statusHistory.push({ status, by: byLabel, at: new Date().toISOString(), reason });
  return po;
}

export const handlers = [
  http.get(`${API}/identity/me`, () => HttpResponse.json(USERS[getDemoUserId()])),

  // 伺服器驅動選單：中台依使用者權限回傳可視清單
  http.get(`${API}/identity/menu`, () =>
    HttpResponse.json([
      { key: "/procurement/pos", label: "採購管理" },
      { key: "/material/materials", label: "物料主檔" },
      { key: "/requisition/requisitions", label: "領料申請" },
      { key: "/inventory/dashboard", label: "庫存看板" },
    ]),
  ),

  // 伺服器端分頁 + 篩選（前端禁止抓全量自己過濾）
  http.get(`${API}/pos`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
    const status = url.searchParams.get("status");

    const filtered = status ? poDb.filter((p) => p.status === status) : poDb;
    const items = filtered
      .slice((page - 1) * pageSize, page * pageSize)
      .map(({ id, poNo, supplier, totalAmount, status: s, updatedAt }) => ({ id, poNo, supplier, totalAmount, status: s, updatedAt }));
    return HttpResponse.json({ items, total: filtered.length });
  }),

  http.get(`${API}/pos/:id`, ({ params }) => {
    const po = poDb.find((p) => p.id === params.id);
    if (!po) return HttpResponse.json({ message: "查無此採購單" }, { status: 404 });
    return HttpResponse.json(toDetailDto(po, getDemoUserId()));
  }),

  http.post(`${API}/pos/:id/approve`, ({ params }) => {
    const po = pushStatus(String(params.id), "Approved");
    return po ? HttpResponse.json(toDetailDto(po, getDemoUserId())) : HttpResponse.json({ message: "查無此採購單" }, { status: 404 });
  }),

  http.post(`${API}/pos/:id/reject`, async ({ params, request }) => {
    const body = (await request.json()) as { reason?: string };
    if (!body?.reason) return HttpResponse.json({ message: "退回原因必填" }, { status: 400 });
    const po = pushStatus(String(params.id), "Rejected", body.reason);
    return po ? HttpResponse.json(toDetailDto(po, getDemoUserId())) : HttpResponse.json({ message: "查無此採購單" }, { status: 404 });
  }),

  http.post(`${API}/pos/:id/withdraw`, ({ params }) => {
    const po = pushStatus(String(params.id), "Draft");
    return po ? HttpResponse.json(toDetailDto(po, getDemoUserId())) : HttpResponse.json({ message: "查無此採購單" }, { status: 404 });
  }),

  // ── material：物料主檔 ────────────────────────────────────────────────

  http.get(`${API}/materials`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
    const keyword = url.searchParams.get("keyword")?.toLowerCase();

    const filtered = keyword
      ? materialDb.filter((m) => m.sku.toLowerCase().includes(keyword) || m.name.toLowerCase().includes(keyword))
      : materialDb;
    const items = filtered.slice((page - 1) * pageSize, page * pageSize);
    return HttpResponse.json({ items, total: filtered.length });
  }),

  http.get(`${API}/materials/:id`, ({ params }) => {
    const material = materialDb.find((m) => m.id === params.id);
    if (!material) return HttpResponse.json({ message: "查無此物料" }, { status: 404 });
    return HttpResponse.json(material);
  }),

  http.post(`${API}/materials`, async ({ request }) => {
    const body = (await request.json()) as MaterialFormValues;
    if (materialDb.some((m) => m.sku === body.sku)) {
      return HttpResponse.json({ message: `料號 ${body.sku} 已存在` }, { status: 400 });
    }
    const created = { id: nextMaterialId(), ...body, updatedAt: new Date().toISOString().slice(0, 10) };
    materialDb.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.put(`${API}/materials/:id`, async ({ params, request }) => {
    const material = materialDb.find((m) => m.id === params.id);
    if (!material) return HttpResponse.json({ message: "查無此物料" }, { status: 404 });
    const body = (await request.json()) as MaterialFormValues;
    Object.assign(material, body, { updatedAt: new Date().toISOString().slice(0, 10) });
    return HttpResponse.json(material);
  }),

  // ── inventory：可用量（requisition 建單的依賴查詢） ─────────────────────

  http.get(`${API}/inventory/availability`, ({ request }) => {
    const sku = new URL(request.url).searchParams.get("sku");
    if (!sku) return HttpResponse.json({ message: "缺少 sku" }, { status: 400 });
    return HttpResponse.json(computeAvailability(sku));
  }),

  // ── inventory：看板讀模型（皆吃 warehouse / category 篩選） ─────────────

  http.get(`${API}/inventory/summary`, ({ request }) =>
    HttpResponse.json(computeSummary(dashboardFilter(request.url))),
  ),

  http.get(`${API}/inventory/by-category`, ({ request }) =>
    HttpResponse.json(computeCategoryStock(dashboardFilter(request.url))),
  ),

  http.get(`${API}/inventory/low-stock`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 5);
    return HttpResponse.json(computeLowStock(dashboardFilter(request.url), page, pageSize));
  }),

  http.get(`${API}/inventory/inbound-trend`, ({ request }) =>
    HttpResponse.json(computeInboundTrend(dashboardFilter(request.url))),
  ),

  // ── requisition：領料申請 ────────────────────────────────────────────

  http.get(`${API}/requisitions`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
    const status = url.searchParams.get("status");

    const filtered = status ? reqDb.filter((r) => r.status === status) : reqDb;
    const items = filtered
      .slice((page - 1) * pageSize, page * pageSize)
      .map(({ id, reqNo, department, purpose, neededDate, status: s, updatedAt }) => ({
        id, reqNo, department, purpose, neededDate, status: s, updatedAt,
      }));
    return HttpResponse.json({ items, total: filtered.length });
  }),

  http.get(`${API}/requisitions/:id`, ({ params }) => {
    const req = reqDb.find((r) => r.id === params.id);
    if (!req) return HttpResponse.json({ message: "查無此領料單" }, { status: 404 });
    return HttpResponse.json(toReqDetailDto(req, getDemoUserId()));
  }),

  // 超領檢查在「中台」：庫存不足回 422，前端不寫這條規則
  http.post(`${API}/requisitions`, async ({ request }) => {
    const body = (await request.json()) as ReqDraftValues;
    for (const line of body.lines) {
      const { available } = computeAvailability(line.sku);
      if (line.qty > available) {
        return HttpResponse.json(
          { message: `${line.sku} 庫存不足（可用 ${available}，申請 ${line.qty}）` },
          { status: 422 },
        );
      }
    }
    const user = USERS[getDemoUserId()];
    const byLabel = `${user.name}（${user.roleLabel}）`;
    const now = new Date().toISOString();
    const created = {
      ...nextReqIdentity(),
      ...body.header,
      status: "PendingApproval" as ReqStatus,
      updatedAt: now.slice(0, 10),
      lines: body.lines,
      statusHistory: [
        { status: "Draft" as ReqStatus, by: byLabel, at: now },
        { status: "PendingApproval" as ReqStatus, by: byLabel, at: now },
      ],
    };
    reqDb.push(created);
    return HttpResponse.json(toReqDetailDto(created, getDemoUserId()), { status: 201 });
  }),

  http.post(`${API}/requisitions/:id/approve`, ({ params }) =>
    reqAction(String(params.id), "Approved"),
  ),

  http.post(`${API}/requisitions/:id/reject`, async ({ params, request }) => {
    const body = (await request.json()) as { reason?: string };
    if (!body?.reason) return HttpResponse.json({ message: "退回原因必填" }, { status: 400 });
    return reqAction(String(params.id), "Rejected", body.reason);
  }),

  http.post(`${API}/requisitions/:id/withdraw`, ({ params }) =>
    reqAction(String(params.id), "Draft"),
  ),

  // 發料：扣減在庫量（Approved → Issued 後占用同步解除）
  http.post(`${API}/requisitions/:id/issue`, ({ params }) => {
    const req = reqDb.find((r) => r.id === params.id);
    if (!req) return HttpResponse.json({ message: "查無此領料單" }, { status: 404 });
    for (const line of req.lines) adjustOnHand(line.sku, -line.qty);
    return reqAction(String(params.id), "Issued");
  }),
];

function dashboardFilter(requestUrl: string) {
  const url = new URL(requestUrl);
  return {
    warehouse: url.searchParams.get("warehouse") ?? undefined,
    category: (url.searchParams.get("category") ?? undefined) as MaterialCategory | undefined,
  };
}

function reqAction(reqId: string, status: ReqStatus, reason?: string) {
  const req = reqDb.find((r) => r.id === reqId);
  if (!req) return HttpResponse.json({ message: "查無此領料單" }, { status: 404 });
  const user = USERS[getDemoUserId()];
  const byLabel = user.actingFor ? `${user.name}（代理 ${user.actingFor.name}）` : `${user.name}（${user.roleLabel}）`;
  req.status = status;
  req.updatedAt = new Date().toISOString().slice(0, 10);
  req.statusHistory.push({ status, by: byLabel, at: new Date().toISOString(), reason });
  return HttpResponse.json(toReqDetailDto(req, getDemoUserId()));
}
