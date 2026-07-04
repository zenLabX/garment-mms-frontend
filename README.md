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

## 骨架已示範的關鍵模式

| 模式 | 位置 |
|---|---|
| Query key factory + mutation 連動 invalidation | `src/domains/procurement/api/po.api.ts` |
| 狀態 → 畫面對照表（畫面跟著狀態長） | `src/domains/procurement/model/po.model.ts` |
| 能力旗標驅動按鈕（前端零業務規則） | `src/domains/shared/components/capability-button.tsx` |
| 伺服器端分頁表格 | `src/domains/shared/components/app-table.tsx` |
| ECharts 封裝（AntD token 主題、三態） | `src/domains/shared/charts/echart.tsx` |
| Zustand 正確用途（純 UI state） | `src/domains/procurement/store/po-list-filter.store.ts` |
| SignalR 掛載點（未實作） | `src/domains/shared/realtime/realtime-client.ts` |
| 伺服器驅動選單/路由守衛 | `src/domains/identity/` + `src/app/app-layout.tsx` |

## 後續接手事項

見 [PROGRESS.md](./PROGRESS.md)。
