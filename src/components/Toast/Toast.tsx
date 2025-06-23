import { useEffect, useRef, useState } from "react";
import { Info, CheckCircle, XCircle, AlertTriangle, type LucideIcon } from "lucide-react";
import "./Toast.css";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose?: () => void;
}

const icons: Record<ToastType, LucideIcon> = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
};

export const Toast = ({ message, type = "info", duration = 4000, onClose }: ToastProps) => {
    const [visible, setVisible] = useState(true);
    const [isHovering, setIsHovering] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!isHovering) {
            timerRef.current = setTimeout(() => {
                setVisible(false);
                onClose?.();
            }, duration);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [duration, isHovering, onClose]);

    if (!visible) return null;

    const Icon = icons[type];

    return (
        <div
            className={`toast toast-${type}`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div className="toast-icon">
                <Icon size={24} />
            </div>
            <div className="toast-message">{message}</div>
        </div>
    );
};
