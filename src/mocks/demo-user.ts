/**
 * 示範用「目前登入者」切換機制：讓骨架離線展示「同一張單、不同角色、不同能力旗標」。
 * 接通中台後整個 mocks/ 目錄移除，改由真實登入流程決定身分。
 */
const KEY = "demo_user";

export const DEMO_USERS = [
  { id: "amy", name: "Amy", roleLabel: "採購員（單據建立者）" },
  { id: "lisa", name: "Lisa", roleLabel: "副理（代理課長 Ken 簽核）" },
  { id: "wanda", name: "Wanda", roleLabel: "倉管（唯讀）" },
] as const;

export type DemoUserId = (typeof DEMO_USERS)[number]["id"];

export function getDemoUserId(): DemoUserId {
  const stored = localStorage.getItem(KEY);
  return (DEMO_USERS.some((u) => u.id === stored) ? stored : "amy") as DemoUserId;
}

export function setDemoUserId(id: DemoUserId) {
  localStorage.setItem(KEY, id);
}
