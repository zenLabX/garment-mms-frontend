import { z } from "zod";
import type { StatusTagMeta } from "@/domains/shared/components/status-tag";

/*
 * 骨架階段手寫型別；接通中台後改為 re-export
 * `@/domains/shared/api/generated/schema` 的 DTO（npm run gen:api）。
 */

/**
 * 分類清單為 zod 與 TS 的單一來源：
 * 需求變更演練——加第四種分類（如 "Trim"）只改這一行，
 * materialCategoryViewMap 會在編譯期報錯逼你補對照，表單 Select / 列表 Tag 零改動。
 */
export const MATERIAL_CATEGORIES = ["Fabric", "Accessory", "Packaging"] as const;
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

/** 「分類 → 畫面呈現」對照表：元件只查表渲染，不寫 if */
export const materialCategoryViewMap: Record<MaterialCategory, StatusTagMeta> = {
  Fabric: { label: "布料", color: "blue" },
  Accessory: { label: "輔料", color: "purple" },
  Packaging: { label: "包材", color: "gold" },
};

export interface MaterialListItem {
  id: string;
  sku: string;
  name: string;
  category: MaterialCategory;
  unit: string;
  safetyStock: number;
  /** 標準成本（庫存看板算在庫值用） */
  stdCost: number;
  updatedAt: string;
}

export interface MaterialDetail extends MaterialListItem {
  spec?: string;
}

/** 表單值與 API 邊界共用同一份 zod（型別由 z.infer 導出，不另手抄） */
export const materialFormSchema = z.object({
  sku: z
    .string()
    .regex(/^[A-Z]{3}-[A-Z]{3}-\d{3}$/, "料號格式須為「XXX-XXX-000」（例：FAB-COT-320）"),
  name: z.string().min(1, "品名必填").max(50, "品名請勿超過 50 字"),
  category: z.enum(MATERIAL_CATEGORIES),
  unit: z.string().min(1, "單位必填").max(10),
  safetyStock: z.number().int("安全庫存須為整數").min(0, "安全庫存不可為負"),
  stdCost: z.number().min(0, "標準成本不可為負"),
  spec: z.string().max(200, "規格說明請勿超過 200 字").optional(),
});
export type MaterialFormValues = z.infer<typeof materialFormSchema>;
