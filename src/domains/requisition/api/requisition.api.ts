import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/domains/shared/api/axios-instance";
import type { PagedResult, PageParams } from "@/domains/shared/components/app-table";
import { inventoryKeys } from "@/domains/inventory/api/inventory.api";
import type { ReqDetail, ReqDraftValues, ReqListItem, ReqStatus } from "../model/requisition.model";

export interface ReqListParams extends PageParams {
  status?: ReqStatus;
}

/** Query key factory：全 domain 的 key 只從這裡拿，禁止裸字串 */
export const requisitionKeys = {
  all: ["requisition"] as const,
  lists: () => [...requisitionKeys.all, "list"] as const,
  list: (params: ReqListParams) => [...requisitionKeys.lists(), params] as const,
  details: () => [...requisitionKeys.all, "detail"] as const,
  detail: (id: string) => [...requisitionKeys.details(), id] as const,
};

export function useRequisitionList(params: ReqListParams) {
  return useQuery({
    queryKey: requisitionKeys.list(params),
    queryFn: async () =>
      (await axiosInstance.get<PagedResult<ReqListItem>>("/requisitions", { params })).data,
    placeholderData: keepPreviousData,
  });
}

export function useRequisitionDetail(id: string) {
  return useQuery({
    queryKey: requisitionKeys.detail(id),
    queryFn: async () => (await axiosInstance.get<ReqDetail>(`/requisitions/${id}`)).data,
  });
}

/** 超領檢查在中台（庫存不足回 422），錯誤訊息由全域 onError 呈現，前端不寫庫存規則 */
export function useCreateRequisition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: ReqDraftValues) =>
      (await axiosInstance.post<ReqDetail>("/requisitions", values)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: requisitionKeys.lists() });
      // 建單會佔用可用量（reserved）→ 連動失效庫存 domain 的快取
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

/**
 * 簽核/發料動作共用的 mutation 建構：成功後 invalidate 詳情 + 列表，
 * 並連動失效庫存快取（核准改變占用、發料改變在庫）——跨模組連動集中宣告於此，不散落在元件。
 */
function useReqAction(id: string, action: "approve" | "reject" | "issue") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body?: { reason?: string }) =>
      (await axiosInstance.post<ReqDetail>(`/requisitions/${id}/${action}`, body ?? {})).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: requisitionKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: requisitionKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export const useApproveRequisition = (id: string) => useReqAction(id, "approve");
export const useRejectRequisition = (id: string) => useReqAction(id, "reject");
export const useIssueRequisition = (id: string) => useReqAction(id, "issue");

/**
 * 樂觀更新的「取捨示範」：只有撤回做 optimistic——因為結果前端 100% 可預測（必回 Draft）。
 * approve / reject 不做：簽核後的能力旗標、歷程由中台計算，前端猜不準，保守 invalidate 即可。
 */
export function useWithdrawRequisition(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await axiosInstance.post<ReqDetail>(`/requisitions/${id}/withdraw`)).data,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: requisitionKeys.detail(id) });
      const previous = queryClient.getQueryData<ReqDetail>(requisitionKeys.detail(id));
      if (previous) {
        queryClient.setQueryData<ReqDetail>(requisitionKeys.detail(id), {
          ...previous,
          status: "Draft",
          canWithdraw: false,
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      // 回滾快照；錯誤訊息仍由全域 onError 呈現，這裡不重寫通知
      if (context?.previous) {
        queryClient.setQueryData(requisitionKeys.detail(id), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: requisitionKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: requisitionKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}
