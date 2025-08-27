import { createHashRouter } from "react-router-dom";
//import { HomePage } from "../pages/home/Home";
import { LoginPage } from "../pages/login/Login";
import { App } from "../App";
import { GuardRoute } from "./GuardRoute";
//import HomeStreaming from "../pages/home/HomeStreaming";
import HomeStreamingChat from "../pages/home/HomeStreamingChat";

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
            {/* <HomePage /> */}
            <HomeStreamingChat />
          </GuardRoute>
        ),
      },
    ],
  },
]);