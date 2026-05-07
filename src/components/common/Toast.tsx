import React from "react";
import { useAppStore } from "../../stores/useAppStore";

export const Toast: React.FC = () => {
  const { toasts } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: "var(--z-toast)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            padding: "12px 20px",
            borderRadius: "var(--radius-md)",
            background:
              toast.type === "success"
                ? "var(--color-success-light)"
                : toast.type === "error"
                ? "var(--color-error-light)"
                : "var(--color-surface-warm)",
            color:
              toast.type === "success"
                ? "var(--color-success)"
                : toast.type === "error"
                ? "var(--color-error)"
                : "var(--color-text)",
            boxShadow: "var(--shadow-md)",
            fontSize: "var(--text-sm)",
            animation: "slideIn 0.2s ease",
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};
