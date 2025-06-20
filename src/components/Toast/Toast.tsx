import { useEffect, useState } from "react";
import { X } from "lucide-react";
import "./Toast.css";
import { createRoot } from "react-dom/client";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose?: () => void;
}

export const Toast = ({ message, type = "info", duration = 4000, onClose }: ToastProps) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            onClose?.();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!visible) return null;

    return (
        <div className={`toast toast-${type}`}>
            <div className="toast-content">
                <span>{message}</span>
                <button onClick={() => setVisible(false)} className="toast-close">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export const toast = (message: string, options?: { type?: ToastType; duration?: number }) => {
    const toastElement = document.createElement("div");
    document.body.appendChild(toastElement);

    const removeToast = () => {
        document.body.removeChild(toastElement);
    };

    // Usamos ReactDOM.render o createRoot en React 18+
    // Esto es un ejemplo simplificado
    const root = createRoot(toastElement);
    root.render(
        <Toast
            message={message}
            type={options?.type}
            duration={options?.duration}
            onClose={removeToast}
        />
    );
};