import { Button, Card, Flex, Select, Space, Typography } from "antd";
import { Link, useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { AppTable } from "@/domains/shared/components/app-table";
import { StatusTag } from "@/domains/shared/components/status-tag";
import { useRequisitionList } from "../api/requisition.api";
import { useReqListFilterStore } from "../store/requisition-list-filter.store";
import { reqStatusViewMap, type ReqListItem, type ReqStatus } from "../model/requisition.model";

const columns: ColumnsType<ReqListItem> = [
  {
    title: "領料單號",
    dataIndex: "reqNo",
    render: (reqNo: string, record) => <Link to={`/requisition/requisitions/${record.id}`}>{reqNo}</Link>,
  },
  { title: "領用部門", dataIndex: "department" },
  { title: "用途", dataIndex: "purpose", ellipsis: true },
  { title: "需求日期", dataIndex: "neededDate" },
  {
    title: "狀態",
    dataIndex: "status",
    render: (status: ReqStatus) => <StatusTag meta={reqStatusViewMap[status].tag} />,
  },
  { title: "最後異動", dataIndex: "updatedAt" },
];

export function RequisitionListPage() {
  const navigate = useNavigate();
  const { page, pageSize, status, setPage, setStatus } = useReqListFilterStore();
  const { data, isLoading } = useRequisitionList({ page, pageSize, status }); // 伺服器端分頁/篩選

  return (
    <Card>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          領料申請
        </Typography.Title>
        <Space>
          <Select
            allowClear
            placeholder="依狀態篩選"
            style={{ width: 200 }}
            value={status}
            onChange={setStatus}
            options={Object.entries(reqStatusViewMap).map(([value, view]) => ({
              value,
              label: view.tag.label,
            }))}
          />
          <Button type="primary" onClick={() => navigate("/requisition/requisitions/new")}>
            建立領料單
          </Button>
        </Space>
      </Flex>
      <AppTable<ReqListItem>
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
