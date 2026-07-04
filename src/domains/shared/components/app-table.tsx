import { Table, type TableProps } from "antd";

export interface PageParams {
  page: number;
  pageSize: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
}

interface AppTableProps<T> extends Omit<TableProps<T>, "dataSource" | "pagination" | "loading"> {
  /** 中台回傳的伺服器端分頁結果（禁止抓全量前端分頁） */
  data: PagedResult<T> | undefined;
  isLoading: boolean;
  pageParams: PageParams;
  onPageChange: (params: PageParams) => void;
}

/**
 * 伺服器端分頁表格的統一封裝：分頁/篩選一律由中台計算，
 * 前端只回報 page/pageSize，搭配 TanStack Query 的 placeholderData: keepPreviousData 使用。
 */
export function AppTable<T extends object>({
  data,
  isLoading,
  pageParams,
  onPageChange,
  ...tableProps
}: AppTableProps<T>) {
  return (
    <Table<T>
      {...tableProps}
      dataSource={data?.items}
      loading={isLoading}
      pagination={{
        current: pageParams.page,
        pageSize: pageParams.pageSize,
        total: data?.total ?? 0,
        showSizeChanger: true,
        showTotal: (total) => `共 ${total} 筆`,
        onChange: (page, pageSize) => onPageChange({ page, pageSize }),
      }}
    />
  );
}
