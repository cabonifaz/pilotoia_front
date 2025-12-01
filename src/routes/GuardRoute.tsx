import { type ReactNode } from "react";
import { useNavigate, useMatches } from "react-router-dom";
import { useQueryAuthContext } from "../contexts/QueryAuthContext";
import { Loader } from "../components/loader/Loader";
import { useEffect } from "react";

export const GuardRoute = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate();
    const matches = useMatches();
    const { isAuthenticated, isLoading, isLoggingOut, user } = useQueryAuthContext();

    const currentRoute = matches[matches.length - 1];
    const allowedRoles = (currentRoute?.handle as { allowedRoles?: number[] })?.allowedRoles;

    useEffect(() => {
        // If not loading and not authenticated, redirect to login
        if (!isLoading && !isAuthenticated) {
            navigate("/", { replace: true });
        }
    }, [isLoading, isAuthenticated, navigate]);

    useEffect(() => {
        const roleId = user?.id_tipo_rol;

        if (allowedRoles && roleId !== undefined && !allowedRoles.includes(roleId)) {
            navigate("/unauthorized", { replace: true });
        }
    }, [allowedRoles, user, navigate]);


    // Show loader while checking authentication
    if (isLoading) {
        return (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
                <Loader text={isLoggingOut ? "Cerrando Sesión" : undefined} />
            </div>
        );
    }

    // If not authenticated, don't render children (will be redirected)
    if (!isAuthenticated || !user) {
        return null;
    }

    if (allowedRoles && !allowedRoles.includes(user?.id_tipo_rol)) {
        return null;
    }

    // If authenticated, render protected content
    return <>{children}</>;
};