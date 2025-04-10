import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { CartIcon } from "@/components/cart-icon";
import { Toaster } from "@/components/toast";
import { SolanaProvider } from "@/components/providers/solana";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Event Ticketing",
  description: "Find and purchase tickets for upcoming events",
};

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
            <header className="border-b">
              <div className="container mx-auto py-4 px-4 flex justify-between items-center">
                <h1 className="text-xl font-bold">EventTickets</h1>
                <CartIcon />
              </div>
            </header>
            {children}
            <Toaster />
          </CartProvider>
        </SolanaProvider>
      </body>
    </html>
  );
}
