import type { EChartsOption } from "echarts";
import { theme } from "antd";
import { EChart } from "@/domains/shared/charts/echart";
import { useInboundTrend, type InventoryDashboardFilter } from "../api/inventory.api";

/** 近 12 週入庫 vs 領用（雙折線，與長條圖共用同一組 CVD 安全色） */
export function InboundTrendChart({ filter }: { filter: InventoryDashboardFilter }) {
  const { token } = theme.useToken();
  const { data, isLoading, error } = useInboundTrend(filter);

  const option: EChartsOption | undefined = data && {
    tooltip: { trigger: "axis" },
    legend: { top: 0, textStyle: { color: token.colorTextSecondary } },
    grid: { top: 40, right: 16, bottom: 24, left: 56 },
    xAxis: {
      type: "category",
      data: data.map((p) => p.period),
      axisLabel: { color: token.colorTextSecondary },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: token.colorTextSecondary },
      splitLine: { lineStyle: { color: token.colorSplit } },
    },
    series: [
      {
        name: "入庫",
        type: "line",
        data: data.map((p) => p.inbound),
        smooth: true,
        lineStyle: { width: 2 },
        itemStyle: { color: token.colorPrimary },
      },
      {
        name: "領用",
        type: "line",
        data: data.map((p) => p.issued),
        smooth: true,
        lineStyle: { width: 2 },
        itemStyle: { color: token.colorWarningActive },
      },
    ],
  };

  return <EChart option={option} isLoading={isLoading} error={error} height={280} isEmpty={data?.length === 0} />;
}
