"use client"

import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/components/cart-provider"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet"
import { formatCurrency } from "@/lib/utils"

export function CartIcon() {
    const { cart, totalItems, totalPrice, removeItem } = useCart()


    console.log("Cart data in CartIcon:", cart)

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {totalItems > 0 && (
                        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {totalItems}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Your Cart</SheetTitle>
                    <SheetDescription>
                        {totalItems === 0 ? "Your cart is empty" : `You have ${totalItems} tickets in your cart`}
                    </SheetDescription>
                </SheetHeader>

                {cart && cart.cart && cart.cart.items && cart.cart.items.length > 0 ? (
                    <>
                        <div className="py-4 space-y-4">
                            {cart.cart.items
                                .filter((item) => item.type === "ticket")
                                .map((item) => (
                                    <div key={item.id} className="flex justify-between items-start border-b pb-3">
                                        <div>
                                            <h3 className="font-medium">{item.tickets?.[0]?.description || "Ticket"}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {item.section && `Section: ${item.section}`}
                                                {item.row && `, Row: ${item.row}`}
                                            </p>
                                            <p className="text-sm">
                                                {item.tickets?.[0]?.quantity || 1} x{" "}
                                                {formatCurrency(
                                                    item.totals.grand / (item.tickets?.[0]?.quantity || 1),
                                                    item.totals.currency_code,
                                                )}
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                        </div>

                        <SheetFooter className="flex-col sm:flex-col gap-2 mt-4">
                            <div className="flex justify-between font-bold text-lg w-full">
                                <span>Total:</span>
                                <span>{formatCurrency(cart.cart.totals.grand, cart.cart.totals.currency_code)}</span>
                            </div>
                            <Button className="w-full">Checkout</Button>
                        </SheetFooter>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[50vh]">
                        <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Your cart is empty</p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}
