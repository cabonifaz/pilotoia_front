import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../contexts/QueryAuthContext";
import { Loader } from "../components/loader/Loader";
import { useEffect } from "react";

export const GuardRoute = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading, user } = useAuthContext();

    useEffect(() => {
        // If not loading and not authenticated, redirect to login
        if (!isLoading && !isAuthenticated) {
            navigate("/", { replace: true });
        }
    }, [isLoading, isAuthenticated, navigate]);

    // Show loader while checking authentication
    if (isLoading) {
        return (
            <div style={{ position: "relative" }}>
                <Loader />
            </div>
        );
    }

    // If not authenticated, don't render children (will be redirected)
    if (!isAuthenticated || !user) {
        return null;
    }

    // If authenticated, render protected content
    return <>{children}</>;
};