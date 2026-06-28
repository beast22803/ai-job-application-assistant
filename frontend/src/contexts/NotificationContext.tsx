"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type NotificationType = "success" | "error" | "info" | "warning";

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextProps {
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  showInfo: (msg: string) => void;
  showWarning: (msg: string) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((message: string, type: NotificationType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  const showSuccess = useCallback((msg: string) => addNotification(msg, "success"), [addNotification]);
  const showError = useCallback((msg: string) => addNotification(msg, "error"), [addNotification]);
  const showInfo = useCallback((msg: string) => addNotification(msg, "info"), [addNotification]);
  const showWarning = useCallback((msg: string) => addNotification(msg, "warning"), [addNotification]);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showSuccess, showError, showInfo, showWarning }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {notifications.map((n) => {
          let bgColor = "bg-[#111111]/95";
          let borderColor = "border-neutral-800";
          let textColor = "text-neutral-200";
          let icon = "info";
          let iconColor = "text-[#8E8E93]";

          if (n.type === "success") {
            bgColor = "bg-[#0A1C0E]/95";
            borderColor = "border-[#30D158]/35";
            textColor = "text-[#30D158]";
            icon = "check_circle";
            iconColor = "text-[#30D158]";
          } else if (n.type === "error") {
            bgColor = "bg-[#1C0A0A]/95";
            borderColor = "border-[#FF453A]/35";
            textColor = "text-[#FF453A]";
            icon = "error";
            iconColor = "text-[#FF453A]";
          } else if (n.type === "warning") {
            bgColor = "bg-[#1C160A]/95";
            borderColor = "border-[#FF9F0A]/35";
            textColor = "text-[#FF9F0A]";
            icon = "warning";
            iconColor = "text-[#FF9F0A]";
          }

          return (
            <div
              key={n.id}
              onClick={() => removeNotification(n.id)}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${bgColor} ${borderColor} ${textColor} backdrop-blur-md shadow-2xl cursor-pointer transition-all duration-300 transform translate-y-0 animate-[toastIn_0.35s_cubic-bezier(0.16,1,0.3,1)_both] hover:scale-[1.02]`}
              style={{
                boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)"
              }}
            >
              <span className={`material-symbols-rounded text-lg mt-0.5 ${iconColor}`}>
                {icon}
              </span>
              <div className="text-xs font-semibold leading-relaxed flex-1 whitespace-pre-line">
                {n.message}
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(n.id);
                }}
                className="text-neutral-500 hover:text-white transition-colors mt-0.5 ml-2 font-mono text-[10px]"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
