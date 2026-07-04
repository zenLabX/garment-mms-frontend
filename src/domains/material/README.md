# material domain（物料主檔）

**三級範例頁面的【低複雜度】實例**（規劃見 `docs/需求變動痛點與對策.md`）。
展示：新 domain 照抄 procurement 的成本有多低——列表 + 搜尋 + 新建/編輯表單，全套約 6 個檔案。

| 檔案 | 展示的模式 |
|---|---|
| `api/material.api.ts` | key factory、`enabled: !!id`（新建模式不打 API）、create/update invalidate |
| `model/material.model.ts` | 分類 union 為 zod 與 TS 單一來源、`materialCategoryViewMap` 對照表 |
| `store/material-list-filter.store.ts` | 純 UI state（page/keyword） |
| `pages/material-form-page.tsx` | 新建/編輯共用表單、zod API 邊界驗證 |

**需求變更演練**：分類要加第四種「Trim」→ 只改 `material.model.ts` 的
`MATERIAL_CATEGORIES` 一行，編譯期會逼你補 viewMap 對照；列表 Tag 與表單 Select 零改動。
