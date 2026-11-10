import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Ultimate Graphics — Billing Management System",
  description:
    "Complete billing, GST invoices, quotations, proforma and payment tracking for Ultimate Graphics Signage & Fabrication.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
