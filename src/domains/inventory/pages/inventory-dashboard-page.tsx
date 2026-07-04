import dayjs from "dayjs";
import { Card, Col, Flex, Row, Select, Space, Typography } from "antd";
import { useInventoryDashboardFilterStore } from "../store/inventory-dashboard-filter.store";
import { useInventorySummary, type InventoryDashboardFilter } from "../api/inventory.api";
import { WAREHOUSES } from "../model/inventory.model";
import { materialCategoryViewMap } from "@/domains/material/model/material.model";
import { StockSummaryCards } from "../components/stock-summary-cards";
import { CategoryStockChart } from "../components/category-stock-chart";
import { InboundTrendChart } from "../components/inbound-trend-chart";
import { LowStockTable } from "../components/low-stock-table";

/**
 * 庫存看板：四張卡 + 兩張圖 + 低庫存清單，各自獨立 query（一張掛不拖累整版）。
 * 篩選器改一次 → 所有 query key 同時變 → 全部自動重抓；卡片之間零通訊。
 * 即時性：目前 30 秒輪詢；採購核准 / 領料簽核發料時由對方 domain 的 mutation
 * invalidate inventoryKeys 立即刷新（跨 domain 連動宣告在對方的 *.api.ts）。
 */
export function InventoryDashboardPage() {
  const { warehouse, category, setWarehouse, setCategory } = useInventoryDashboardFilterStore();
  const filter: InventoryDashboardFilter = { warehouse, category };

  // dataUpdatedAt 是 Query 內建 metadata：順手示範「最後更新時間」不需要自己記
  const { dataUpdatedAt } = useInventorySummary(filter);

  return (
    <Space direction="vertical" size={16} style={{ display: "flex" }}>
      <Card>
        <Flex justify="space-between" align="center" wrap gap={12}>
          <Space size={12} wrap>
            <Typography.Title level={5} style={{ margin: 0 }}>
              庫存看板
            </Typography.Title>
            <Select
              allowClear
              placeholder="全部倉別"
              style={{ width: 160 }}
              value={warehouse}
              onChange={setWarehouse}
              options={[...WAREHOUSES]}
            />
            <Select
              allowClear
              placeholder="全部分類"
              style={{ width: 160 }}
              value={category}
              onChange={setCategory}
              options={Object.entries(materialCategoryViewMap).map(([value, meta]) => ({
                value,
                label: meta.label,
              }))}
            />
          </Space>
          <Typography.Text type="secondary">
            {dataUpdatedAt ? `最後更新 ${dayjs(dataUpdatedAt).format("HH:mm:ss")}．` : ""}每 30 秒自動更新
          </Typography.Text>
        </Flex>
      </Card>

      <StockSummaryCards filter={filter} />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="各分類在庫 / 在途金額">
            <CategoryStockChart filter={filter} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="近 12 週入庫 vs 領用">
            <InboundTrendChart filter={filter} />
          </Card>
        </Col>
      </Row>

      <Card title="低庫存清單">
        <LowStockTable filter={filter} />
      </Card>
    </Space>
  );
}
