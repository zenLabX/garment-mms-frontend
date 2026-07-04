import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { App as AntdApp, ConfigProvider } from "antd";
import zhTW from "antd/locale/zh_TW";
import { RouterProvider } from "react-router-dom";
import { queryClient } from "@/domains/shared/api/query-client";
import { router } from "./router";

/**
 * 企業主題色集中在這個 token 物件（純 JS 設定，不用寫 CSS）。
 * 設計師給的主題規格 → 對照 https://ant.design/docs/react/customize-theme-cn 填入。
 */
const brandTheme = {
  token: {
    colorPrimary: "#2f54eb",
    borderRadius: 4,
  },
};

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={zhTW} theme={brandTheme}>
        <AntdApp>
          <RouterProvider router={router} />
        </AntdApp>
      </ConfigProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
