"use client";
import type React from "react";

import { SolanaProvider } from "@/components/providers/solana";
import { Toaster } from "@/components/toaster";
import { CartProvider } from "@/hooks/use-cart";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SolanaProvider>
          <CartProvider>
            {children}
            <Toaster />
          </CartProvider>
        </SolanaProvider>
      </body>
    </html>
  );
}
