import { Card, Col, Row, Statistic, theme } from "antd";
import { useInventorySummary, type InventoryDashboardFilter } from "../api/inventory.api";

/** 四張 KPI 卡共用一支 summary query；讀模型數字全由中台算好，前端只呈現 */
export function StockSummaryCards({ filter }: { filter: InventoryDashboardFilter }) {
  const { token } = theme.useToken();
  const { data, isLoading } = useInventorySummary(filter);

  const cards = [
    { key: "value", title: "在庫金額", value: data?.totalStockValue, prefix: "NT$" },
    {
      key: "low",
      title: "低於安全庫存",
      value: data?.lowStockCount,
      suffix: "個料號",
      valueStyle: data && data.lowStockCount > 0 ? { color: token.colorError } : undefined,
    },
    { key: "transit", title: "在途採購量", value: data?.inTransitQty, suffix: "單位" },
    { key: "issue", title: "待發料申請", value: data?.pendingIssueCount, suffix: "筆" },
  ];

  return (
    <Row gutter={[16, 16]}>
      {cards.map((card) => (
        <Col key={card.key} xs={12} lg={6}>
          <Card>
            <Statistic
              title={card.title}
              value={card.value ?? 0}
              loading={isLoading}
              prefix={card.prefix}
              suffix={card.suffix}
              valueStyle={card.valueStyle}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
