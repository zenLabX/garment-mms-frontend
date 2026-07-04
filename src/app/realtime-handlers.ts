import type { EntityChangedHandler } from "@/domains/shared/realtime/realtime-client";
import { poKeys } from "@/domains/procurement/api/po.api";
import { requisitionKeys } from "@/domains/requisition/api/requisition.api";
import { inventoryKeys } from "@/domains/inventory/api/inventory.api";

/**
 * SignalR 事件 → query 失效的對照表（app 層組裝，各 domain 只出借自己的 keys）。
 *
 * 目前 realtime client 是 no-op（shared/realtime/realtime-client.ts），
 * 看板即時性先由 refetchInterval 輪詢頂著。接通中台 Hub 當天的升級路徑：
 *   1. 實作 SignalR 版 RealtimeClient，在 connection.on("EntityChanged") 中
 *      `for (const h of entityChangedHandlers) h(event, queryClient)`
 *   2. 移除 inventory.api.ts 的 DASHBOARD_REFETCH_MS
 * ——除此之外，所有 domain 的 query / model / 元件零改動。
 *
 * 原則不變：推播只當「快取失效通知」，資料一律重新向中台要。
 */
export const entityChangedHandlers: EntityChangedHandler[] = [
  (event, queryClient) => {
    if (event.domain !== "po") return;
    void queryClient.invalidateQueries({ queryKey: poKeys.detail(event.id) });
    void queryClient.invalidateQueries({ queryKey: poKeys.lists() });
  },
  (event, queryClient) => {
    if (event.domain !== "requisition") return;
    void queryClient.invalidateQueries({ queryKey: requisitionKeys.detail(event.id) });
    void queryClient.invalidateQueries({ queryKey: requisitionKeys.lists() });
  },
  (event, queryClient) => {
    if (event.domain !== "inventory") return;
    void queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
  },
];
