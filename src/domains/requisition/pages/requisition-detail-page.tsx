import { useState } from "react";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  Alert,
  App,
  Card,
  Descriptions,
  Flex,
  Form,
  Input,
  Modal,
  Skeleton,
  Space,
  Table,
  Timeline,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { CapabilityButton } from "@/domains/shared/components/capability-button";
import { StatusTag } from "@/domains/shared/components/status-tag";
import {
  useApproveRequisition,
  useIssueRequisition,
  useRejectRequisition,
  useRequisitionDetail,
  useWithdrawRequisition,
} from "../api/requisition.api";
import {
  reqRejectFormSchema,
  reqStatusViewMap,
  type ReqLine,
  type ReqRejectFormValues,
} from "../model/requisition.model";

const lineColumns: ColumnsType<ReqLine> = [
  { title: "料號", dataIndex: "sku" },
  { title: "品名", dataIndex: "name" },
  { title: "數量", dataIndex: "qty", align: "right", render: (v: number, r) => `${v.toLocaleString()} ${r.unit}` },
];

export function RequisitionDetailPage() {
  const { id = "" } = useParams();
  const { message } = App.useApp();
  const { data: req, isLoading } = useRequisitionDetail(id);
  const approve = useApproveRequisition(id);
  const reject = useRejectRequisition(id);
  const issue = useIssueRequisition(id);
  const withdraw = useWithdrawRequisition(id); // 樂觀更新示範（取捨說明見 requisition.api.ts）
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectForm] = Form.useForm<ReqRejectFormValues>();

  if (isLoading || !req) return <Skeleton active />;

  // 畫面行為只查狀態對照表；「能不能按」只讀中台能力旗標——元件內不寫業務規則
  const view = reqStatusViewMap[req.status];
  const lastReject = [...req.statusHistory].reverse().find((h) => h.status === "Rejected");

  const handleReject = async () => {
    const values = await rejectForm.validateFields();
    const parsed = reqRejectFormSchema.safeParse(values); // API 邊界一律過 zod
    if (!parsed.success) return;
    await reject.mutateAsync(parsed.data);
    setRejectOpen(false);
    message.success("已退回");
  };

  return (
    <Space direction="vertical" size={16} style={{ display: "flex" }}>
      <Card>
        <Flex justify="space-between" align="center">
          <Space size={12}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {req.reqNo}
            </Typography.Title>
            <StatusTag meta={view.tag} />
          </Space>
          <Space>
            <CapabilityButton capability={req.canWithdraw} onClick={() => withdraw.mutate()} loading={withdraw.isPending}>
              撤回修改
            </CapabilityButton>
            <CapabilityButton capability={req.canReject} danger onClick={() => setRejectOpen(true)}>
              退回
            </CapabilityButton>
            <CapabilityButton capability={req.canApprove} type="primary" onClick={() => approve.mutate({})} loading={approve.isPending}>
              核准
            </CapabilityButton>
            <CapabilityButton capability={req.canIssue} type="primary" onClick={() => issue.mutate({})} loading={issue.isPending}>
              確認發料
            </CapabilityButton>
          </Space>
        </Flex>
        <Descriptions
          style={{ marginTop: 16 }}
          items={[
            { key: "department", label: "領用部門", children: req.department },
            { key: "purpose", label: "用途", children: req.purpose },
            { key: "neededDate", label: "需求日期", children: req.neededDate },
            { key: "updated", label: "最後異動", children: req.updatedAt },
          ]}
        />
        {view.showRejectReason && lastReject && (
          <Alert type="error" showIcon message={`退回原因：${lastReject.reason}`} />
        )}
      </Card>

      <Card title="領料明細">
        <Table<ReqLine> rowKey="sku" columns={lineColumns} dataSource={req.lines} pagination={false} size="small" />
      </Card>

      <Card title="簽核歷程">
        <Timeline
          items={req.statusHistory.map((entry) => ({
            color: reqStatusViewMap[entry.status].tag.color === "error" ? "red" : "blue",
            children: (
              <Space direction="vertical" size={0}>
                <Space size={8}>
                  <StatusTag meta={reqStatusViewMap[entry.status].tag} />
                  <Typography.Text>{entry.by}</Typography.Text>
                </Space>
                <Typography.Text type="secondary">{dayjs(entry.at).format("YYYY-MM-DD HH:mm")}</Typography.Text>
                {entry.reason && <Typography.Text type="danger">原因：{entry.reason}</Typography.Text>}
              </Space>
            ),
          }))}
        />
      </Card>

      <Modal
        title="退回此領料單"
        open={rejectOpen}
        onOk={handleReject}
        confirmLoading={reject.isPending}
        onCancel={() => setRejectOpen(false)}
        destroyOnClose
      >
        <Form form={rejectForm} layout="vertical" preserve={false}>
          <Form.Item name="reason" label="退回原因" rules={[{ required: true, message: "退回原因必填" }]}>
            <Input.TextArea rows={3} maxLength={200} showCount placeholder="例：用途說明不足，請補訂單編號" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
