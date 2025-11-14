import { createHashRouter } from "react-router-dom";
import { LoginPage } from "../pages/login/Login";
import { App } from "../App";
import { GuardRoute } from "./GuardRoute";
import ProtectedLayout from "../components/layout/ProtectedLayout";
import StreamingChat from "../pages/rag/StreamingChat";
import DocumentUpload from "../pages/upload/DocumentUpload";
import CompanyManagement from "../pages/company/CompanyManagement";
import AreaManagement from "../pages/area/AreaManagement";

export const router = createHashRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
      {
        element: (
          <GuardRoute>
            <ProtectedLayout />
          </GuardRoute>
        ),
        children: [
          {
            path: "rag",
            element: <StreamingChat />,
            handle: { allowedRoles: [1, 2, 3] },
          },
          {
            path: "upload",
            element: <DocumentUpload />,
            handle: { allowedRoles: [1, 2] },
          },
          {
            path: "company",
            element: <CompanyManagement />,
            handle: { allowedRoles: [1] },
          },
          {
            path: "area",
            element: <AreaManagement />,
            handle: { allowedRoles: [1, 2] },
          },
          {
            path: "unauthorized",
            element: (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <h1>403 - Acceso denegado</h1>
                <p>No tienes permiso para acceder a esta página.</p>
              </div>
            ),
          },
        ],
      },
    ],
  },
]);