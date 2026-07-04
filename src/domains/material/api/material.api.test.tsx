import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useCreateMaterial, useMaterialDetail, useMaterialList } from "./material.api";

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("material.api（msw 整合測試）", () => {
  it("列表為伺服器端分頁：回傳 items 與 total", async () => {
    const { result } = renderHook(() => useMaterialList({ page: 1, pageSize: 5 }), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(5);
    expect(result.current.data?.total).toBeGreaterThanOrEqual(12);
  });

  it("keyword 由伺服器過濾（料號 / 品名 contains）", async () => {
    const { result } = renderHook(() => useMaterialList({ page: 1, pageSize: 10, keyword: "精梳棉" }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total).toBe(2);
    expect(result.current.data?.items.every((m) => m.name.includes("精梳棉"))).toBe(true);
  });

  it("id 為 undefined 時不打 API（新建模式）", () => {
    const { result } = renderHook(() => useMaterialDetail(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("建立成功後可查到詳情", async () => {
    const wrapper = createWrapper();
    const { result: create } = renderHook(() => useCreateMaterial(), { wrapper });
    const created = await create.current.mutateAsync({
      sku: "ACC-ELA-030",
      name: "鬆緊帶 30mm",
      category: "Accessory",
      unit: "碼",
      safetyStock: 300,
      stdCost: 4.5,
    });
    const { result: detail } = renderHook(() => useMaterialDetail(created.id), { wrapper });
    await waitFor(() => expect(detail.current.isSuccess).toBe(true));
    expect(detail.current.data?.sku).toBe("ACC-ELA-030");
  });

  it("料號重複回 400（訊息交由全域 onError 呈現）", async () => {
    const { result } = renderHook(() => useCreateMaterial(), { wrapper: createWrapper() });
    await expect(
      result.current.mutateAsync({
        sku: "FAB-COT-320", // 既有料號
        name: "重複料號",
        category: "Fabric",
        unit: "碼",
        safetyStock: 0,
        stdCost: 1,
      }),
    ).rejects.toSatisfy((err) => isAxiosError(err) && err.response?.status === 400);
  });
});
