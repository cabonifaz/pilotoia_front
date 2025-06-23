// toastService.ts
import { createRoot } from "react-dom/client";
import { Toast } from "./Toast"; // tu componente

type ToastType = "success" | "error" | "info" | "warning";

export const toast = (
  message: string,
  options?: { type?: ToastType; duration?: number }
) => {
  const toastElement = document.createElement("div");
  document.body.appendChild(toastElement);

  const removeToast = () => {
    document.body.removeChild(toastElement);
  };

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
