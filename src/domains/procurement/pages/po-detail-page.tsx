import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  App,
  Card,
  Col,
  Descriptions,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { CapabilityButton } from "@/domains/shared/components/capability-button";
import { StatusTag } from "@/domains/shared/components/status-tag";
import { useApprovePo, usePoDetail, useRejectPo, useWithdrawPo } from "../api/po.api";
import {
  poStatusViewMap,
  rejectFormSchema,
  type PoItem,
  type RejectFormValues,
} from "../model/po.model";
import { ApprovalTimeline } from "../components/approval-timeline";
import { StockTrendChart } from "../components/stock-trend-chart";

const itemColumns: ColumnsType<PoItem> = [
  { title: "料號", dataIndex: "sku" },
  { title: "品名", dataIndex: "name" },
  { title: "顏色", dataIndex: "color" },
  { title: "數量", dataIndex: "qty", align: "right", render: (v: number, r) => `${v.toLocaleString()} ${r.unit}` },
  { title: "單價", dataIndex: "unitPrice", align: "right" },
  {
    title: "交期",
    dataIndex: "leadTimeDays",
    render: (days: number, r) =>
      r.riskFlag === "Delayed" ? <Tag color="error">{days} 天（逾期風險）</Tag> : <Tag color="success">{days} 天</Tag>,
  },
];

export function PoDetailPage() {
  const { id = "" } = useParams();
  const { message } = App.useApp();
  const { data: po, isLoading } = usePoDetail(id);
  const approve = useApprovePo(id);
  const reject = useRejectPo(id);
  const withdraw = useWithdrawPo(id);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectForm] = Form.useForm<RejectFormValues>();

  if (isLoading || !po) return <Skeleton active />;

  // 畫面行為只查狀態對照表；「能不能按」只讀中台能力旗標——元件內不寫業務規則
  const view = poStatusViewMap[po.status];
  const lastReject = [...po.statusHistory].reverse().find((h) => h.status === "Rejected");
  const overBudget = po.readModels.budget.overBudget;

  const handleReject = async () => {
    const values = await rejectForm.validateFields();
    const parsed = rejectFormSchema.safeParse(values); // API 邊界一律過 zod
    if (!parsed.success) return;
    await reject.mutateAsync(parsed.data);
    setRejectOpen(false);
    message.success("已退回");
  };

  return (
    <Space direction="vertical" size={16} style={{ display: "flex" }}>
      {po.lockedBy && (
        <Alert type="warning" showIcon message={`${po.lockedBy} 處理中，暫時無法編輯此單`} />
      )}

      <Card>
        <Flex justify="space-between" align="center">
          <Space size={12}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {po.poNo}
            </Typography.Title>
            <StatusTag meta={view.tag} />
          </Space>
          <Space>
            <CapabilityButton capability={po.canWithdraw} onClick={() => withdraw.mutate({})} loading={withdraw.isPending}>
              撤回修改
            </CapabilityButton>
            <CapabilityButton capability={po.canReject} danger onClick={() => setRejectOpen(true)}>
              退回
            </CapabilityButton>
            {/* 超預算時核准需二次確認：判斷依據是中台讀模型旗標，非前端自算 */}
            {overBudget ? (
              <Popconfirm
                title="本單已超出部門月預算"
                description="仍要核准嗎？此操作將記錄於稽核軌跡。"
                onConfirm={() => approve.mutate({})}
              >
                <CapabilityButton capability={po.canApprove} type="primary" loading={approve.isPending}>
                  核准
                </CapabilityButton>
              </Popconfirm>
            ) : (
              <CapabilityButton capability={po.canApprove} type="primary" onClick={() => approve.mutate({})} loading={approve.isPending}>
                核准
              </CapabilityButton>
            )}
          </Space>
        </Flex>
        <Descriptions
          style={{ marginTop: 16 }}
          items={[
            { key: "supplier", label: "供應商", children: po.supplier },
            { key: "amount", label: "採購金額", children: `NT$ ${po.totalAmount.toLocaleString()}` },
            { key: "updated", label: "最後異動", children: po.updatedAt },
          ]}
        />
        {view.showRejectReason && lastReject && (
          <Alert type="error" showIcon message={`上一輪退回原因：${lastReject.reason}`} />
        )}
      </Card>

      <Card title={view.itemsEditable ? "品項明細（可編輯）" : "品項明細（唯讀：非草稿狀態不可修改）"}>
        <Table<PoItem> rowKey={(r) => `${r.sku}-${r.color}`} columns={itemColumns} dataSource={po.items} pagination={false} size="small" />
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={10}>
          <Card title="簽核歷程">
            <ApprovalTimeline history={po.statusHistory} />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="庫存趨勢（讀模型）">
            {po.readModels.stockTrend.belowSafety && (
              <Alert type="warning" showIcon message="目前在庫量低於安全庫存" style={{ marginBottom: 12 }} />
            )}
            <StockTrendChart trend={po.readModels.stockTrend} />
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}>
                <Statistic title="本單金額" value={po.readModels.budget.orderAmount} prefix="NT$" />
              </Col>
              <Col span={12}>
                <Statistic
                  title="部門月預算餘額"
                  value={po.readModels.budget.monthlyRemaining}
                  prefix="NT$"
                  valueStyle={overBudget ? { color: "#cf1322" } : undefined}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Modal
        title="退回此採購單"
        open={rejectOpen}
        onOk={handleReject}
        confirmLoading={reject.isPending}
        onCancel={() => setRejectOpen(false)}
        destroyOnClose
      >
        <Form form={rejectForm} layout="vertical" preserve={false}>
          <Form.Item name="reason" label="退回原因" rules={[{ required: true, message: "退回原因必填" }]}>
            <Input.TextArea rows={3} maxLength={200} showCount placeholder="例：供應商交期超過生產排程，請改單或換供應商" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
