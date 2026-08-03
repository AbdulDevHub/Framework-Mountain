import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { NavBar } from "./components/NavBar";
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
  title: "CareerFlow",
  description: "Track job applications and match your resume against postings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body suppressHydrationWarning className="flex min-h-screen flex-col">
        <Providers>
          <NavBar />
          {children}
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:px-6 lg:px-8">
              <p>CareerFlow — a job application tracker with Postgres-native matching.</p>
              <p className="font-mono text-xs">tRPC · Prisma · Auth.js · BullMQ · OpenTelemetry</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}