import type { QueryClient } from "@tanstack/react-query";

/**
 * SignalR 即時推播掛載點（第一版為 no-op，接通中台 Hub 時只需替換實作，不動各 domain）。
 *
 * 整合原則（詳見 docs/前端專案架構規劃.md §7）：
 * - 推播只當「快取失效通知」，資料一律重新向中台要（invalidateQueries），
 *   避免推播 payload 與 REST 回應兩套資料形狀。
 * - 「他人處理中」鎖定這類輕量 UI 訊號才用 setQueryData 直接蓋欄位。
 * - 競態由 TanStack Query 去重與最後回應為準的機制自然消解。
 */
export interface EntityChangedEvent {
  domain: string; // 如 "po"、"inventory"
  id: string;
  kind: "updated" | "locked" | "unlocked";
  by?: string; // 觸發者（顯示「Ken 處理中」用）
}

export interface RealtimeClient {
  start(): Promise<void>;
  stop(): Promise<void>;
}

/** 各 domain 註冊自己的事件 → query 失效對應，集中在 app 層組裝 */
export type EntityChangedHandler = (event: EntityChangedEvent, queryClient: QueryClient) => void;

export function createNoopRealtimeClient(): RealtimeClient {
  return {
    start: async () => {},
    stop: async () => {},
  };
}

/*
 * 未來 SignalR 實作示意（需安裝 @microsoft/signalr）：
 *
 * const connection = new HubConnectionBuilder().withUrl(`${apiUrl}/hubs/entity`).withAutomaticReconnect().build();
 * connection.on("EntityChanged", (event: EntityChangedEvent) => {
 *   for (const handler of handlers) handler(event, queryClient);
 * });
 */
