export interface CurrentUser {
  id: string;
  name: string;
  roleLabel: string; // 顯示用；前端不拿 role 做任何業務判斷
  actingFor?: { id: string; name: string; reason: string }; // 代理簽核關係
}

export interface MenuEntry {
  key: string; // 路由 path，路由守衛以此比對
  label: string;
}
