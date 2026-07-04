# requisition domain

尚未實作。展開此 domain 時，照抄 `src/domains/procurement/` 的分層與模式：

- `api/`：query key factory + TanStack Query hooks（只做資料轉換，不含業務判斷）
- `model/`：型別（接中台後改用 generated DTO）+ zod schema + 狀態×畫面對照表
- `hooks/`：use-case pure function
- `components/` / `pages/`
- `store/`：僅限 UI state 的 Zustand store（篩選、modal 開關）

三條紀律見專案根目錄 CLAUDE.md。
