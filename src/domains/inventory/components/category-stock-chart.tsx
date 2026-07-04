import type { EChartsOption } from "echarts";
import { theme } from "antd";
import { EChart } from "@/domains/shared/charts/echart";
import { useCategoryStock, type InventoryDashboardFilter } from "../api/inventory.api";

/**
 * 分類 × 在庫/在途金額（分組長條）。
 * 色彩取自 theme token：主色藍 + 深琥珀（colorWarningActive）是 CVD 安全對比組。
 */
export function CategoryStockChart({ filter }: { filter: InventoryDashboardFilter }) {
  const { token } = theme.useToken();
  const { data, isLoading, error } = useCategoryStock(filter);

  const option: EChartsOption | undefined = data && {
    tooltip: { trigger: "axis", valueFormatter: (v) => `NT$ ${Number(v).toLocaleString()}` },
    legend: { top: 0, textStyle: { color: token.colorTextSecondary } },
    grid: { top: 40, right: 16, bottom: 24, left: 72 },
    xAxis: {
      type: "category",
      data: data.map((r) => r.categoryLabel),
      axisLabel: { color: token.colorTextSecondary },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: token.colorTextSecondary },
      splitLine: { lineStyle: { color: token.colorSplit } },
    },
    series: [
      {
        name: "在庫金額",
        type: "bar",
        data: data.map((r) => r.onHandValue),
        itemStyle: { color: token.colorPrimary, borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 40,
      },
      {
        name: "在途金額",
        type: "bar",
        data: data.map((r) => r.inTransitValue),
        itemStyle: { color: token.colorWarningActive, borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 40,
      },
    ],
  };

  return <EChart option={option} isLoading={isLoading} error={error} height={280} isEmpty={data?.length === 0} />;
}
