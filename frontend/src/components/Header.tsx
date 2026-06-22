"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <header className="pointer-events-auto flex items-center justify-between px-4 sm:px-6 py-3 border border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl rounded-full w-full max-w-5xl transition-all">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 transition-opacity hover:opacity-80">
          <div className="text-lg sm:text-xl font-black tracking-tighter uppercase">
            Job<span className="text-[#FF4500]">Analyser</span>
          </div>
        </Link>
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
      <div className="hidden sm:block font-mono text-[10px] text-[#8E8E93] border border-white/10 px-3 py-1.5 rounded-full bg-white/5 cursor-default hover:bg-white/10 transition-colors">
        VARSHIT MADISETTI
      </div>
      
      {/* Mobile Menu Button Placeholder */}
      <button aria-label="Menu" className="sm:hidden text-white p-2">
        <span className="material-symbols-rounded">menu</span>
      </button>
      </header>
    </div>
  );
}
