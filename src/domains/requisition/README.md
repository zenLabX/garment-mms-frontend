# requisition domain（領料申請）

**三級範例頁面的【中複雜度】實例**（規劃見 `docs/需求變動痛點與對策.md`）。
展示：UI state vs server state 的分界、依賴查詢、樂觀更新的取捨。

| 檔案 | 展示的模式 |
|---|---|
| `store/requisition-draft.store.ts` | 多步驟草稿 = UI state；「送出成功那一刻起是 server state」判準 |
| `pages/requisition-create-page.tsx` | Steps 三步驟、逐步 zod 驗證、`useStockAvailability`（enabled 依賴查詢，跨 domain 共享快取） |
| `api/requisition.api.ts` | `useWithdrawRequisition` 樂觀更新 + 回滾；approve 刻意不樂觀（取捨註解）；跨 domain invalidate inventoryKeys |
| `model/requisition.model.ts` | 5 狀態對照表（第二個實例，證明模式可複製）、表頭/明細/整包三份同源 schema |

超領檢查在中台（422），前端只給軟提醒——權限與業務規則不落地前端。
