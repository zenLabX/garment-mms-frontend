# 進度與接手紀錄

> 用途：usage 分段開發的接手點。每個階段結束前更新此檔。

## 2026-07-05 第二階段（三級複雜度範例頁面）

### 已完成

- [x] `docs/需求變動痛點與對策.md`：九大痛點 → 機制級對策 + 誠實的代價與緩解（demo 論述文件）
- [x] 【低】material domain：列表 + 搜尋 + 新建/編輯共用表單頁（`enabled: !!id`、zod 邊界、分類對照表以 `MATERIAL_CATEGORIES` 為 zod/TS 單一來源）
- [x] 【中】requisition domain：三步驟建單（草稿 store + 逐步 zod）、`useStockAvailability` 依賴查詢（hook 放 inventory，快取跨 domain 共享）、`useWithdrawRequisition` 樂觀更新 + 回滾（approve 刻意不樂觀，取捨寫在註解）、超領由 msw 422 把關、詳情頁含 Wanda 發料能力（canIssue）
- [x] 【高】inventory dashboard：四卡 + 兩圖 + 低庫存表各自獨立 query、全域篩選 store、30 秒輪詢、`dataUpdatedAt` 顯示最後更新；`app/realtime-handlers.ts` 預埋 SignalR 事件→失效對照
- [x] 跨 domain 連動：`po.api.ts` / `requisition.api.ts` 的 onSuccess invalidate `inventoryKeys`（寫入方 import 讀取方 keys，僅 keys）；`inventory.api.test.tsx` 有可執行證明（核准 PO → 在途量 +600）
- [x] msw：material-data / requisition-data / inventory-data（看板讀模型**從 poDb/reqDb/materialDb 派生**，核准/發料會真的改變看板數字）；menu 四個項目；路由共 10 條
- [x] 各 domain README 改寫為指向實例；README.md 增補三級示範腳本與模式對照
- [x] 測試 37 綠（po 7 + material 10 + requisition 15 + inventory 5）；build / lint 通過

### 本階段之後的注意事項

- 圖表雙系列用色：`token.colorPrimary` + `token.colorWarningActive`（CVD 安全對，經 dataviz validator 驗證）；新增系列時維持固定順序，不要循環配色。
- 看板即時性升級路徑寫在 `src/app/realtime-handlers.ts` 檔頭註解：換 SignalR 實作 + 移除 `DASHBOARD_REFETCH_MS`，其餘零改動。
- stocktake / vendor 仍為空骨架，照抄 material（簡單 CRUD）或 requisition（含簽核流）即可。

## 2026-07-04 第一階段（骨架建立）

### 已完成

- [x] 架構規劃文件：kaiso-meow-frontend repo `docs/前端專案架構規劃.md`（含決策 2 評估結論）
- [x] 專案基底：package.json / tsconfig（strict + `@/*` 別名）/ vite（含 vitest 設定）/ eslint flat config
- [x] shared 層：axios（401 導頁完整）、queryClient（全域錯誤層）、CapabilityButton、AppTable、StatusTag、EChart wrapper、realtime no-op 介面
- [x] app 層：Providers（QueryClient/ConfigProvider/AntdApp）、Router、AppLayout（伺服器驅動選單 + 路由守衛 + 示範身分切換器 + 代理提示橫幅）
- [x] identity domain：useCurrentUser / usePermittedMenu
- [x] procurement 示範 domain：po.model（狀態對照表 + zod）、po.api（key factory + 3 個簽核 mutation）、po-list-filter.store（Zustand UI state 示範）、ApprovalTimeline、StockTrendChart、列表頁、詳情簽核頁
- [x] msw：demo-user 切換、data（需求.md §3-1 情境三張單）、handlers（分頁/篩選/簽核動作）、browser + server
- [x] 測試：po.model.test.ts（狀態對照表、zod）、po.api.test.tsx（msw 整合：分頁、Amy/Lisa 能力旗標差異）
- [x] 其餘 domain（material/inventory/requisition/stocktake/vendor）空骨架 README
- [x] CLAUDE.md / README.md
- [x] 驗證完成：`npm run test` 7/7 綠、`npm run build`（tsc + vite）通過、`npm run lint` 乾淨、dev server 可啟動且 mockServiceWorker.js 200

### 下一階段（骨架完成後的展開順序）

1. git init + 首次 commit。
2. 登入頁（identity domain）：目前 msw 直接視為已登入，真實登入流程待中台認證方式（JWT/Cookie）確定。
3. 接中台 OpenAPI：`npm run gen:api` → `po.model.ts` 改 re-export 產生的 DTO。
4. 依 procurement 模式展開其餘 domain；儀表板頁（ECharts 讀模型）；SignalR 替換 realtime no-op。
5. 效能：bundle 目前單一 chunk ~2.3MB（antd + echarts），頁面變多後用 route-level lazy() + manualChunks 切分。

### 已知注意事項

- msw 的 `mockServiceWorker.js` 不進版控（.gitignore 已排除），clone 後要跑 `npx msw init public/`。
- `src/mocks/` 全目錄為離線示範用，接通中台後移除；`app-layout.tsx` 的示範身分切換器（import 自 mocks/demo-user）屆時一併移除。
- 企業主題色目前為佔位值（`src/app/providers.tsx` 的 `brandTheme`），待設計師規格。
