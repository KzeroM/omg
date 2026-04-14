import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { PlayerBar } from "@/components/PlayerBar";
import { BottomNav } from "@/components/BottomNav";
import { AuthVerifiedToast } from "@/components/AuthVerifiedToast";
import { PlayerProvider } from "@/context/PlayerContext";
import { ToastProvider } from "@/context/ToastContext";
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
  title: "OMG - Music",
  description: "오늘의 인기 아티스트와 실시간 차트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[#0a0a0a] text-zinc-100 antialiased`}
      >
        <ToastProvider>
          <PlayerProvider>
            <Suspense fallback={null}>
              <AuthVerifiedToast />
            </Suspense>
            <Header />
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 overflow-auto pb-36 lg:pb-24">
                {children}
              </main>
            </div>
            <PlayerBar />
            <BottomNav />
          </PlayerProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
