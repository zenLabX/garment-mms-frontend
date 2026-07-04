import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./app-layout";
import { PoListPage } from "@/domains/procurement/pages/po-list-page";
import { PoDetailPage } from "@/domains/procurement/pages/po-detail-page";
import { MaterialListPage } from "@/domains/material/pages/material-list-page";
import { MaterialFormPage } from "@/domains/material/pages/material-form-page";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <Navigate to="/procurement/pos" replace /> },
      { path: "/procurement/pos", element: <PoListPage /> },
      { path: "/procurement/pos/:id", element: <PoDetailPage /> },
      { path: "/material/materials", element: <MaterialListPage /> },
      { path: "/material/materials/new", element: <MaterialFormPage /> },
      { path: "/material/materials/:id/edit", element: <MaterialFormPage /> },
    ],
  },
]);
