# 進度與接手紀錄

> 用途：usage 分段開發的接手點。每個階段結束前更新此檔。

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
