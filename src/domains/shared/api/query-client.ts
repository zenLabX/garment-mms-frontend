import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import axios from "axios";

// 唯一的錯誤訊息萃取層：全專案不要在各 domain 重寫 extractErrorMessage
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return "發生未知錯誤，請稍後再試";
}

function notifyError(error: unknown) {
  // 401 由 axios 攔截器導頁處理，不重複跳通知
  if (axios.isAxiosError(error) && error.response?.status === 401) return;
  notification.error({ message: "操作失敗", description: extractErrorMessage(error) });
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: notifyError }),
  mutationCache: new MutationCache({ onError: notifyError }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
