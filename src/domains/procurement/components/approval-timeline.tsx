import { Timeline, Typography } from "antd";
import dayjs from "dayjs";
import { poStatusViewMap, type PoStatusHistoryEntry } from "../model/po.model";

const dotColor: Record<string, string> = {
  error: "red",
  success: "green",
  processing: "blue",
  default: "gray",
};

/** 簽核歷程時間軸：讓使用者一眼看出「走過哪些關卡、卡在哪、被退回原因」 */
export function ApprovalTimeline({ history }: { history: PoStatusHistoryEntry[] }) {
  return (
    <Timeline
      items={history.map((entry) => {
        const view = poStatusViewMap[entry.status];
        return {
          color: dotColor[view.tag.color] ?? "gray",
          children: (
            <>
              <Typography.Text strong>{view.tag.label}</Typography.Text>
              <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                {entry.by}・{dayjs(entry.at).format("YYYY/MM/DD HH:mm")}
              </Typography.Text>
              {entry.reason && (
                <div>
                  <Typography.Text type="danger">原因：{entry.reason}</Typography.Text>
                </div>
              )}
            </>
          ),
        };
      })}
    />
  );
}
