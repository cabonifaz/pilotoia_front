import { Outlet } from "react-router-dom";
import { Toaster } from "./components/shadcn/toaster";
import "./App.css";

export const App = () => {
  return (
    <div className="app">
      <Outlet />
      <Toaster />
    </div>
  );
};