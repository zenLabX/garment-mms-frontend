import { App, Button, Card, Flex, Form, Input, InputNumber, Select, Skeleton, Space, Typography } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateMaterial, useMaterialDetail, useUpdateMaterial } from "../api/material.api";
import {
  materialCategoryViewMap,
  materialFormSchema,
  type MaterialFormValues,
} from "../model/material.model";

/**
 * 新建 / 編輯共用表單頁：路由 /new 沒有 id → 新建；/:id/edit 有 id → 編輯。
 * useMaterialDetail 以 enabled: !!id 控制——新建模式完全不打 API。
 */
export function MaterialFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm<MaterialFormValues>();

  const { data: material, isLoading } = useMaterialDetail(id);
  const create = useCreateMaterial();
  const update = useUpdateMaterial(id ?? "");
  const isSaving = create.isPending || update.isPending;

  if (isEdit && (isLoading || !material)) return <Skeleton active />;

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const parsed = materialFormSchema.safeParse(values); // API 邊界一律過 zod
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? "表單資料有誤");
      return;
    }
    // 失敗（如料號重複回 400）由 queryClient 全域 onError 通知，這裡不各自 catch
    if (isEdit) {
      await update.mutateAsync(parsed.data);
      message.success("物料已更新");
    } else {
      await create.mutateAsync(parsed.data);
      message.success("物料已建立");
    }
    navigate("/material/materials");
  };

  return (
    <Card>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        {isEdit ? `編輯物料：${material?.sku}` : "新增物料"}
      </Typography.Title>
      <Form<MaterialFormValues>
        form={form}
        layout="vertical"
        style={{ maxWidth: 480 }}
        initialValues={material}
        preserve={false}
      >
        <Form.Item name="sku" label="料號" rules={[{ required: true, message: "料號必填" }]}>
          <Input placeholder="例：FAB-COT-320" disabled={isEdit} />
        </Form.Item>
        <Form.Item name="name" label="品名" rules={[{ required: true, message: "品名必填" }]}>
          <Input maxLength={50} placeholder="例：精梳棉 320g" />
        </Form.Item>
        <Form.Item name="category" label="分類" rules={[{ required: true, message: "請選擇分類" }]}>
          {/* 選項由對照表產生：新增分類時這裡零改動 */}
          <Select
            placeholder="請選擇分類"
            options={Object.entries(materialCategoryViewMap).map(([value, meta]) => ({
              value,
              label: meta.label,
            }))}
          />
        </Form.Item>
        <Form.Item name="unit" label="單位" rules={[{ required: true, message: "單位必填" }]}>
          <Input maxLength={10} placeholder="例：碼、個、箱" />
        </Form.Item>
        <Form.Item name="safetyStock" label="安全庫存" rules={[{ required: true, message: "安全庫存必填" }]}>
          <InputNumber min={0} precision={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="stdCost" label="標準成本（NT$）" rules={[{ required: true, message: "標準成本必填" }]}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="spec" label="規格說明">
          <Input.TextArea rows={3} maxLength={200} showCount placeholder="選填，例：門幅 150cm、成分 100% 棉" />
        </Form.Item>
        <Flex justify="flex-end">
          <Space>
            <Button onClick={() => navigate("/material/materials")}>取消</Button>
            <Button type="primary" onClick={handleSubmit} loading={isSaving}>
              {isEdit ? "儲存" : "建立"}
            </Button>
          </Space>
        </Flex>
      </Form>
    </Card>
  );
}
