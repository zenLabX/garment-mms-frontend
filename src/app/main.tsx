import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProviders } from "./providers";

async function enableMocking() {
  // 骨架階段以 msw 假資料驅動整個 app；接通中台後改為只在 DEV 啟用或整段移除
  if (!import.meta.env.DEV) return;
  const { worker } = await import("@/mocks/browser");
  await worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <AppProviders />
    </StrictMode>,
  );
});
