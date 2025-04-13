"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { CartItem } from "@/types"

interface CartContextType {
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (index: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
})

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])

  const addToCart = async (item: CartItem) => {
    setCart((prevCart) => [...prevCart, item])
  }

  const removeFromCart = async (index: number) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index))
  }

  const clearCart = async () => {
    setCart([])
  }

  return <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>{children}</CartContext.Provider>
}

export function useCart() {
  return useContext(CartContext)
}
