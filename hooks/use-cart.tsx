"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { createCart, updateCart, deleteCart } from "@/lib/api-client";

interface CartItem {
  eventId: string;
  eventName: string;
  ticketTypeId: string;
  priceLevelId: string;
  section?: string;
  row?: string;
  seats?: number[];
  quantity: number;
  price: number;
  fees: number;
  offerName: string;
  chainEventKey?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = async (item: CartItem) => {
    try {
      // If we don't have a cartId yet, create a new cart
      if (!localStorage.getItem("cartId")) {
        const cartResponse = await createCart([item]);
        localStorage.setItem("cartId", cartResponse.cart_id);
        setCart([item]);
      } else {
        // Otherwise, update the existing cart
        const cartId = localStorage.getItem("cartId");
        if (cartId) {
          const updatedCart = [...cart, item];
          await updateCart(cartId, updatedCart);
          setCart(updatedCart);
        }
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      // If API fails, still update the cart in memory
      setCart((prevCart) => [...prevCart, item]);
    }
  };

  const removeFromCart = async (index: number) => {
    try {
      const cartId = localStorage.getItem("cartId");
      if (cartId) {
        const updatedCart = cart.filter((_, i) => i !== index);
        await updateCart(cartId, updatedCart);
        setCart(updatedCart);
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
      // If API fails, still update the cart in memory
      setCart((prevCart) => prevCart.filter((_, i) => i !== index));
    }
  };

  const clearCart = async () => {
    try {
      const cartId = localStorage.getItem("cartId");
      if (cartId) {
        await deleteCart(cartId);
        localStorage.removeItem("cartId");
      }
      setCart([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
      // If API fails, still clear the cart in memory
      setCart([]);
      localStorage.removeItem("cartId");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
