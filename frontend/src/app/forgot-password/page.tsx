"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import LinkComponent from "next/link";
import * as api from "@/services/api";
import { useNotifications } from "@/contexts/NotificationContext";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { showSuccess, showError, showWarning } = useNotifications();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [step, setStep] = useState<1 | 2>(1); // 1 = request code, 2 = reset password
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState(""); // Helper to show reset code in development

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showWarning("Please enter your email address.");
      return;
    }
    
    setLoading(true);
    try {
      const resp = await api.forgotPassword(email);
      showSuccess(resp.message || "Reset code generated!");
      if (resp.code) {
        setDevCode(resp.code);
      }
      setStep(2);
    } catch (err: any) {
      showError(err.message || "Failed to generate reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      showWarning("Please enter the 6-digit reset code.");
      return;
    }
    if (newPassword.length < 8) {
      showWarning("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showWarning("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const resp = await api.resetPassword({
        email: email.trim(),
        code: code.trim(),
        new_password: newPassword
      });
      showSuccess(resp.message || "Password reset successful!");
      router.push("/login");
    } catch (err: any) {
      showError(err.message || "Failed to reset password.");
    } finally {
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
            Reset <span className="text-[#FF4500]">Password</span>
          </h2>
          <p className="mt-2 text-sm text-zinc-400 font-mono">
            {step === 1 
              ? "Recover your account credentials" 
              : "Enter the code and set your new password"}
          </p>
        </div>

        {/* Development Helper banner */}
        {devCode && step === 2 && (
          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400 text-xs font-mono text-center">
            🔒 [DEV MODE] Simulated Reset Code: <span className="font-bold text-white text-sm">{devCode}</span>
          </div>
        )}

        {step === 1 ? (
          <form className="mt-8 space-y-6 relative" onSubmit={handleRequestCode}>
            <div className="space-y-4">
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
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-[#FF4500] to-orange-600 hover:brightness-110 active:scale-[0.98] transition-all focus:outline-none disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                ) : (
                  "SEND RESET CODE"
                )}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6 relative" onSubmit={handleResetPassword}>
            <div className="space-y-4">
              <div>
                <label htmlFor="reset-code" className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  6-Digit Reset Code
                </label>
                <input
                  id="reset-code"
                  name="code"
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white font-mono text-center tracking-widest text-lg focus:outline-none focus:border-[#FF4500]/50 transition-colors placeholder:text-zinc-600"
                  placeholder="000000"
                />
              </div>

              <div>
                <label htmlFor="new-password" className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  New Password (min 8 chars)
                </label>
                <input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white font-sans text-sm focus:outline-none focus:border-[#FF4500]/50 transition-colors placeholder:text-zinc-600"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white font-sans text-sm focus:outline-none focus:border-[#FF4500]/50 transition-colors placeholder:text-zinc-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3.5 border border-white/10 rounded-xl text-zinc-400 font-mono text-xs hover:bg-white/5 active:scale-[0.98] transition-all"
              >
                BACK
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 flex justify-center py-3.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-[#FF4500] to-orange-600 hover:brightness-110 active:scale-[0.98] transition-all focus:outline-none disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                ) : (
                  "UPDATE PASSWORD"
                )}
              </button>
            </div>
          </form>
        )}

        <div className="text-center font-mono text-[10px] text-zinc-500 relative">
          Remember your password?{" "}
          <LinkComponent href="/login" className="text-[#FF4500] hover:underline font-semibold">
            SIGN IN
          </LinkComponent>
        </div>
      </div>
    </div>
  );
}
