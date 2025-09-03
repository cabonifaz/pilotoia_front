import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "../hooks/use-toast";
//import { authApi } from "../api/authApi";
import { Loader } from "../components/loader/Loader";

export const GuardRoute = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            //const isValid = await authApi.validateToken();
            const isValid = true;
            if (!isValid) {
                toast({
                    title: "Sesión caducada",
                    description: "Vuelve a iniciar sesión",
                    variant: "destructive"
                });
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