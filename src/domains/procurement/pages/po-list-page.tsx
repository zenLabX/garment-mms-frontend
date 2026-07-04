import { Card, Flex, Select, Typography } from "antd";
import { Link } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { AppTable } from "@/domains/shared/components/app-table";
import { StatusTag } from "@/domains/shared/components/status-tag";
import { usePoList } from "../api/po.api";
import { usePoListFilterStore } from "../store/po-list-filter.store";
import { poStatusViewMap, type PoListItem, type PoStatus } from "../model/po.model";

const columns: ColumnsType<PoListItem> = [
  {
    title: "採購單號",
    dataIndex: "poNo",
    render: (poNo: string, record) => <Link to={`/procurement/pos/${record.id}`}>{poNo}</Link>,
  },
  { title: "供應商", dataIndex: "supplier" },
  {
    title: "金額",
    dataIndex: "totalAmount",
    align: "right",
    render: (v: number) => `NT$ ${v.toLocaleString()}`,
  },
  {
    title: "狀態",
    dataIndex: "status",
    render: (status: PoStatus) => <StatusTag meta={poStatusViewMap[status].tag} />,
  },
  { title: "最後異動", dataIndex: "updatedAt" },
];

export function PoListPage() {
  const { page, pageSize, status, setPage, setStatus } = usePoListFilterStore();
  const { data, isLoading } = usePoList({ page, pageSize, status }); // 伺服器端分頁/篩選

  return (
    <Card>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          布料採購單
        </Typography.Title>
        <Select
          allowClear
          placeholder="依狀態篩選"
          style={{ width: 180 }}
          value={status}
          onChange={setStatus}
          options={Object.entries(poStatusViewMap).map(([value, view]) => ({
            value,
            label: view.tag.label,
          }))}
        />
      </Flex>
      <AppTable<PoListItem>
        rowKey="id"
        columns={columns}
        data={data}
        isLoading={isLoading}
        pageParams={{ page, pageSize }}
        onPageChange={({ page: p, pageSize: ps }) => setPage(p, ps)}
      />
    </Card>
  );
}
