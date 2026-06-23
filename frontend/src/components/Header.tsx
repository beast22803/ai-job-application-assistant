"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <header className="pointer-events-auto flex items-center justify-between px-4 sm:px-6 py-3 border border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl rounded-full w-full max-w-5xl transition-all">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 transition-opacity hover:opacity-80">
          <div className="text-lg sm:text-xl font-black tracking-tighter uppercase">
            Job<span className="text-[#FF4500]">Analyser</span>
          </div>
        </Link>
        
        {user ? (
          <div className="hidden sm:flex bg-white/5 p-1 rounded-full border border-white/5 gap-1">
            <Link
              href="/dashboard"
              className={`font-mono text-[10px] font-semibold tracking-wider uppercase px-4 py-1.5 rounded-sm transition-all ${
                pathname === "/dashboard"
                  ? "bg-[#050505] text-[#FF4500] shadow-md"
                  : "text-[#8E8E93] hover:text-[#F5F5F5]"
              }`}
            >
              Analytics
            </Link>
            {!!user.is_admin && (
              <Link
                href="/admin"
                className={`font-mono text-[10px] font-semibold tracking-wider uppercase px-4 py-1.5 rounded-sm transition-all ${
                  pathname === "/admin"
                    ? "bg-[#050505] text-[#FF4500] shadow-md"
                    : "text-[#8E8E93] hover:text-[#F5F5F5]"
                }`}
              >
                Admin
              </Link>
            )}
            <Link
              href="/profile"
              className={`font-mono text-[10px] font-semibold tracking-wider uppercase px-4 py-1.5 rounded-sm transition-all ${
                pathname === "/profile"
                  ? "bg-[#050505] text-[#FF4500] shadow-md"
                  : "text-[#8E8E93] hover:text-[#F5F5F5]"
              }`}
            >
              Master Profile
            </Link>
            <Link
              href="/analyzer"
              className={`font-mono text-[10px] font-semibold tracking-wider uppercase px-4 py-1.5 rounded-sm transition-all ${
                pathname === "/analyzer"
                  ? "bg-[#050505] text-[#FF4500] shadow-md"
                  : "text-[#8E8E93] hover:text-[#F5F5F5]"
              }`}
            >
              New Analysis
            </Link>
          </div>
        ) : (
          <div /> // Spacer
        )}

        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 font-mono text-[10px] text-[#8E8E93] border border-white/10 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors pointer-events-auto cursor-pointer"
              >
                <span>{user.name.toUpperCase()}</span>
                <span className="material-symbols-rounded text-xs select-none">
                  {isOpen ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                </span>
              </button>
              
              {isOpen && (
                <div className="absolute right-0 mt-2.5 w-48 bg-[#0b0b0d]/90 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl p-2 z-50 animate-[fadeIn_0.15s_ease-out] flex flex-col gap-1 pointer-events-auto">
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="font-sans text-[11px] font-semibold text-white truncate">{user.name}</p>
                    <p className="font-mono text-[9px] text-[#8E8E93] truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-left font-mono text-[10px] text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all pointer-events-auto w-full cursor-pointer"
                  >
                    <span className="material-symbols-rounded text-sm">logout</span>
                    <span>LOG OUT</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            pathname !== "/login" && pathname !== "/register" && (
              <Link
                href="/login"
                className="font-mono text-[10px] text-emerald-500 border border-emerald-500/20 px-4 py-1.5 rounded-full bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors"
              >
                LOGIN
              </Link>
            )
          )}
        </div>
      </header>
    </div>
  );
}
