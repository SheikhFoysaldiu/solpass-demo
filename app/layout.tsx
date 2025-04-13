"use client"
import type React from "react"

import { Toaster } from "@/components/toaster"
import { CartProvider } from "@/hooks/use-cart"
import { Inter } from "next/font/google"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TeamHeader } from "@/components/team-header"

// Create a client
const queryClient = new QueryClient()
import "./globals.css"
import { SolanaProvider } from "@/components/providers/solana-provider"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <SolanaProvider>
            <CartProvider>
              <TeamHeader />
              {children}
              <Toaster />
            </CartProvider>
          </SolanaProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}


import './globals.css'

