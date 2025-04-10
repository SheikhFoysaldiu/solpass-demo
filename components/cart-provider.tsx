"use client"

import { createContext, useContext, useState, type ReactNode } from "react"


type CartItem = {
    id: number
    type: string
    section?: string
    row?: string
    tickets?: {
        id: string
        description: string
        quantity: number
        charges: {
            price: number
            type: string
            quantity: number
            tax: number
        }[]
    }[]
    totals: {
        currency_code: string
        fee: number
        grand: number
        merchandise: number
        tax: number
    }
    areas?: {
        description: string
        id: number
    }[]
    num_seats?: number
    view?: any
    ga?: boolean
    event_id?: string
    x_num?: number
    is_ga?: boolean
    transfer?: {
        eligible: boolean
    }
    carrier?: string
    service_level?: string
    description?: {
        long: string
        short: string
        eta: string
    }
    requires_address?: boolean
}


type CartResponse = {
    cart_id: string
    cart: {
        items: CartItem[]
        totals: {
            currency_code: string
            delivery: number
            fee: number
            grand: number
            merchandise: number
            tax: number
            unpaid: number
            upsell: number
        }
        hold_time: number
    }
}

type CartContextType = {
    cart: CartResponse | null
    setCart: (cart: CartResponse) => void
    clearCart: () => void
    totalItems: number
    totalPrice: number
    removeItem: (itemId: number) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCartState] = useState<CartResponse | null>(null)


    console.log("Cart state in provider:", cart)

    const setCart = (newCart: CartResponse) => {
        setCartState(newCart)
    }

    const clearCart = () => {
        setCartState(null)
    }

    const removeItem = (itemId: number) => {
        if (!cart || !cart.cart || !cart.cart.items) return


        const updatedItems = cart.cart.items.filter((item) => item.id !== itemId)


        const ticketItems = updatedItems.filter((item) => item.type === "ticket")
        const totalGrand = ticketItems.reduce((sum, item) => sum + item.totals.grand, 0)

        setCartState({
            ...cart,
            cart: {
                ...cart.cart,
                items: updatedItems,
                totals: {
                    ...cart.cart.totals,
                    grand: totalGrand,
                    merchandise: totalGrand,
                    unpaid: totalGrand,
                },
            },
        })
    }


    const totalItems = cart?.cart?.items
        ? cart.cart.items
            .filter((item) => item.type === "ticket")
            .reduce((total, item) => {
                return total + (item.tickets?.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0) || 0)
            }, 0)
        : 0

    const totalPrice = cart?.cart?.totals?.grand || 0

    return (
        <CartContext.Provider value={{ cart, setCart, clearCart, totalItems, totalPrice, removeItem }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider")
    }
    return context
}
