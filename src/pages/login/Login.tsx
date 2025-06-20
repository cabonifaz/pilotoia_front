import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import "./Login.css";
import { useAtuh } from "../../hooks/useAuth";

type LoginFormData = {
    username: string;
    password: string;
};

export const LoginPage = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, errors, onSubmit, isLoading } = useAtuh();

    const handleFormSubmit = async (data: LoginFormData) => {
        const result = await onSubmit(data);
        if (result.success) {
            navigate('/home');
        }
    };

    return (
        <section className="login-container">
            <div className="login-card">
                <div className="logo-container">
                    <img
                        src="https://staffing.fractal.com.pe/img/fractal-logo.png"
                        alt="Logo Fractal"
                    />
                </div>
                <h2 className="login-title">Ingresa a tu cuenta</h2>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="login-form">
                    <input
                        {...register("username")}
                        type="text"
                        placeholder="Usuario"
                        className="login-input"
                        disabled={isLoading}
                    />
                    {errors.username && (
                        <p className="error-message">{errors.username.message}</p>
                    )}

                    <input
                        {...register("password")}
                        type="password"
                        placeholder="Contraseña"
                        className="login-input"
                        disabled={isLoading}
                    />
                    {errors.password && (
                        <p className="error-message">{errors.password.message}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="login-button"
                    >
                        {isLoading ? (
                            <Loader2 className="loader-icon" />
                        ) : (
                            "Ingresar"
                        )}
                    </button>
                </form>
            </div>
        </section>
    );
};