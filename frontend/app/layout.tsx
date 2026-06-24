import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Tracker from "@/components/Tracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CausalFunnel Analytics",
  description:
    "Real-time user session tracking, click analytics, and heatmap visualization dashboard.",
};

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
      <body className="min-h-full flex flex-col bg-brand-bg text-brand-text">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-brand-surface border-b border-brand-text/10">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded bg-brand-primary flex items-center justify-center text-white font-bold text-sm">
              CF
            </div>
            <span className="text-lg font-bold text-brand-text tracking-tight">
              CausalFunnel
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-brand-text hover:text-brand-primary rounded transition-all duration-200"
            >
              Sessions
            </Link>
            <Link
              href="/heatmap"
              className="px-4 py-2 text-sm font-medium text-brand-text hover:text-brand-primary rounded transition-all duration-200"
            >
              Heatmap
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="py-4 px-6 text-center text-xs text-brand-text/60 border-t border-brand-text/10">
          © 2026 CausalFunnel Analytics &mdash; Real-time User Tracking
          Dashboard
        </footer>

        {/* Tracker Script — tracks the dashboard itself */}
        <Tracker />
      </body>
    </html>
  );
}
