import { Link } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { AppTable } from "@/domains/shared/components/app-table";
import { StatusTag } from "@/domains/shared/components/status-tag";
import { useLowStockList, type InventoryDashboardFilter } from "../api/inventory.api";
import { useInventoryDashboardFilterStore } from "../store/inventory-dashboard-filter.store";
import { stockLevelViewMap, type LowStockItem, type StockLevel } from "../model/inventory.model";

const columns: ColumnsType<LowStockItem> = [
  {
    title: "料號",
    dataIndex: "sku",
    // 讀模型直接連回 material 主檔維護頁（跨 domain 導航，不跨 domain 抓資料）
    render: (sku: string, record) => <Link to={`/material/materials/${record.id}/edit`}>{sku}</Link>,
  },
  { title: "品名", dataIndex: "name" },
  { title: "在庫量", dataIndex: "onHand", align: "right", render: (v: number, r) => `${v.toLocaleString()} ${r.unit}` },
  { title: "已占用", dataIndex: "reserved", align: "right", render: (v: number) => v.toLocaleString() },
  { title: "安全庫存", dataIndex: "safetyStock", align: "right", render: (v: number) => v.toLocaleString() },
  {
    title: "分級",
    dataIndex: "level",
    // 分級由中台算好回傳，前端只查表上色
    render: (level: StockLevel) => <StatusTag meta={stockLevelViewMap[level]} />,
  },
];

/** 低庫存清單：與其他卡片共用全域篩選，分頁走伺服器端（AppTable） */
export function LowStockTable({ filter }: { filter: InventoryDashboardFilter }) {
  const { lowStockPage, lowStockPageSize, setLowStockPage } = useInventoryDashboardFilterStore();
  const { data, isLoading } = useLowStockList({ ...filter, page: lowStockPage, pageSize: lowStockPageSize });

  return (
    <AppTable<LowStockItem>
      rowKey="id"
      size="small"
      columns={columns}
      data={data}
      isLoading={isLoading}
      pageParams={{ page: lowStockPage, pageSize: lowStockPageSize }}
      onPageChange={({ page, pageSize }) => setLowStockPage(page, pageSize)}
    />
  );
}
