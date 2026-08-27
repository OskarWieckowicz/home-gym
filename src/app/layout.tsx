import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Home Gym Creator",
  description: "Design a home gym with an AI agent that understands your space.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-canvas text-ink">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
