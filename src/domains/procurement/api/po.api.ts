import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/domains/shared/api/axios-instance";
import type { PagedResult, PageParams } from "@/domains/shared/components/app-table";
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
 * 未來儀表板/待辦上線時，在這裡加 invalidate(dashboardKeys.all)、invalidate(todoKeys.all)
 * ——跨模組連動集中宣告於此，不散落在元件裡。
 */
function usePoAction(id: string, action: "approve" | "reject" | "withdraw") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body?: { reason?: string }) =>
      (await axiosInstance.post<PoDetail>(`/pos/${id}/${action}`, body ?? {})).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: poKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: poKeys.lists() });
    },
  });
}

export const useApprovePo = (id: string) => usePoAction(id, "approve");
export const useRejectPo = (id: string) => usePoAction(id, "reject");
export const useWithdrawPo = (id: string) => usePoAction(id, "withdraw");
