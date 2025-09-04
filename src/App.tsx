import { Outlet } from "react-router-dom";
import { Toaster } from "./components/shadcn/toaster";
import { AuthProvider } from "./contexts/AuthContext";
import "./App.css";

export const App = () => {
  return (
    <AuthProvider>
      <div className="app">
        <Outlet />
        <Toaster />
      </div>
    </AuthProvider>
  );
};