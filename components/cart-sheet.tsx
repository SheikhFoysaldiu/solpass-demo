"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash2, CreditCard } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency } from "@/lib/utils";
import { processCheckout } from "@/lib/api-client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import { useToast } from "./ui/use-toast";
import { useProgram } from "@/lib/hooks/useProgram";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { v4 as uuidv4 } from "uuid";
import { PublicKey, SystemProgram } from "@solana/web3.js";

interface CartSheetProps {
  children?: React.ReactNode;
  onCheckoutComplete?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CartSheet({
  children,
  onCheckoutComplete,
  open,
  onOpenChange,
}: CartSheetProps) {
  const router = useRouter();
  const { cart, removeFromCart, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const program = useProgram();
  const wallet = useAnchorWallet();

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const fees = cart.reduce(
    (total, item) => total + item.fees * item.quantity,
    0
  );
  const total = subtotal + fees;

  // Use controlled state if provided, otherwise use internal state
  const sheetOpen = open !== undefined ? open : isOpen;
  const setSheetOpen = onOpenChange || setIsOpen;

  // Debug logging
  useEffect(() => {
    console.log("CartSheet rendered, isOpen:", isOpen, "sheetOpen:", sheetOpen);
  }, [isOpen, sheetOpen]);

  // Update the handleCheckout function to save purchased tickets to localStorage
  const handleCheckout = async () => {
    setIsProcessing(true);

    try {
      const cartId = localStorage.getItem("cartId");

      // Process blockchain transactions first if wallet is connected
      if (wallet && program && cart.length > 0) {
        try {
          // Process each ticket purchase on the blockchain
          for (const item of cart) {
            if (item.eventId && item.chainEventKey) {
              const ticketId = uuidv4().slice(0, 8); // Generate unique ticket ID

              // Find PDA for event account
              const eventAccount = new PublicKey(item.chainEventKey);

              // Find PDA for ticket account
              const [ticketPda] = PublicKey.findProgramAddressSync(
                [
                  Buffer.from("TICKET_STATE"),
                  eventAccount.toBuffer(),
                  Buffer.from(ticketId),
                ],
                program.programId
              );
              // Save the purchased tickets to localStorage
              const purchasedTickets = cart.map((item) => ({
                id: "ticket_" + Math.random().toString(36).substring(2, 10),
                orderId: response.orderId,
                eventId: item.eventId,
                eventName: item.eventName,
                eventDate: new Date(
                  Date.now() + 14 * 24 * 60 * 60 * 1000
                ).toISOString(), // 14 days from now as placeholder
                section: item.section,
                row: item.row,
                seat:
                  item.seats && item.seats.length > 0
                    ? item.seats[0]
                    : undefined,
                ticketType: item.offerName,
                purchaseDate: new Date().toISOString(),
                price: item.price,
                isResale: item.isResale || false,
                isListed: false,
              }));

              // Get existing tickets or initialize empty array
              const existingTickets = localStorage.getItem("purchasedTickets");
              let allTickets = [];

              if (existingTickets) {
                try {
                  allTickets = JSON.parse(existingTickets);
                } catch (error) {
                  console.error("Error parsing existing tickets:", error);
                  allTickets = [];
                }
              }

              // Combine existing and new tickets
              allTickets = [...allTickets, ...purchasedTickets];
              localStorage.setItem(
                "purchasedTickets",
                JSON.stringify(allTickets)
              );

              // Clear the cart
              clearCart();

              // Call purchaseTicket instruction
              const tx = await program.methods
                .purchaseTicket(ticketId)
                .accounts({
                  eventAccount: eventAccount,
                  ticketAccount: ticketPda,
                  buyer: wallet.publicKey,
                  systemProgram: SystemProgram.programId,
                })
                .rpc();

              console.log("Ticket purchase transaction:", tx);
            }
          }

          toast({
            title: "Blockchain tickets purchased",
            description:
              "Your tickets have been successfully purchased on the blockchain.",
          });
          if (cartId) {
            // Process the checkout via the API
            const response = await processCheckout(cartId);

            // Save the order ID
            localStorage.setItem("orderId", response.orderId);

            // Clear the cart
            clearCart();

            // Redirect to success page
            router.push("/checkout/success");
          }
        } catch (error) {
          console.error("Error processing blockchain transactions:", error);
          toast({
            title: "Blockchain purchase failed",
            description:
              "Failed to purchase tickets on blockchain, but continuing with checkout.",
            variant: "destructive",
          });
        }
      }

      // Continue with regular checkout process
    } catch (error) {
      console.error("Error processing checkout:", error);

      // If API fails, still proceed with checkout
      // setTimeout(() => {
      //   clearCart();
      //   router.push("/checkout/success");
      // }, 1500);
      // If API fails, still proceed with checkout and save tickets
      const orderId = Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0");

      // Save purchased tickets
      const purchasedTickets = cart.map((item) => ({
        id: "ticket_" + Math.random().toString(36).substring(2, 10),
        orderId: orderId,
        eventId: item.eventId,
        eventName: item.eventName,
        eventDate: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(), // 14 days from now as placeholder
        section: item.section,
        row: item.row,
        seat: item.seats && item.seats.length > 0 ? item.seats[0] : undefined,
        ticketType: item.offerName,
        purchaseDate: new Date().toISOString(),
        price: item.price,
        isResale: item.isResale || false,
        isListed: false,
      }));

      // Get existing tickets or initialize empty array
      const existingTickets = localStorage.getItem("purchasedTickets");
      let allTickets = [];

      if (existingTickets) {
        try {
          allTickets = JSON.parse(existingTickets);
        } catch (error) {
          console.error("Error parsing existing tickets:", error);
          allTickets = [];
        }
      }

      // Combine existing and new tickets
      allTickets = [...allTickets, ...purchasedTickets];
      localStorage.setItem("purchasedTickets", JSON.stringify(allTickets));

      setTimeout(() => {
        clearCart();
        setSheetOpen(false);

        if (onCheckoutComplete) {
          onCheckoutComplete();
        }

        router.push("/checkout/success");
      }, 1500);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button
            variant="outline"
            size="icon"
            className="relative"
            onClick={() => setSheetOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex justify-between items-center">
            <span>Your Cart ({totalItems})</span>
            <Button variant="outline" size="sm" asChild>
              <Link href="/cart">View Full Cart</Link>
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{item.eventName}</h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      {item.offerName} - {item.quantity}{" "}
                      {item.quantity === 1 ? "ticket" : "tickets"}
                    </div>
                    {item.section && item.row && (
                      <div className="text-sm text-muted-foreground">
                        Section {item.section}, Row {item.row}
                        {item.seats && item.seats.length > 0 && (
                          <>, Seats: {item.seats.join(", ")}</>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        + {formatCurrency(item.fees * item.quantity)} fees
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeFromCart(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <>
            <Separator />
            <div className="py-4 space-y-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Fees</span>
                <span>{formatCurrency(fees)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <SheetFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                    Processing...
                  </div>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Checkout
                  </>
                )}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
