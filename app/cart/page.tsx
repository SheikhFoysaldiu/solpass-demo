"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  Trash2,
  CreditCard,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { usePrivateKeyAnchorWallet, useProgram } from "@/lib/hooks/useProgram";
import {
  type AnchorWallet,
  useAnchorWallet,
} from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
import { useTeamStore } from "@/store/useTeamStore";

export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const program = useProgram();
  const w = useAnchorWallet();
  const privateWallet = usePrivateKeyAnchorWallet();
  const { toast } = useToast();
  const { team } = useTeamStore();

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

  const handleCheckout = async () => {
    if (!team?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to complete your purchase",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      let wallet: AnchorWallet | null = null;

      if (w) {
        wallet = w;
      } else if (privateWallet) {
        wallet = privateWallet.wallet;
      }
      // Process blockchain transactions first if wallet is connected
      if (program && cart.length > 0) {
        try {
          if (wallet) {
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

                // Call purchaseTicket instruction
                const tx = await program.methods
                  .purchaseTicket(ticketId, wallet.publicKey.toBase58())
                  .accounts({
                    eventAccount: eventAccount,
                    ticketAccount: ticketPda,
                    payer: wallet.publicKey,
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

      // Create a cart in the database
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId: team.id,
          items: cart,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create cart");
      }

      const cartData = await response.json();

      // Process checkout
      const checkoutResponse = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cartId: cartData.id,
          teamId: team.id,
        }),
      });

      if (!checkoutResponse.ok) {
        throw new Error("Failed to process checkout");
      }

      const checkoutData = await checkoutResponse.json();

      // Clear the cart
      clearCart();

      // Show success message
      toast({
        title: "Purchase successful",
        description: "Your tickets have been purchased successfully.",
      });

      // Redirect to success page
      router.push(`/checkout/success?orderId=${checkoutData.orderId}`);
    } catch (error) {
      console.error("Error processing checkout:", error);
      toast({
        title: "Checkout failed",
        description:
          "There was an error processing your purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <ShoppingCart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-6">
          Looks like you haven't added any tickets to your cart yet.
        </p>
        <Button asChild>
          <Link href="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Browse Events
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Cart</h1>
        <Button variant="outline" asChild>
          <Link href="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Cart Items ({totalItems})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{item.eventName}</h3>
                    <div className="text-sm text-gray-500 mt-1">
                      {item.offerName} - {item.quantity}{" "}
                      {item.quantity === 1 ? "ticket" : "tickets"}
                    </div>
                    {item.section && item.row && (
                      <div className="text-sm text-gray-500">
                        Section {item.section}, Row {item.row}
                        {item.seats && item.seats.length > 0 && (
                          <>, Seats: {item.seats.join(", ")}</>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-row md:flex-col items-center justify-between mt-4 md:mt-0">
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                      <div className="text-xs text-gray-500">
                        + {formatCurrency(item.fees * item.quantity)} fees
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-500 hover:text-red-500"
                      onClick={() => removeFromCart(index)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Fees</span>
                <span>{formatCurrency(fees)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Checkout
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
