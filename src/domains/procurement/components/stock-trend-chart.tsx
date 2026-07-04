import type { EChartsOption } from "echarts";
import { theme } from "antd";
import { EChart } from "@/domains/shared/charts/echart";
import type { PoDetail } from "../model/po.model";

/** 讀模型圖表示範：料號近 90 天庫存趨勢 + 安全庫存線（低於安全庫存以警示色呈現） */
export function StockTrendChart({ trend }: { trend: PoDetail["readModels"]["stockTrend"] }) {
  const { token } = theme.useToken();

  const option: EChartsOption = {
    tooltip: { trigger: "axis" },
    grid: { top: 32, right: 16, bottom: 24, left: 48 },
    xAxis: { type: "category", data: trend.dates },
    yAxis: { type: "value", name: "在庫量" },
    series: [
      {
        name: "在庫量",
        type: "line",
        data: trend.onHand,
        smooth: true,
        itemStyle: { color: trend.belowSafety ? token.colorError : token.colorPrimary },
        areaStyle: { opacity: 0.1 },
        markLine: {
          silent: true,
          lineStyle: { color: token.colorWarning, type: "dashed" },
          data: [{ yAxis: trend.safetyStock, name: "安全庫存", label: { formatter: "安全庫存 {c}" } }],
        },
      },
    ],
  };

  return <EChart option={option} height={260} isEmpty={trend.dates.length === 0} />;
}
