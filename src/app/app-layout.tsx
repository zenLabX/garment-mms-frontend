import { Alert, Layout, Menu, Select, Space, Spin, Typography } from "antd";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCurrentUser, usePermittedMenu } from "@/domains/identity/api/identity.api";
import { getDemoUserId, setDemoUserId, DEMO_USERS } from "@/mocks/demo-user";
import { queryClient } from "@/domains/shared/api/query-client";

const { Header, Sider, Content } = Layout;

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: menu, isLoading } = usePermittedMenu();
  const { data: me } = useCurrentUser();

  if (isLoading) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  // 路由守衛：只比對中台回傳的可視清單，不在前端推導權限
  const permitted = menu?.some((m) => location.pathname.startsWith(m.key));
  if (menu && !permitted) {
    return <Navigate to={menu[0]?.key ?? "/"} replace />;
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography.Title level={4} style={{ color: "#fff", margin: 0 }}>
          成衣物料管理系統
        </Typography.Title>
        <Space>
          {/* 示範用角色切換器：模擬不同使用者登入，接通中台後移除 */}
          <Typography.Text style={{ color: "rgba(255,255,255,0.65)" }}>示範身分</Typography.Text>
          <Select
            style={{ width: 220 }}
            value={getDemoUserId()}
            options={DEMO_USERS.map((u) => ({ value: u.id, label: `${u.name}（${u.roleLabel}）` }))}
            onChange={(id) => {
              setDemoUserId(id);
              queryClient.invalidateQueries(); // 身分變了 → 所有 server state 重抓
            }}
          />
        </Space>
      </Header>
      <Layout>
        <Sider width={220} theme="light">
          <Menu
            mode="inline"
            selectedKeys={menu?.filter((m) => location.pathname.startsWith(m.key)).map((m) => m.key)}
            items={menu?.map((m) => ({ key: m.key, label: m.label }))}
            onClick={({ key }) => navigate(key)}
          />
        </Sider>
        <Content style={{ padding: 24 }}>
          {me?.actingFor && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message={`你正代理 ${me.actingFor.name} 簽核（${me.actingFor.reason}），操作將記錄為代理`}
            />
          )}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
