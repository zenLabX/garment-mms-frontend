# 成衣物料管理系統前端

DDD 流程驅動的成衣物料管理系統前端骨架。完整架構說明見 kaiso-meow-frontend repo 的 `docs/前端專案架構規劃.md`，開發規範見 [CLAUDE.md](./CLAUDE.md)。

## 快速開始

```bash
npm install
npx msw init public/   # 首次需產生 mockServiceWorker.js
npm run dev
```

開啟後即為 msw 假資料驅動的完整示範流程：

1. 進入「採購管理」→ 點開 `PO-2026-00871`（待複核、超預算、低於安全庫存的示範單）。
2. 右上角切換示範身分，觀察**同一張單、不同人、按鈕不同**（能力旗標驅動）：
   - **Amy（採購員）**：可「撤回修改」，不可核准。
   - **Lisa（副理，代理 Ken）**：可「核准 / 退回」，超預算時核准需二次確認，頁面頂端有代理提示橫幅。
   - **Wanda（倉管）**：全部唯讀。
3. 執行退回（原因必填）→ 簽核歷程 timeline、列表狀態即時連動（mutation → invalidation）。

### 三級範例頁面示範腳本（複雜度低 → 高）

痛點與對策的完整論述見 [docs/需求變動痛點與對策.md](./docs/需求變動痛點與對策.md)。

- **低（物料主檔）**：新增一筆物料 → 回列表立刻看到（invalidation）；故意輸入既有料號 `FAB-COT-320` → 400 由全域錯誤層通知。
- **中（領料申請）**：建立領料單三步驟——填到一半切去別頁再回來，草稿還在（Zustand UI state）；挑料後即時顯示可用量（依賴查詢）；申請量填超過可用量 → 送出被中台 422 擋下；以 Amy 開一張待核准單按「撤回修改」→ 狀態秒變草稿（樂觀更新）。
- **高（庫存看板）**：開兩個分頁，一頁停在庫存看板；另一頁用 Lisa 核准採購單 `PO-2026-00872` → 切回看板，「在途採購量」與分類圖自動更新（跨 domain invalidation，宣告只在 `po.api.ts` 一行）；用 Wanda 對已核准領料單「確認發料」→ 在庫金額、低庫存清單連動。

## 骨架已示範的關鍵模式

| 模式 | 位置 |
|---|---|
| Query key factory + mutation 連動 invalidation | `src/domains/procurement/api/po.api.ts` |
| 狀態 → 畫面對照表（畫面跟著狀態長） | `src/domains/procurement/model/po.model.ts` |
| 能力旗標驅動按鈕（前端零業務規則） | `src/domains/shared/components/capability-button.tsx` |
| 伺服器端分頁表格 | `src/domains/shared/components/app-table.tsx` |
| ECharts 封裝（AntD token 主題、三態） | `src/domains/shared/charts/echart.tsx` |
| Zustand 正確用途（純 UI state） | `src/domains/procurement/store/po-list-filter.store.ts` |
| SignalR 掛載點（未實作）+ 事件失效對照 | `src/domains/shared/realtime/realtime-client.ts` + `src/app/realtime-handlers.ts` |
| 伺服器驅動選單/路由守衛 | `src/domains/identity/` + `src/app/app-layout.tsx` |
| 新建/編輯共用表單頁 + `enabled` 條件查詢 | `src/domains/material/pages/material-form-page.tsx` |
| 多步驟表單草稿（UI state 判準）| `src/domains/requisition/store/requisition-draft.store.ts` |
| 依賴查詢 + 跨 domain 快取共享 | `src/domains/inventory/api/inventory.api.ts` 的 `useStockAvailability` |
| 樂觀更新 + 回滾（含取捨標準） | `src/domains/requisition/api/requisition.api.ts` 的 `useWithdrawRequisition` |
| 跨 domain invalidation（連動不散落） | `src/domains/procurement/api/po.api.ts` 的 `usePoAction.onSuccess` |
| Dashboard 多卡獨立 query + 全域篩選器 + 輪詢 | `src/domains/inventory/` |

## 後續接手事項

見 [PROGRESS.md](./PROGRESS.md)。
