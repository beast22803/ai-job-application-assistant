import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobAnalyser — AI Job Application Assistant",
  description: "AI-powered job compatibility analysis, ATS scoring, resume optimization, and application asset generation.",
};

import Header from "@/components/Header";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-[#050505] text-[#F5F5F5] font-sans relative">
        <AuthProvider>
          <NotificationProvider>
            {/* Film grain overlay */}
            <div
              className="pointer-events-none fixed inset-0 z-50 opacity-[0.012]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='150' height='150' filter='url(%23g)'/%3E%3C/svg%3E")`
              }}
            />
            <Header />
            <main className="flex-1 w-full flex flex-col pt-24">
              {children}
            </main>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
