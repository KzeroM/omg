import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { PlayerBar } from "@/components/PlayerBar";
import { BottomNav } from "@/components/BottomNav";
import { QueueAwareMain } from "@/components/QueueAwareMain";
import { AuthVerifiedToast } from "@/components/AuthVerifiedToast";
import { PlayerProvider } from "@/context/PlayerContext";
import { ToastProvider } from "@/context/ToastContext";
import { QueryProvider } from "@/components/QueryProvider";
import { OnboardingModal } from "@/components/OnboardingModal";
import { UploadButton } from "@/components/UploadButton";
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
  description: "인기 아티스트의 실시간 차트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
        style={{ background: "var(--color-bg-base)", color: "var(--color-text-primary)" }}
      >
        <ThemeProvider attribute="data-theme" defaultTheme="dark" disableTransitionOnChange>
          <QueryProvider>
            <ToastProvider>
              <PlayerProvider>
                <Suspense fallback={null}>
                  <AuthVerifiedToast />
                </Suspense>
                <OnboardingModal />
                <Header />
                <div className="flex min-h-screen">
                  <Sidebar />
                  <QueueAwareMain>{children}</QueueAwareMain>
                </div>
                <PlayerBar />
                <UploadButton variant="fab" />
                <BottomNav />
              </PlayerProvider>
            </ToastProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}