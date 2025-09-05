import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "../components/Toast/ToastService";
import { authApi } from "../api/authApi";
import { Loader } from "../components/loader/Loader";

export const GuardRoute = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const isValid = await authApi.validateToken();
            if (!isValid) {
                toast("Sesión caducada, vuelve a iniciar sesión", { type: "warning" });
                navigate("/login");
            }
            setIsChecking(false);
        };

        checkAuth();
    }, [navigate]);

    return (
        <div style={{ position: "relative" }}>
            {children}
            {isChecking && <Loader />}
        </div>
    );
};