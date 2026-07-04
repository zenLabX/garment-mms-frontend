# 中台 OpenAPI 自動產生型別

執行 `npm run gen:api`（環境變數 `MIDPLATFORM_OPENAPI_URL` 指向中台 swagger.json）會在此目錄產生 `schema.d.ts`。

- 接通中台後，各 domain 的 `*.model.ts` 應改為 re-export 這裡的 DTO 型別，逐步汰換手寫型別。
- 禁止手動編輯產生檔；欄位不合理請回頭改中台 DTO。
