"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (requireAdmin && !user.is_admin) {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router, requireAdmin]);

  if (loading) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center min-h-[50vh]">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-b-2 border-l-2 border-purple-500 animate-spin [animation-duration:1.5s]"></div>
        </div>
        <p className="mt-6 text-sm text-zinc-400 font-mono tracking-wider uppercase animate-pulse">
          Verifying credentials...
        </p>
      </div>
    );
  }

  if (!user || (requireAdmin && !user.is_admin)) {
    return null;
  }

  return <>{children}</>;
}
