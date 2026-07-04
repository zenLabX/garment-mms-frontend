import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/domains/shared/api/axios-instance";
import type { PagedResult, PageParams } from "@/domains/shared/components/app-table";
import type { MaterialDetail, MaterialFormValues, MaterialListItem } from "../model/material.model";

export interface MaterialListParams extends PageParams {
  keyword?: string;
}

/** Query key factory：全 domain 的 key 只從這裡拿，禁止裸字串（invalidation 連動才不會漏） */
export const materialKeys = {
  all: ["material"] as const,
  lists: () => [...materialKeys.all, "list"] as const,
  list: (params: MaterialListParams) => [...materialKeys.lists(), params] as const,
  details: () => [...materialKeys.all, "detail"] as const,
  detail: (id: string) => [...materialKeys.details(), id] as const,
};

export function useMaterialList(params: MaterialListParams) {
  return useQuery({
    queryKey: materialKeys.list(params),
    queryFn: async () =>
      (await axiosInstance.get<PagedResult<MaterialListItem>>("/materials", { params })).data,
    placeholderData: keepPreviousData, // 換頁/搜尋時保留舊資料，避免表格閃爍
  });
}

/** 表單頁新建/編輯共用：新建模式 id 為 undefined → enabled 為 false，不打 API */
export function useMaterialDetail(id: string | undefined) {
  return useQuery({
    queryKey: materialKeys.detail(id ?? ""),
    queryFn: async () => (await axiosInstance.get<MaterialDetail>(`/materials/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: MaterialFormValues) =>
      (await axiosInstance.post<MaterialDetail>("/materials", values)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: materialKeys.lists() });
    },
  });
}

export function useUpdateMaterial(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: MaterialFormValues) =>
      (await axiosInstance.put<MaterialDetail>(`/materials/${id}`, values)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: materialKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: materialKeys.lists() });
    },
  });
}
