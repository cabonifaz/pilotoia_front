import { createBrowserRouter } from "react-router-dom";
import { HomePage } from "../pages/home/Home";
import { LoginPage } from "../pages/login/Login";
import { App } from "../App";
import { GuardRoute } from "./GuardRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
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