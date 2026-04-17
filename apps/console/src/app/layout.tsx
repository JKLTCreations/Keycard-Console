import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Keycard Console",
  description: "AI Agent Authorization & Access Control",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-surface-0 text-text-primary">
        <Sidebar />
        <div className="lg:pl-[260px] min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 p-6 lg:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
