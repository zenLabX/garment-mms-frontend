# 成衣物料管理系統前端（garment-mms-frontend）

DDD 流程驅動的物料管理系統前端。架構完整說明見 kaiso-meow-frontend repo 的 `docs/前端專案架構規劃.md`。

## 技術棧

React 18 + TS strict + Vite / Ant Design v5（ConfigProvider token 主題）/ TanStack Query v5（server state）+ Zustand（UI state）/ ECharts / AntD Form + zod（API 邊界驗證）/ vitest + testing-library + msw。

## 三條必守紀律（違反任一條會退化回舊專案的 fat store 問題）

1. **Server state 一律不放 Zustand**——API 回應不准 copy 進 store；Zustand 只放 UI state（篩選、modal 開關、多步驟表單暫存）。
2. **Query key 一律走各 domain 的 key factory**（如 `poKeys.list(params)`），禁止裸字串。
3. **一律伺服器端分頁/篩選**（用 `AppTable` + `placeholderData: keepPreviousData`），禁止抓全量前端過濾。

## 架構規則

- 分層職責：`api/` 只打 API + 轉型別（無業務判斷、無 toast 副作用）；`model/` 放型別、zod schema、「狀態×畫面」純資料對照表；元件只查表渲染。
- **權限為伺服器驅動**：按鈕顯示只讀 DTO 能力旗標（`canApprove` 等，用 `CapabilityButton`），選單/路由只比對 `usePermittedMenu()` 回傳清單。前端禁止自己實作「這個角色/狀態能不能做什麼」的業務規則。
- 錯誤處理單一層：queryClient 全域 onError（`shared/api/query-client.ts`），不要在各處自寫 extractErrorMessage。
- 新 domain 照抄 `src/domains/procurement/` 的模式；刻意保持樸素寫法，不引入 hooks 工廠或進階 generic 抽象。
- 檔名 kebab-case；後綴統一 `*.api.ts` / `*.model.ts` / `*.store.ts` / `*.test.ts(x)`。
- 型別：接通中台後用 `npm run gen:api` 產生 DTO，`*.model.ts` 改 re-export，不手抄後端欄位。

## AI 生成客製元件的慣例（決策 1 配套）

- 遵守 AntD props 慣例：`value`/`onChange` controlled、`className` 透傳、支援 `loading`/`disabled`。
- 色彩取自 `theme.useToken()`，不寫死色碼。
- 驗收 checklist：loading/empty/error 三態、鍵盤基本操作、響應式斷點、與中台 DTO 型別吻合。
- 圖表一律包 `shared/charts/EChart`，不直接 new echarts。

## 指令

- `npm run dev`：開發（msw 假資料驅動，右上角可切換示範身分）
- `npm run test`：vitest（msw node server）
- `npm run build`：tsc + vite build
- `npm run gen:api`：從中台 OpenAPI 產生型別
