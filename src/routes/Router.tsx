import { createHashRouter } from "react-router-dom";
import { LoginPage } from "../pages/login/Login";
import { App } from "../App";
import { GuardRoute } from "./GuardRoute";
import HomeStreamingChat from "../pages/home/HomeStreamingChat";
//import DocumentUpload from "../pages/upload/DocumentUpload";

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
        path: "rag",
        element: (
          <GuardRoute>
            <HomeStreamingChat />
          </GuardRoute>
        ),
      },
      /*{
        path: "upload",
        element: (
          <GuardRoute>
            <DocumentUpload />
          </GuardRoute>
        ),
      },*/
    ],
  },
]);