import { useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Flex,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Statistic,
  Steps,
  Table,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMaterialList } from "@/domains/material/api/material.api";
import { useStockAvailability } from "@/domains/inventory/api/inventory.api";
import type { MaterialListItem } from "@/domains/material/model/material.model";
import { useCreateRequisition } from "../api/requisition.api";
import { useRequisitionDraftStore } from "../store/requisition-draft.store";
import {
  DEPARTMENTS,
  reqDraftSchema,
  reqHeaderSchema,
  type ReqLineDraft,
} from "../model/requisition.model";

/**
 * 三步驟建單頁。草稿全程放 Zustand（UI state）：切到別頁再回來還在；
 * 送出成功（server state 誕生）即 resetDraft，之後一律從 Query 讀。
 */
export function RequisitionCreatePage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { step, header, lines, setStep, resetDraft } = useRequisitionDraftStore();
  const create = useCreateRequisition();

  const goNext = () => {
    // 逐步驗證：每步只驗自己的子 schema，送出前驗整包——三份 schema 同源（requisition.model.ts）
    if (step === 0) {
      const parsed = reqHeaderSchema.safeParse(header);
      if (!parsed.success) {
        message.error(parsed.error.issues[0]?.message);
        return;
      }
    }
    if (step === 1 && lines.length === 0) {
      message.error("至少需要一筆領料明細");
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    const parsed = reqDraftSchema.safeParse({ header, lines }); // API 邊界一律過 zod
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message);
      return;
    }
    // 超領由中台把關（422），錯誤通知走全域 onError，這裡不寫庫存規則
    const created = await create.mutateAsync(parsed.data);
    resetDraft();
    message.success(`領料單 ${created.reqNo} 已送出`);
    navigate(`/requisition/requisitions/${created.id}`);
  };

  return (
    <Card>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        建立領料單
      </Typography.Title>
      <Steps
        current={step}
        items={[{ title: "領用資訊" }, { title: "挑選物料" }, { title: "確認送出" }]}
        style={{ maxWidth: 640, marginBottom: 24 }}
      />

      {step === 0 && <HeaderStep />}
      {step === 1 && <LinesStep />}
      {step === 2 && <ConfirmStep />}

      <Flex justify="flex-end" style={{ marginTop: 24 }}>
        <Space>
          {step > 0 && <Button onClick={() => setStep(step - 1)}>上一步</Button>}
          {step < 2 && (
            <Button type="primary" onClick={goNext}>
              下一步
            </Button>
          )}
          {step === 2 && (
            <Button type="primary" onClick={handleSubmit} loading={create.isPending}>
              送出申請
            </Button>
          )}
        </Space>
      </Flex>
    </Card>
  );
}

/** Step 1：欄位直接綁 store（controlled）——不經 AntD Form state，切步驟/切頁草稿都不丟 */
function HeaderStep() {
  const { header, patchHeader } = useRequisitionDraftStore();
  return (
    <Space direction="vertical" size={16} style={{ display: "flex", maxWidth: 480 }}>
      <div>
        <Typography.Text>領用部門</Typography.Text>
        <Select
          style={{ width: "100%", marginTop: 4 }}
          placeholder="請選擇部門"
          value={header.department || undefined}
          onChange={(department) => patchHeader({ department })}
          options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
        />
      </div>
      <div>
        <Typography.Text>用途說明</Typography.Text>
        <Input
          style={{ marginTop: 4 }}
          maxLength={100}
          placeholder="例：訂單 #A-1024 裁剪用料"
          value={header.purpose}
          onChange={(e) => patchHeader({ purpose: e.target.value })}
        />
      </div>
      <div>
        <Typography.Text>需求日期</Typography.Text>
        <DatePicker
          style={{ width: "100%", marginTop: 4 }}
          value={header.neededDate ? dayjs(header.neededDate) : undefined}
          onChange={(d) => patchHeader({ neededDate: d ? d.format("YYYY-MM-DD") : "" })}
        />
      </div>
    </Space>
  );
}

/** Step 2：挑料 + 明細清單 */
function LinesStep() {
  const { lines, addLine, removeLine } = useRequisitionDraftStore();
  return (
    <Space direction="vertical" size={16} style={{ display: "flex" }}>
      <MaterialPicker onAdd={addLine} />
      <Table<ReqLineDraft>
        rowKey="sku"
        size="small"
        pagination={false}
        dataSource={lines}
        columns={lineColumns(removeLine)}
        locale={{ emptyText: "尚未加入任何物料" }}
      />
    </Space>
  );
}

/** Step 3：純渲染草稿內容，確認後送出 */
function ConfirmStep() {
  const { header, lines } = useRequisitionDraftStore();
  return (
    <Space direction="vertical" size={16} style={{ display: "flex" }}>
      <Descriptions
        bordered
        size="small"
        column={3}
        items={[
          { key: "department", label: "領用部門", children: header.department },
          { key: "purpose", label: "用途", children: header.purpose },
          { key: "neededDate", label: "需求日期", children: header.neededDate },
        ]}
      />
      <Table<ReqLineDraft> rowKey="sku" size="small" pagination={false} dataSource={lines} columns={lineColumns()} />
    </Space>
  );
}

function lineColumns(onRemove?: (sku: string) => void): ColumnsType<ReqLineDraft> {
  const columns: ColumnsType<ReqLineDraft> = [
    { title: "料號", dataIndex: "sku" },
    { title: "品名", dataIndex: "name" },
    { title: "數量", dataIndex: "qty", align: "right", render: (v: number, r) => `${v.toLocaleString()} ${r.unit}` },
  ];
  if (onRemove) {
    columns.push({
      title: "",
      key: "actions",
      width: 80,
      render: (_, record) => (
        <Button type="link" danger size="small" onClick={() => onRemove(record.sku)}>
          移除
        </Button>
      ),
    });
  }
  return columns;
}

/**
 * 挑料元件：
 * - 物料選項走 useMaterialList（伺服器端搜尋）——直接複用 material domain 的 hook 與快取
 * - 選定料號才觸發 useStockAvailability（enabled 依賴查詢），未選料不打 API
 * - 申請量 > 可用量只給「軟提醒」，硬規則由中台 422 把關
 */
function MaterialPicker({ onAdd }: { onAdd: (line: ReqLineDraft) => void }) {
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<MaterialListItem | undefined>();
  const [qty, setQty] = useState<number | null>(null);

  const { data: materials, isFetching } = useMaterialList({ page: 1, pageSize: 20, keyword: keyword || undefined });
  const { data: stock, isLoading: stockLoading } = useStockAvailability(selected?.sku);

  const overAvailable = !!stock && !!qty && qty > stock.available;

  const handleAdd = () => {
    if (!selected || !qty) return;
    onAdd({ sku: selected.sku, name: selected.name, unit: selected.unit, qty });
    setSelected(undefined);
    setQty(null);
  };

  return (
    <Card size="small" type="inner" title="加入物料">
      <Row gutter={16} align="bottom">
        <Col xs={24} md={10}>
          <Typography.Text>物料（輸入料號 / 品名搜尋）</Typography.Text>
          <Select
            style={{ width: "100%", marginTop: 4 }}
            showSearch
            filterOption={false} // 搜尋交伺服器，前端不過濾
            onSearch={setKeyword}
            loading={isFetching}
            placeholder="例：精梳棉 或 FAB"
            value={selected?.id}
            onChange={(id) => {
              setSelected(materials?.items.find((m) => m.id === id));
              setQty(null);
            }}
            options={materials?.items.map((m) => ({ value: m.id, label: `${m.sku}｜${m.name}` }))}
          />
        </Col>
        <Col xs={24} md={6}>
          <Typography.Text>數量{selected ? `（${selected.unit}）` : ""}</Typography.Text>
          <InputNumber
            style={{ width: "100%", marginTop: 4 }}
            min={1}
            precision={0}
            value={qty}
            onChange={setQty}
            disabled={!selected}
          />
        </Col>
        <Col xs={24} md={8}>
          <Button type="primary" disabled={!selected || !qty} onClick={handleAdd}>
            加入明細
          </Button>
        </Col>
      </Row>
      {selected && (
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={8}>
            <Statistic title="在庫量" value={stock?.onHand} loading={stockLoading} suffix={selected.unit} />
          </Col>
          <Col span={8}>
            <Statistic title="已占用" value={stock?.reserved} loading={stockLoading} suffix={selected.unit} />
          </Col>
          <Col span={8}>
            <Statistic
              title="可用量"
              value={stock?.available}
              loading={stockLoading}
              suffix={selected.unit}
              valueStyle={overAvailable ? { color: "#cf1322" } : undefined}
            />
          </Col>
        </Row>
      )}
      {overAvailable && (
        <Alert
          style={{ marginTop: 12 }}
          type="warning"
          showIcon
          message={`申請量超過目前可用量（${stock?.available} ${selected?.unit}），送出時將由系統檢核`}
        />
      )}
    </Card>
  );
}
