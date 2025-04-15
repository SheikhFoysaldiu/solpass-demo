"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import {
  fetchEventById,
  fetchEventAvailability,
  fetchResaleTickets,
} from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import ChainTickets from "@/components/tickets/chain-tickets";
import type { ResaleTicket } from "@/types";
import { useViewModeStore } from "@/store/useViewModeStore";

// Import the refactored components
import { EventHeader } from "@/components/events/detail/EventHeader";
import { EventInfo } from "@/components/events/detail/EventInfo";
import { EventTicketSelection } from "@/components/events/detail/EventTicketSelection";
import { EventSeatingSelection } from "@/components/events/detail/EventSeatingSelection";
import { EventResaleTickets } from "@/components/events/detail/EventResaleTickets";
import { EventPriceCalculation } from "@/components/events/detail/EventPriceCalculation";
import { useEventRoyaltyInfo } from "@/components/events/detail/EventRoyaltyInfo";

// Define the ticket data interface
export interface TicketData {
  offers: {
    ticketTypeId: string;
    priceLevelId: string;
    currency: string;
    faceValue: number;
    charges: {
      reason: string;
      type: string;
      amount: number;
    }[];
    offerName: string;
    offerDescription: string;
    eventTicketMinimum: number;
    sellableQuantities: number[];
  }[];
  available: number;
  inventory: {
    section: string;
    row: string;
    seats: number[];
  }[];
}

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart, cart } = useCart();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const chainEventKey = searchParams.get("chainEventKey");
  const { mode } = useViewModeStore();

  // Fetch royalty information from the blockchain using the extracted hook
  const { data: royaltyInfo, isLoading: royaltyLoading } =
    useEventRoyaltyInfo(chainEventKey);

  const [event, setEvent] = useState<any>(null);
  const [availability, setAvailability] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedRow, setSelectedRow] = useState("");
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTicketLoading, setIsTicketLoading] = useState(false);
  const [resaleTickets, setResaleTickets] = useState<ResaleTicket[]>([]);
  const [selectedResaleTicket, setSelectedResaleTicket] =
    useState<ResaleTicket | null>(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!params?.id) {
          setError("Event ID is missing");
          setLoading(false);
          return;
        }

        // Fetch event details from our API
        const eventData = await fetchEventById(params.id as string);
        setEvent(eventData);

        // Fetch availability data
        try {
          const availabilityData = await fetchEventAvailability(
            params.id as string
          );

          // Check if the availability data has the expected structure
          if (
            availabilityData &&
            availabilityData.event &&
            Array.isArray(availabilityData.event.tickets)
          ) {
            setAvailability(availabilityData);

            if (availabilityData.event.tickets.length > 0) {
              setSelectedTicket(availabilityData.event.tickets[0]);

              // Auto-select first section and row if available
              const firstTicket = availabilityData.event.tickets[0];
              if (firstTicket.inventory && firstTicket.inventory.length > 0) {
                setSelectedSection(firstTicket.inventory[0].section);
                setSelectedRow(firstTicket.inventory[0].row);

                // Select first available seats based on quantity
                if (
                  firstTicket.inventory[0].seats &&
                  firstTicket.inventory[0].seats.length >= quantity
                ) {
                  setSelectedSeats(
                    firstTicket.inventory[0].seats.slice(0, quantity)
                  );
                }
              }
            }
          }
        } catch (error) {
          console.error("Error fetching availability:", error);
        }

        // Fetch resale tickets
        try {
          const resaleData = await fetchResaleTickets(params.id as string);
          if (Array.isArray(resaleData) && resaleData.length > 0) {
            setResaleTickets(resaleData);
          }
        } catch (error) {
          console.error("Error fetching resale tickets:", error);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching event details:", error);
        setError("Failed to load event details. Please try again later.");
        setLoading(false);
      }
    };

    if (params.id) {
      fetchEventDetails();
    }
  }, [params.id, quantity]);

  useEffect(() => {
    // Update selected seats when quantity changes
    if (selectedTicket && selectedSection && selectedRow) {
      const inventoryItem = selectedTicket.inventory?.find(
        (item: any) =>
          item.section === selectedSection && item.row === selectedRow
      );

      if (
        inventoryItem &&
        inventoryItem.seats &&
        inventoryItem.seats.length >= quantity
      ) {
        setSelectedSeats(inventoryItem.seats.slice(0, quantity));
      }
    }
  }, [quantity, selectedTicket, selectedSection, selectedRow]);

  const handleAddToCart = () => {
    if (!selectedTicket || !event) return;

    const ticketOffer = selectedTicket.offers[0];
    const ticketData = {
      eventId: event.id,
      eventName: event.name,
      ticketTypeId: ticketOffer.ticketTypeId,
      priceLevelId: ticketOffer.priceLevelId,
      section: selectedSection,
      row: selectedRow,
      seats: selectedSeats,
      quantity: quantity,
      price: ticketOffer.faceValue,
      fees: ticketOffer.charges.reduce(
        (total: number, charge: any) => total + (charge.amount || 0),
        0
      ),
      offerName: ticketOffer.offerName,
      isResale: false,
      chainEventKey: chainEventKey ?? undefined,
    };

    addToCart(ticketData);

    // Show success toast
    toast({
      title: "Added to cart",
      description: `${quantity} ticket${quantity > 1 ? "s" : ""} for ${
        event.name
      }`,
    });

    // Open the cart sheet
    setCartSheetOpen(true);
  };

  const handleAddResaleToCart = () => {
    if (!selectedResaleTicket || !event) return;

    const ticketData = {
      eventId: event.id,
      eventName: event.name,
      ticketTypeId: selectedResaleTicket.ticketId,
      priceLevelId: "resale",
      section: selectedResaleTicket.ticket?.section || "",
      row: selectedResaleTicket.ticket?.row || "",
      seats: selectedResaleTicket.ticket?.seat
        ? [selectedResaleTicket.ticket.seat]
        : [],
      quantity: 1, // Resale tickets are sold individually
      price: selectedResaleTicket.price,
      fees: selectedResaleTicket.serviceFee + selectedResaleTicket.royaltyFee,
      offerName: `Resale Ticket - ${
        selectedResaleTicket.ticket?.section || ""
      } ${selectedResaleTicket.ticket?.row || ""}${
        selectedResaleTicket.ticket?.seat
          ? ` Seat ${selectedResaleTicket.ticket.seat}`
          : ""
      }`,
      isResale: true,
      resaleId: selectedResaleTicket.id,
      royaltyFee: selectedResaleTicket.royaltyFee,
      serviceFee: selectedResaleTicket.serviceFee,
    };

    addToCart(ticketData);

    // Show success toast
    toast({
      title: "Added to cart",
      description: `Resale ticket for ${event.name}`,
    });

    // Remove the ticket from available resale tickets
    setResaleTickets(
      resaleTickets.filter((ticket) => ticket.id !== selectedResaleTicket.id)
    );
    setSelectedResaleTicket(null);

    // Open the cart sheet
    setCartSheetOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-16 px-4 flex justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto py-16 px-4 flex flex-col items-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-700 mb-2">
            Event not found
          </h1>
          <p className="text-red-600 mb-4">
            {error ||
              "The event you're looking for doesn't exist or has been removed."}
          </p>
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header with navigation and cart controls */}
      <EventHeader
        eventName={event.name}
        cartCount={cartItemCount}
        cartSheetOpen={cartSheetOpen}
        setCartSheetOpen={setCartSheetOpen}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Event image */}
          <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden mb-6 bg-gray-100">
            <Image
              src={
                event.image ||
                `/placeholder.svg?height=400&width=800&text=${encodeURIComponent(
                  event.name
                )}`
              }
              alt={event.name}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Event information (date, time, location, etc) */}
          <EventInfo
            date={event.date}
            venue={event.venue}
            ticketLimit={event.ticketLimit || 10}
            royaltyPercentage={event.royaltyPercentage}
          />

          {/* Event description */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">About This Event</h2>
            <p className="text-gray-700">
              {event.description || "No description available for this event."}
            </p>
          </div>

          {/* Chain tickets component - this is shown in both modes now */}
          <ChainTickets
            eventPublicKey={chainEventKey ?? undefined}
            showOwners
            royalties={royaltyInfo ?? undefined}
          />
        </div>

        {/* Only show ticket selection in user mode */}
        {mode === "user" && (
          <div>
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Select Tickets</h2>

                {availability &&
                availability.event &&
                availability.event.tickets ? (
                  <Tabs defaultValue="tickets" className="mb-6">
                    <TabsList className="w-full">
                      <TabsTrigger value="tickets" className="flex-1">
                        Primary
                      </TabsTrigger>

                      <TabsTrigger value="seating" className="flex-1">
                        Seating
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="tickets" className="mt-4">
                      {/* Ticket selection component */}
                      <EventTicketSelection
                        tickets={availability.event.tickets}
                        selectedTicket={selectedTicket}
                        setSelectedTicket={setSelectedTicket}
                        quantity={quantity}
                        setQuantity={setQuantity}
                        isTicketLoading={isTicketLoading}
                        setIsTicketLoading={setIsTicketLoading}
                        setSelectedSection={setSelectedSection}
                        setSelectedRow={setSelectedRow}
                        setSelectedSeats={setSelectedSeats}
                        setSelectedResaleTicket={setSelectedResaleTicket}
                      />
                    </TabsContent>

                    <TabsContent value="resale" className="mt-4">
                      {/* Resale tickets component */}
                      <EventResaleTickets
                        resaleTickets={resaleTickets}
                        selectedResaleTicket={selectedResaleTicket}
                        setSelectedResaleTicket={setSelectedResaleTicket}
                        setSelectedTicket={setSelectedTicket}
                        setSelectedSection={setSelectedSection}
                        setSelectedRow={setSelectedRow}
                        setSelectedSeats={setSelectedSeats}
                      />
                    </TabsContent>

                    <TabsContent value="seating" className="mt-4">
                      {/* Seating selection component */}
                      <EventSeatingSelection
                        selectedTicket={selectedTicket}
                        selectedSection={selectedSection}
                        setSelectedSection={setSelectedSection}
                        selectedRow={selectedRow}
                        setSelectedRow={setSelectedRow}
                        selectedSeats={selectedSeats}
                        setSelectedSeats={setSelectedSeats}
                        quantity={quantity}
                      />
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      No ticket information available
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Events
                      </Link>
                    </Button>
                  </div>
                )}

                {/* Price calculation and add to cart */}
                <EventPriceCalculation
                  selectedTicket={selectedTicket}
                  selectedResaleTicket={selectedResaleTicket}
                  quantity={quantity}
                  isTicketLoading={isTicketLoading}
                  onAddToCart={handleAddToCart}
                  onAddResaleToCart={handleAddResaleToCart}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
