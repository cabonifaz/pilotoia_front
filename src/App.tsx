import { Outlet } from "react-router-dom";
import { Toaster } from "./components/shadcn/toaster";
import { QueryAuthProvider } from "./contexts/QueryAuthContext";
import "./App.css";

export const App = () => {
  return (
    <QueryAuthProvider>
      <div className="app font-sans text-sm">
        <Outlet />
        <Toaster />
      </div>
    </QueryAuthProvider>
  );
};