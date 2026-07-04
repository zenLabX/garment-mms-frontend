# inventory domain（庫存看板）

**三級範例頁面的【高複雜度】實例**（規劃見 `docs/需求變動痛點與對策.md`）。
展示：多 query 組合看板、全域篩選器、輪詢→SignalR 升級路徑、跨 domain 連動。

| 檔案 | 展示的模式 |
|---|---|
| `api/inventory.api.ts` | dashboard 類 key factory；四張卡獨立 useQuery（不聚合，一張掛不拖累整版）；`refetchInterval` 輪詢 |
| `store/inventory-dashboard-filter.store.ts` | 全域篩選器：改一次 → 所有 query key 同變 → 全部自動重抓，元件零通訊 |
| `pages/inventory-dashboard-page.tsx` | `dataUpdatedAt` 顯示最後更新時間 |
| `components/*` | EChart（token 色、CVD 安全對）、低庫存 AppTable、分級查 `stockLevelViewMap` |

**跨 domain 連動**（採購核准 → 在途量自動刷新）宣告在**寫入方**：
`procurement/api/po.api.ts` 的 `onSuccess` 一行 `invalidate(inventoryKeys.dashboards())`。
盤點連動全貌：`grep -r "inventoryKeys" src/domains`。
可執行證明：`api/inventory.api.test.tsx` 的跨 domain invalidation 測試。
