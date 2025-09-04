import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "../hooks/use-toast";
import apiClient from "../api/apiClient";
import { Loader } from "../components/loader/Loader";

export const GuardRoute = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Make a simple API call that requires JWT authentication
                // This will validate the HttpOnly JWT cookie on the backend
                await apiClient.get('/v1/auth/validate'); // We need to create this endpoint
                setIsChecking(false);
            } catch (error: any) {
                console.error('Auth validation failed:', error);
                
                // Clear any existing session data
                sessionStorage.removeItem('user_session');
                
                toast({
                    title: "Sesión caducada",
                    description: "Vuelve a iniciar sesión",
                    variant: "destructive"
                });
                
                navigate("/login");
                setIsChecking(false);
            }
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