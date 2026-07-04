import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/domains/shared/api/axios-instance";
import type { CurrentUser, MenuEntry } from "../model/identity.model";

export const identityKeys = {
  all: ["identity"] as const,
  me: () => [...identityKeys.all, "me"] as const,
  menu: () => [...identityKeys.all, "menu"] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: identityKeys.me(),
    queryFn: async () => (await axiosInstance.get<CurrentUser>("/identity/me")).data,
  });
}

/**
 * 伺服器驅動選單：中台依使用者權限回傳可視選單清單，
 * 前端路由守衛單純比對這份清單，不自己推導 role→permission。
 */
export function usePermittedMenu() {
  return useQuery({
    queryKey: identityKeys.menu(),
    queryFn: async () => (await axiosInstance.get<MenuEntry[]>("/identity/menu")).data,
  });
}
