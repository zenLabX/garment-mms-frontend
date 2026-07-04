import { Tag } from "antd";

export interface StatusTagMeta {
  label: string;
  color: string; // AntD Tag color（如 "processing" | "success" | "error" | "warning" | "default"）
}

/**
 * 狀態標籤：label/color 來自各 domain model 的狀態對照表，元件本身不含任何狀態知識。
 * 用法：<StatusTag meta={poStatusViewMap[po.status].tag} />
 */
export function StatusTag({ meta }: { meta: StatusTagMeta }) {
  return <Tag color={meta.color}>{meta.label}</Tag>;
}
