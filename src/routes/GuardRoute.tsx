import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "../components/Toast/Toast";
import { validateToken } from "../utils/auth";

export const GuardRoute = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            const isValid = await validateToken();
            if (!isValid) {
                toast("Sesión caducada, vuelve a iniciar sesión", { type: "error" });
                navigate("/login");
            }
        };

        checkAuth();
    }, [navigate]);

    return children;
};