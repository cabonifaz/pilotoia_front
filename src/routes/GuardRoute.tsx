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
                console.log('*** GUARD ROUTE - VALIDATING JWT COOKIE ***');
                await apiClient.get('/v1/auth/validate'); // We need to create this endpoint
                
                console.log('*** GUARD ROUTE - JWT VALID ***');
                setIsChecking(false);
            } catch (error: any) {
                console.log('*** GUARD ROUTE - JWT INVALID OR EXPIRED ***');
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