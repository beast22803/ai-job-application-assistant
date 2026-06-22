"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await register({ name, email, password });
    } catch (err: any) {
      setError(err.message || "Failed to register. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md space-y-8 p-8 sm:p-10 bg-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="text-center relative">
          <h2 className="text-3xl font-black tracking-tight text-white uppercase font-sans">
            Get <span className="text-[#FF4500]">Started</span>
          </h2>
          <p className="mt-2 text-sm text-zinc-400 font-mono">
            Create an account to scale your applications
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono flex items-center gap-2">
            <span className="material-symbols-rounded text-sm">error</span>
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-5 relative" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white font-sans text-sm focus:outline-none focus:border-[#FF4500]/50 transition-colors placeholder:text-zinc-600"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="email-address" className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white font-sans text-sm focus:outline-none focus:border-[#FF4500]/50 transition-colors placeholder:text-zinc-600"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white font-sans text-sm focus:outline-none focus:border-[#FF4500]/50 transition-colors placeholder:text-zinc-600"
                placeholder="Minimum 8 characters"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white font-sans text-sm focus:outline-none focus:border-[#FF4500]/50 transition-colors placeholder:text-zinc-600"
                placeholder="Repeat password"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-[#FF4500] to-orange-600 hover:brightness-110 active:scale-[0.98] transition-all focus:outline-none disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
              ) : (
                "CREATE ACCOUNT"
              )}
            </button>
          </div>
        </form>

        <div className="text-center font-mono text-[10px] text-zinc-500 relative">
          Already have an account?{" "}
          <Link href="/login" className="text-[#FF4500] hover:underline font-semibold">
            SIGN IN
          </Link>
        </div>
      </div>
    </div>
  );
}
