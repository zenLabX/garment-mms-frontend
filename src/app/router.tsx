import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./app-layout";
import { PoListPage } from "@/domains/procurement/pages/po-list-page";
import { PoDetailPage } from "@/domains/procurement/pages/po-detail-page";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <Navigate to="/procurement/pos" replace /> },
      { path: "/procurement/pos", element: <PoListPage /> },
      { path: "/procurement/pos/:id", element: <PoDetailPage /> },
    ],
  },
]);
