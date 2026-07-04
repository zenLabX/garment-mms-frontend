import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/domains/shared/api/axios-instance";
import type { PagedResult, PageParams } from "@/domains/shared/components/app-table";
import type { MaterialCategory } from "@/domains/material/model/material.model";
import type {
  CategoryStockRow,
  InboundTrendPoint,
  InventorySummary,
  LowStockItem,
} from "../model/inventory.model";

/** 看板全域篩選：改一次 → 所有 dashboard query 的 key 同時變 → 全部自動重抓 */
export interface InventoryDashboardFilter {
  warehouse?: string;
  category?: MaterialCategory;
}

/**
 * Query key factory：全 domain 的 key 只從這裡拿，禁止裸字串。
 * 其他 domain（procurement / requisition）的 mutation 要連動庫存畫面時，
 * 只准 import 這個 keys 物件做 invalidate——不 import hooks / 元件（耦合方向見 docs/需求變動痛點與對策.md）。
 */
export const inventoryKeys = {
  all: ["inventory"] as const,
  availability: (sku: string) => [...inventoryKeys.all, "availability", sku] as const,
  dashboards: () => [...inventoryKeys.all, "dashboard"] as const,
  summary: (filter: InventoryDashboardFilter) => [...inventoryKeys.dashboards(), "summary", filter] as const,
  byCategory: (filter: InventoryDashboardFilter) =>
    [...inventoryKeys.dashboards(), "by-category", filter] as const,
  lowStock: (params: InventoryDashboardFilter & PageParams) =>
    [...inventoryKeys.dashboards(), "low-stock", params] as const,
  inboundTrend: (filter: InventoryDashboardFilter) =>
    [...inventoryKeys.dashboards(), "inbound-trend", filter] as const,
};

/**
 * 看板的即時性策略：先用 30 秒輪詢（refetchInterval）。
 * 接通 SignalR 後移除此常數，改由 app/realtime-handlers.ts 的事件失效驅動
 * ——屆時本檔與所有元件零改動，只換 realtime client 實作。
 */
const DASHBOARD_REFETCH_MS = 30_000;

export interface StockAvailability {
  sku: string;
  onHand: number;
  /** 已被待核准/已核准領料單占用 */
  reserved: number;
  available: number;
}

/**
 * 依賴查詢示範：requisition 建單時「選了物料才查可用量」。
 * 快取以 sku 為 key 跨頁共享——建單頁查過的料，看板再查同料直接命中快取。
 */
export function useStockAvailability(sku: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.availability(sku ?? ""),
    queryFn: async () =>
      (await axiosInstance.get<StockAvailability>("/inventory/availability", { params: { sku } })).data,
    enabled: !!sku, // 未選料不打 API
  });
}

/*
 * 看板四張卡各自獨立 useQuery（不用 useQueries 聚合）：
 * 各卡獨立 loading / error，一張掛掉不拖累整版。
 */

export function useInventorySummary(filter: InventoryDashboardFilter) {
  return useQuery({
    queryKey: inventoryKeys.summary(filter),
    queryFn: async () =>
      (await axiosInstance.get<InventorySummary>("/inventory/summary", { params: filter })).data,
    refetchInterval: DASHBOARD_REFETCH_MS,
  });
}

export function useCategoryStock(filter: InventoryDashboardFilter) {
  return useQuery({
    queryKey: inventoryKeys.byCategory(filter),
    queryFn: async () =>
      (await axiosInstance.get<CategoryStockRow[]>("/inventory/by-category", { params: filter })).data,
    refetchInterval: DASHBOARD_REFETCH_MS,
  });
}

export function useLowStockList(params: InventoryDashboardFilter & PageParams) {
  return useQuery({
    queryKey: inventoryKeys.lowStock(params),
    queryFn: async () =>
      (await axiosInstance.get<PagedResult<LowStockItem>>("/inventory/low-stock", { params })).data,
    placeholderData: keepPreviousData,
    refetchInterval: DASHBOARD_REFETCH_MS,
  });
}

export function useInboundTrend(filter: InventoryDashboardFilter) {
  return useQuery({
    queryKey: inventoryKeys.inboundTrend(filter),
    queryFn: async () =>
      (await axiosInstance.get<InboundTrendPoint[]>("/inventory/inbound-trend", { params: filter })).data,
    refetchInterval: DASHBOARD_REFETCH_MS,
  });
}
