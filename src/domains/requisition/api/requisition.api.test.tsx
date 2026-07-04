import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { delay, http, HttpResponse } from "msw";
import { isAxiosError } from "axios";
import { server } from "@/mocks/server";
import { setDemoUserId } from "@/mocks/demo-user";
import type { ReqDetail } from "../model/requisition.model";
import {
  requisitionKeys,
  useCreateRequisition,
  useRequisitionDetail,
  useWithdrawRequisition,
} from "./requisition.api";

function createClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function wrapperFor(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const validDraft = {
  header: { department: "裁剪課", purpose: "測試用", neededDate: "2026-07-20" },
  lines: [{ sku: "FAB-COT-260", name: "精梳棉 260g", unit: "碼", qty: 10 }],
};

describe("requisition.api（msw 整合測試）", () => {
  it("建立者 Amy：待核准單可撤回、不可核准", async () => {
    setDemoUserId("amy");
    const { result } = renderHook(() => useRequisitionDetail("req-502"), { wrapper: wrapperFor(createClient()) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.canWithdraw).toBe(true);
    expect(result.current.data?.canApprove).toBe(false);
  });

  it("代理簽核者 Lisa：同一張單可核准 / 退回、不可撤回", async () => {
    setDemoUserId("lisa");
    const { result } = renderHook(() => useRequisitionDetail("req-502"), { wrapper: wrapperFor(createClient()) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.canApprove).toBe(true);
    expect(result.current.data?.canReject).toBe(true);
    expect(result.current.data?.canWithdraw).toBe(false);
  });

  it("倉管 Wanda：只對已核准單有發料能力", async () => {
    setDemoUserId("wanda");
    const wrapper = wrapperFor(createClient());
    const { result: approved } = renderHook(() => useRequisitionDetail("req-504"), { wrapper });
    const { result: pending } = renderHook(() => useRequisitionDetail("req-502"), { wrapper });
    await waitFor(() => expect(approved.current.isSuccess && pending.current.isSuccess).toBe(true));
    expect(approved.current.data?.canIssue).toBe(true);
    expect(pending.current.data?.canIssue).toBe(false);
    expect(pending.current.data?.canApprove).toBe(false);
  });

  it("超領由中台把關：庫存不足回 422（前端不寫這條規則）", async () => {
    setDemoUserId("amy");
    const { result } = renderHook(() => useCreateRequisition(), { wrapper: wrapperFor(createClient()) });
    await expect(
      result.current.mutateAsync({
        ...validDraft,
        lines: [{ sku: "FAB-COT-320", name: "精梳棉 320g", unit: "碼", qty: 99_999 }],
      }),
    ).rejects.toSatisfy((err) => isAxiosError(err) && err.response?.status === 422);
  });

  it("建單成功回 201，狀態為待核准", async () => {
    setDemoUserId("amy");
    const { result } = renderHook(() => useCreateRequisition(), { wrapper: wrapperFor(createClient()) });
    const created = await result.current.mutateAsync(validDraft);
    expect(created.status).toBe("PendingApproval");
    expect(created.reqNo).toMatch(/^REQ-2026-/);
  });

  it("撤回失敗時樂觀更新回滾（API 回 500 → 快取還原為撤回前狀態）", async () => {
    setDemoUserId("amy");
    server.use(
      http.post("/api/requisitions/:id/withdraw", () =>
        HttpResponse.json({ message: "伺服器忙碌" }, { status: 500 }),
      ),
    );
    const queryClient = createClient();
    const { result } = renderHook(
      () => ({ detail: useRequisitionDetail("req-502"), withdraw: useWithdrawRequisition("req-502") }),
      { wrapper: wrapperFor(queryClient) },
    );
    await waitFor(() => expect(result.current.detail.isSuccess).toBe(true));

    act(() => result.current.withdraw.mutate());
    await waitFor(() => expect(result.current.withdraw.isError).toBe(true));
    // onError 以快照回滾；隨後 onSettled invalidate 重抓的也是伺服器真實狀態
    expect(queryClient.getQueryData<ReqDetail>(requisitionKeys.detail("req-502"))?.status).toBe("PendingApproval");
  });

  it("撤回成功走樂觀更新：API 回應前快取已先變為草稿", async () => {
    setDemoUserId("amy");
    server.use(
      http.post("/api/requisitions/:id/withdraw", async () => {
        await delay(150); // 拉長回應時間，證明快取變更發生在回應之前
        return HttpResponse.json(null, { status: 500 }); // 內容不重要，此測試只看回應前的快取
      }),
    );
    const queryClient = createClient();
    const { result } = renderHook(
      () => ({ detail: useRequisitionDetail("req-502"), withdraw: useWithdrawRequisition("req-502") }),
      { wrapper: wrapperFor(queryClient) },
    );
    await waitFor(() => expect(result.current.detail.isSuccess).toBe(true));

    act(() => result.current.withdraw.mutate());
    await waitFor(() => {
      expect(result.current.withdraw.isPending).toBe(true); // 回應還沒到
      expect(queryClient.getQueryData<ReqDetail>(requisitionKeys.detail("req-502"))?.status).toBe("Draft");
    });
    await waitFor(() => expect(result.current.withdraw.isPending).toBe(false));
  });
});
