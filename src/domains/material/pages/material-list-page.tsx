import { Button, Card, Flex, Input, Space, Typography } from "antd";
import { Link, useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { AppTable } from "@/domains/shared/components/app-table";
import { StatusTag } from "@/domains/shared/components/status-tag";
import { useMaterialList } from "../api/material.api";
import { useMaterialListFilterStore } from "../store/material-list-filter.store";
import { materialCategoryViewMap, type MaterialCategory, type MaterialListItem } from "../model/material.model";

const columns: ColumnsType<MaterialListItem> = [
  {
    title: "料號",
    dataIndex: "sku",
    render: (sku: string, record) => <Link to={`/material/materials/${record.id}/edit`}>{sku}</Link>,
  },
  { title: "品名", dataIndex: "name" },
  {
    title: "分類",
    dataIndex: "category",
    render: (category: MaterialCategory) => <StatusTag meta={materialCategoryViewMap[category]} />,
  },
  { title: "單位", dataIndex: "unit" },
  { title: "安全庫存", dataIndex: "safetyStock", align: "right", render: (v: number) => v.toLocaleString() },
  { title: "標準成本", dataIndex: "stdCost", align: "right", render: (v: number) => `NT$ ${v.toLocaleString()}` },
  { title: "最後異動", dataIndex: "updatedAt" },
];

export function MaterialListPage() {
  const navigate = useNavigate();
  const { page, pageSize, keyword, setPage, setKeyword } = useMaterialListFilterStore();
  const { data, isLoading } = useMaterialList({ page, pageSize, keyword }); // 伺服器端分頁/搜尋

  return (
    <Card>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          物料主檔
        </Typography.Title>
        <Space>
          <Input.Search
            allowClear
            placeholder="搜尋料號 / 品名"
            style={{ width: 240 }}
            defaultValue={keyword}
            onSearch={setKeyword}
          />
          <Button type="primary" onClick={() => navigate("/material/materials/new")}>
            新增物料
          </Button>
        </Space>
      </Flex>
      <AppTable<MaterialListItem>
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
