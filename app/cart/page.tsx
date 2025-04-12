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
import { processCheckout } from "@/lib/api-client";
import Link from "next/link";
import { useProgram } from "@/lib/hooks/useProgram";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";

export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const program = useProgram();
  const wallet = useAnchorWallet();
  const { toast } = useToast();

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
        router.push("/checkout/success");
      }, 1500);
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
          <Link href="/">
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
          <Link href="/">
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
