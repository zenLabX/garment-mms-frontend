import { Button, Tooltip, type ButtonProps } from "antd";

interface CapabilityButtonProps extends ButtonProps {
  /** 中台 DTO 回傳的能力旗標（如 po.canApprove）。前端不自己判斷業務規則。 */
  capability: boolean | undefined;
  /** 無權限時的呈現方式：hide（預設）整顆隱藏；disable 顯示但禁用 */
  deniedMode?: "hide" | "disable";
  /** deniedMode="disable" 時顯示的提示文字 */
  deniedHint?: string;
}

/**
 * 能力旗標驅動的按鈕：顯示與否只看中台旗標，不看角色、不看狀態。
 * 用法：<CapabilityButton capability={po.canApprove} onClick={...}>核准</CapabilityButton>
 */
export function CapabilityButton({
  capability,
  deniedMode = "hide",
  deniedHint = "目前狀態下您沒有此操作權限",
  ...buttonProps
}: CapabilityButtonProps) {
  if (capability) {
    return <Button {...buttonProps} />;
  }
  if (deniedMode === "hide") {
    return null;
  }
  return (
    <Tooltip title={deniedHint}>
      <Button {...buttonProps} disabled />
    </Tooltip>
  );
}
