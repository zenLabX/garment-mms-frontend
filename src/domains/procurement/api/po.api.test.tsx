import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setDemoUserId } from "@/mocks/demo-user";
import { usePoDetail, usePoList } from "./po.api";

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("po.api（msw 整合測試）", () => {
  it("列表為伺服器端分頁：回傳 items 與 total", async () => {
    setDemoUserId("amy");
    const { result } = renderHook(() => usePoList({ page: 1, pageSize: 2 }), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(2);
    expect(result.current.data?.total).toBe(3);
  });

  it("建立者 Amy：待複核單可撤回、不可核准", async () => {
    setDemoUserId("amy");
    const { result } = renderHook(() => usePoDetail("po-871"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.canWithdraw).toBe(true);
    expect(result.current.data?.canApprove).toBe(false);
  });

  it("代理簽核者 Lisa：同一張單可核准 / 退回、不可撤回", async () => {
    setDemoUserId("lisa");
    const { result } = renderHook(() => usePoDetail("po-871"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.canApprove).toBe(true);
    expect(result.current.data?.canReject).toBe(true);
    expect(result.current.data?.canWithdraw).toBe(false);
  });
});
