import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Home Gym Creator",
  description: "Design a home gym with an AI agent that understands your space.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
