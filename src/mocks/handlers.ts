import { http, HttpResponse } from "msw";
import type { PoStatus } from "@/domains/procurement/model/po.model";
import type { MaterialFormValues } from "@/domains/material/model/material.model";
import { getDemoUserId } from "./demo-user";
import { poDb, toDetailDto, USERS } from "./data";
import { materialDb, nextMaterialId } from "./material-data";

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
];
