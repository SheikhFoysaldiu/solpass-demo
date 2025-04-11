'use client'
import type React from "react"

import { Inter } from "next/font/google"
import "./globals.css"
import { CartProvider } from "@/hooks/use-cart"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/toaster"

const inter = Inter({ subsets: ["latin"] })



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>

        <CartProvider>
          {children}
          <Toaster />
        </CartProvider>

      </body>
    </html>
  )
}


import './globals.css'