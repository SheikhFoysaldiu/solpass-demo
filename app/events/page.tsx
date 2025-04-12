"use client";

import { CartSheet } from "@/components/cart-sheet";
import { CreateEventForm } from "@/components/create-event-form";
import { EventCard, RoyaltyFormValues } from "@/components/event-card";
import ChainEvents, { useChainEvents } from "@/components/events/chain-events";
import { WalletModal } from "@/components/providers/wallate-modal";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { fetchEvents } from "@/lib/api-client";
import { usePrivateKeyAnchorWallet, useProgram } from "@/lib/hooks/useProgram";
import { EventType, generateDummyEvent } from "@/lib/mock-data";
import { createRoyaltiesString, extractRoyaltiesFromString } from "@/lib/utils";
import { useWalletStore } from "@/store/useWalletStore";
import { BN } from "@coral-xyz/anchor";
import {
  AnchorWallet,
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, PlusCircle, ShoppingCart, Ticket } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { cart } = useCart();
  const { toast } = useToast();
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  const { data: chainEvents = [], isLoading: isLoadingChainEvents } =
    useChainEvents();
  const { connection } = useConnection();
  const w = useAnchorWallet();
  const queryClient = useQueryClient();

  const program = useProgram();
  const privateKeyWallet = usePrivateKeyAnchorWallet();
  const { privateKey } = useWalletStore();

  const chainEventsByIdMap = new Map(
    chainEvents.map((event) => [event.account.eventId, event])
  );

  const initializeEventMutation = useMutation({
    mutationFn: async ({
      event,
      royalties,
    }: {
      event: EventType;
      royalties: RoyaltyFormValues;
    }) => {
      if (!program) throw new Error("Program not found");

      let wallet: AnchorWallet | undefined = undefined;

      if (w) {
        wallet = w;
      } else {
        if (privateKey && privateKeyWallet) {
          wallet = privateKeyWallet.wallet;
        }
      }

      if (!wallet) {
        return null;
      }

      const [eventPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("EVENT_STATE"),
          wallet.publicKey.toBuffer(),
          Buffer.from(event.id),
        ],
        program.programId
      );

      // Example usage
      const royaltiesString = createRoyaltiesString(royalties);
      console.log(royaltiesString);

      const eventDate = new Date(event.date).getTime() / 1000;
      const ticketPriceLamports = 200000;

      try {
        const tx = await program.methods
          .createEvent(
            event.id,
            event.name,
            event.description || "A littet description",
            royaltiesString,
            event.venue || "A veno",
            new BN(eventDate),
            new BN(event.ticketTypes.length),
            new BN(ticketPriceLamports)
          )
          .accounts({
            eventAccount: eventPda,
            authority: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        return tx;
      } catch (e) {
        console.error("Error initializing event on blockchain:", e);
        throw new Error("Transaction failed");
      }
    },
    onSuccess: (_, { event }) => {
      toast({
        title: "Event initialized on blockchain",
        description: `${event.name} has been successfully initialized on the blockchain.`,
      });
      queryClient.invalidateQueries({ queryKey: ["chainEvents"] });
    },
    onError: (error) => {
      console.error("Error initializing event on blockchain:", error);
      toast({
        title: "Initialization failed",
        description:
          "Failed to initialize event on blockchain. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const fetchEventsData = async () => {
      try {
        setLoading(true);
        const eventsData = await fetchEvents();

        const validEvents = Array.isArray(eventsData)
          ? eventsData.filter(
              (event) => event && typeof event === "object" && "id" in event
            )
          : [];

        if (validEvents.length > 0) {
          setEvents(validEvents);
        } else {
          const dummyEvent = generateDummyEvent(50);
          setEvents([dummyEvent]);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
        const dummyEvent = generateDummyEvent(50);
        setEvents([dummyEvent]);
      } finally {
        setLoading(false);
      }
    };

    fetchEventsData();
  }, []);

  const handleCreateEvent = (newEvent: EventType) => {
    setEvents((prevEvents) => [...prevEvents, newEvent]);
    setShowCreateForm(false);

    toast({
      title: "Event created",
      description: `${newEvent.name} has been created successfully.`,
    });
  };

  const handleInitializeEvent = (
    event: EventType,
    royalties: RoyaltyFormValues
  ) => {
    console.log("Initializing event:", event, royalties);
    initializeEventMutation.mutate({ event, royalties });
  };

  const enhancedEvents = events.map((event) => {
    const chainEvent = chainEventsByIdMap.get(event.id);
    return {
      ...event,
      onChain: !!chainEvent,
      chainData: chainEvent,
    };
  });

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Event Ticketing</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <WalletModal />
            <CartSheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
              <Button
                variant="outline"
                size="icon"
                className="relative"
                onClick={() => setCartSheetOpen(true)}
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </CartSheet>

            <Button variant="outline" asChild>
              <Link href="/cart">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart ({totalItems})
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link href="/my-tickets">
                <Ticket className="h-4 w-4 mr-2" />
                My Tickets
              </Link>
            </Button>
          </div>

          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2"
          >
            <PlusCircle size={18} />
            {showCreateForm ? "Cancel" : "Create Event"}
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <div className="mb-8">
          <CreateEventForm onSubmit={handleCreateEvent} />
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500 mb-4">No events found</p>
          <Button onClick={() => setShowCreateForm(true)}>
            Create Your First Event
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enhancedEvents.map((event) =>
            event && event.id ? (
              <EventCard
                key={event.id}
                event={event}
                isOnChain={event.onChain}
                chainData={event.chainData}
                onInitialize={(royalties) =>
                  handleInitializeEvent(event, royalties)
                }
                isInitializing={
                  initializeEventMutation.isPending &&
                  initializeEventMutation.variables.event?.id === event.id
                }
                walletConnected={!!(w ?? privateKeyWallet)}
              />
            ) : null
          )}
        </div>
      )}
      <ChainEvents />
    </main>
  );
}
