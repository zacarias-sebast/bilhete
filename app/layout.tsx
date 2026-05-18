import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner"
import Script from "next/script";

import "./globals.css";
import { NavBar } from "@/components/nav-bar";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Morvic",
  description: "Sistema de venda de bilhete de viagem",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={geistSans.variable}>
      <body className={`${geistSans.className} antialiased`} suppressHydrationWarning>
        <Providers>
          <div className="flex-1 w-full flex flex-col items-center">
            <NavBar/>
          </div>
          {children}
          <Toaster position="top-right" />
        </Providers>
        
        {/* Botpress Webchat Scripts */}
        <Script src="https://cdn.botpress.cloud/webchat/v3.6/inject.js" strategy="afterInteractive" />
        <Script src="https://files.bpcontent.cloud/2026/04/24/23/20260424230939-MDWOFEBP.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
