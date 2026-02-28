import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarWrapper } from "@/components/layout/sidebar-wrapper";
import { SessionProvider } from "@/components/providers/session-provider";
import { QueryProvider } from "@/providers/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyFinancial - Gestão Pessoal",
  description: "Sistema inteligente de gerenciamento financeiro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex h-screen overflow-hidden bg-background`}
      >
        <SessionProvider>
          <QueryProvider>
            <TooltipProvider delayDuration={300}>
              <SidebarWrapper />
              <main className="flex-1 flex flex-col overflow-y-auto">
                {children}
              </main>
            </TooltipProvider>
          </QueryProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
