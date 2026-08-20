"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastOptions {
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (title: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const iconByVariant = {
  success: CheckCircle2,
  error: CircleAlert,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (title: string, options: ToastOptions = {}) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const nextToast: Toast = {
        id,
        title,
        description: options.description,
        variant: options.variant ?? "info",
      };

      setToasts((current) => [...current.slice(-3), nextToast]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((item) => {
          const Icon = iconByVariant[item.variant];
          return (
            <div
              key={item.id}
              role={item.variant === "error" ? "alert" : "status"}
              className={cn(
                "border-border bg-popover text-popover-foreground pointer-events-auto flex items-start gap-3 rounded-xl border p-3 shadow-lg",
                item.variant === "error" && "border-destructive/40",
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  item.variant === "success" && "text-success",
                  item.variant === "error" && "text-destructive",
                  item.variant === "info" && "text-primary",
                )}
              />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">{item.title}</p>
                {item.description ? (
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {item.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="text-muted-foreground hover:text-foreground rounded-sm p-0.5"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider.");
  }
  return context;
}
