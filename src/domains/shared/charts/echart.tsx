import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { Empty, Spin, Typography, theme } from "antd";

interface EChartProps {
  option: EChartsOption | undefined;
  isLoading?: boolean;
  error?: unknown;
  height?: number | string;
  /** 資料為空時顯示 Empty（由呼叫端判斷，讀模型形狀各異） */
  isEmpty?: boolean;
  onEvents?: Record<string, (params: unknown) => void>;
}

/**
 * ECharts 統一封裝：
 * - 基礎文字/背景色取自 AntD theme token，跟隨企業主題
 * - 內建 loading / empty / error 三態（AI 生成圖表元件的驗收基本盤）
 * - 下鑽互動透過 onEvents 傳入（如 { click: handleDrillDown }）
 */
export function EChart({ option, isLoading, error, height = 320, isEmpty, onEvents }: EChartProps) {
  const { token } = theme.useToken();

  if (error) {
    return (
      <div style={{ height, display: "grid", placeItems: "center" }}>
        <Typography.Text type="danger">圖表載入失敗</Typography.Text>
      </div>
    );
  }
  if (isLoading || !option) {
    return (
      <div style={{ height, display: "grid", placeItems: "center" }}>
        <Spin />
      </div>
    );
  }
  if (isEmpty) {
    return (
      <div style={{ height, display: "grid", placeItems: "center" }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  const themedOption: EChartsOption = {
    textStyle: { color: token.colorText, fontFamily: token.fontFamily },
    backgroundColor: "transparent",
    ...option,
  };

  return <ReactECharts option={themedOption} style={{ height }} notMerge onEvents={onEvents} />;
}
