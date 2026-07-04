import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/domains/shared/api/axios-instance";
import type { PagedResult, PageParams } from "@/domains/shared/components/app-table";
// 跨 domain 只 import「keys 物件」做失效連動，不 import hooks / 元件（耦合方向規範）
import { inventoryKeys } from "@/domains/inventory/api/inventory.api";
import type { PoDetail, PoListItem, PoStatus } from "../model/po.model";

export interface PoListParams extends PageParams {
  status?: PoStatus;
}

/** Query key factory：全 domain 的 key 只從這裡拿，禁止裸字串（invalidation 連動才不會漏） */
export const poKeys = {
  all: ["po"] as const,
  lists: () => [...poKeys.all, "list"] as const,
  list: (params: PoListParams) => [...poKeys.lists(), params] as const,
  details: () => [...poKeys.all, "detail"] as const,
  detail: (id: string) => [...poKeys.details(), id] as const,
};

export function usePoList(params: PoListParams) {
  return useQuery({
    queryKey: poKeys.list(params),
    queryFn: async () =>
      (await axiosInstance.get<PagedResult<PoListItem>>("/pos", { params })).data,
    placeholderData: keepPreviousData, // 換頁時保留舊資料，避免表格閃爍
  });
}

export function usePoDetail(id: string) {
  return useQuery({
    queryKey: poKeys.detail(id),
    queryFn: async () => (await axiosInstance.get<PoDetail>(`/pos/${id}`)).data,
  });
}

/**
 * 簽核動作共用的 mutation 建構：成功後 invalidate 詳情 + 所有列表。
 * 跨模組連動集中宣告於此，不散落在元件裡——要盤點「核准會連動哪些畫面」，
 * grep 這裡 invalidate 的 keys 就是全貌。未來待辦上線時同樣在這裡加 invalidate(todoKeys.all)。
 */
function usePoAction(id: string, action: "approve" | "reject" | "withdraw") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body?: { reason?: string }) =>
      (await axiosInstance.post<PoDetail>(`/pos/${id}/${action}`, body ?? {})).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: poKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: poKeys.lists() });
      // 採購核准/退回改變在途量 → 庫存看板自動刷新（跨 domain 連動就這一行）
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.dashboards() });
    },
  });
}

export const useApprovePo = (id: string) => usePoAction(id, "approve");
export const useRejectPo = (id: string) => usePoAction(id, "reject");
export const useWithdrawPo = (id: string) => usePoAction(id, "withdraw");
