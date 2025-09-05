import { createHashRouter } from "react-router-dom";
import { HomePage } from "../pages/home/Home";
import { LoginPage } from "../pages/login/Login";
import { App } from "../App";
import { GuardRoute } from "./GuardRoute";

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
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "home",
        element: (
          <GuardRoute>
            <HomePage />
          </GuardRoute>
        ),
      },
    ],
  },
]);