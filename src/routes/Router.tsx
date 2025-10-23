import { createHashRouter } from "react-router-dom";
import { LoginPage } from "../pages/login/Login";
import { App } from "../App";
import { GuardRoute } from "./GuardRoute";
import ProtectedLayout from "../components/layout/ProtectedLayout";
import StreamingChat from "../pages/rag/StreamingChat";
import DocumentUpload from "../pages/upload/DocumentUpload";

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
          },
          {
            path: "upload",
            element: <DocumentUpload />,
          },
        ],
      },
    ],
  },
]);