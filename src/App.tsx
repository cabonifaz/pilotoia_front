import { Outlet } from "react-router-dom";
import { Toaster } from "./components/shadcn/toaster";
import { QueryAuthProvider } from "./contexts/QueryAuthContext";

export const App = () => {
  return (
    <QueryAuthProvider>
      <div className="app font-sans">
        <Outlet />
        <Toaster />
      </div>
    </QueryAuthProvider>
  );
};