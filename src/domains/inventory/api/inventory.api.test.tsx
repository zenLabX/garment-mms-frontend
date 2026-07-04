import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setDemoUserId } from "@/mocks/demo-user";
import { useApprovePo } from "@/domains/procurement/api/po.api";
import { useInventorySummary, useLowStockList, useStockAvailability } from "./inventory.api";

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("inventory.api（msw 整合測試）", () => {
  it("可用量 = 在庫 − 已占用；未給 sku 不打 API", async () => {
    const wrapper = createWrapper();
    const { result: idle } = renderHook(() => useStockAvailability(undefined), { wrapper });
    expect(idle.current.fetchStatus).toBe("idle");

    const { result } = renderHook(() => useStockAvailability("FAB-COT-320"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const stock = result.current.data;
    expect(stock?.available).toBe((stock?.onHand ?? 0) - (stock?.reserved ?? 0));
  });

  it("summary 反映伺服器端篩選：單一分類的在庫金額 ≤ 全量", async () => {
    const wrapper = createWrapper();
    const { result: all } = renderHook(() => useInventorySummary({}), { wrapper });
    const { result: fabric } = renderHook(() => useInventorySummary({ category: "Fabric" }), { wrapper });
    await waitFor(() => expect(all.current.isSuccess && fabric.current.isSuccess).toBe(true));
    expect(fabric.current.data!.totalStockValue).toBeLessThan(all.current.data!.totalStockValue);
  });

  it("低庫存清單為伺服器端分頁，且分級由伺服器算好回傳", async () => {
    const { result } = renderHook(() => useLowStockList({ page: 1, pageSize: 3 }), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.items.length).toBeLessThanOrEqual(3);
    expect(result.current.data!.items.every((i) => ["Warning", "Critical"].includes(i.level))).toBe(true);
  });

  /**
   * 「跨 domain 連動不散落」的可執行證明：
   * 看板 query 與採購核准 mutation 掛在同一個 QueryClient 下，
   * 核准後看板的在途量自動增加——連動只靠 po.api.ts onSuccess 的一行 invalidate。
   */
  it("核准採購單 → 庫存看板在途量自動刷新（跨 domain invalidation）", async () => {
    setDemoUserId("lisa");
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => ({ summary: useInventorySummary({}), approve: useApprovePo("po-872") }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.summary.isSuccess).toBe(true));
    const before = result.current.summary.data!.inTransitQty;

    act(() => result.current.approve.mutate({}));
    await waitFor(() => expect(result.current.approve.isSuccess).toBe(true));
    // po-872 含聚酯纖維 600 碼：核准後在途量應 +600（invalidate 觸發自動重抓）
    await waitFor(() => expect(result.current.summary.data!.inTransitQty).toBe(before + 600));
  });
});
