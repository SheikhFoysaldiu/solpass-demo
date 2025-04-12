"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart,
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  Ticket,
  Loader2,
  RefreshCw,
  Percent,
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  fetchEventById,
  fetchEventAvailability,
  fetchResaleTickets,
} from "@/lib/api-client";
import { CartSheet } from "@/components/cart-sheet";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { generateDummyEvent } from "@/lib/mock-data";
import ChainTickets from "@/components/tickets/chain-tickets";

// Default ticket data to use as fallback
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

interface ResaleTicket {
  id: string;
  ticketId: string;
  eventId: string;
  section: string;
  row: string;
  seat?: number;
  price: number;
  originalPrice: number;
  royaltyPercentage: number;
  royaltyFee: number;
  serviceFee: number;
  sellerId: string;
}

const defaultTicketData: TicketData = {
  offers: [
    {
      ticketTypeId: "000000000001",
      priceLevelId: "9",
      currency: "USD",
      faceValue: 50.5,
      charges: [
        {
          reason: "facility",
          type: "fee",
          amount: 8,
        },
        {
          reason: "service",
          type: "fee",
          amount: 15.8,
        },
      ],
      offerName: "General Admission",
      offerDescription: "General Admission",
      eventTicketMinimum: 1,
      sellableQuantities: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    },
  ],
  available: 100,
  inventory: [
    {
      section: "GA",
      row: "GA",
      seats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    },
  ],
};

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart, cart } = useCart();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const chainEventKey = searchParams.get("chainEventKey");
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

        // Fetch event details from our API
        let eventData = await fetchEventById(params?.id as string);

        // If event not found, create a dummy event
        if (!eventData) {
          eventData = generateDummyEvent(200);
          eventData.id = params.id as string;
        }

        setEvent(eventData);

        // Try to fetch availability data
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
          } else {
            // If availability data doesn't have the expected structure, create a default one
            createDefaultAvailability(eventData);
          }
        } catch (error) {
          console.error("Error fetching availability:", error);
          // Create default availability data
          createDefaultAvailability(eventData);
        }

        // Fetch resale tickets
        try {
          const resaleData = await fetchResaleTickets(params.id as string);
          if (Array.isArray(resaleData) && resaleData.length > 0) {
            setResaleTickets(resaleData);
          } else {
            // Create dummy resale tickets
            createDummyResaleTickets(eventData);
          }
        } catch (error) {
          console.error("Error fetching resale tickets:", error);
          // Create dummy resale tickets
          createDummyResaleTickets(eventData);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching event details:", error);

        // Create a dummy event if there's an error
        const dummyEvent = generateDummyEvent(200);
        dummyEvent.id = params.id as string;
        setEvent(dummyEvent);
        createDefaultAvailability(dummyEvent);
        createDummyResaleTickets(dummyEvent);

        setLoading(false);
      }
    };

    // Helper function to create default availability data
    const createDefaultAvailability = (eventData: any) => {
      // Create default availability data based on the event's ticket types if available
      if (
        eventData.ticketTypes &&
        Array.isArray(eventData.ticketTypes) &&
        eventData.ticketTypes.length > 0
      ) {
        const tickets = eventData.ticketTypes.map(
          (ticketType: any, index: number) => {
            return {
              offers: [
                {
                  ticketTypeId: `00000000000${index + 1}`,
                  priceLevelId: `${index + 1}`,
                  currency: "USD",
                  faceValue: ticketType.price || 50,
                  charges: [
                    {
                      reason: "service",
                      type: "fee",
                      amount: ticketType.fees || 10,
                    },
                  ],
                  offerName: ticketType.name || `Ticket Type ${index + 1}`,
                  offerDescription:
                    ticketType.name || `Ticket Type ${index + 1}`,
                  eventTicketMinimum: 1,
                  sellableQuantities: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                },
              ],
              available: ticketType.available || 100,
              inventory: [
                {
                  section: "GA",
                  row: "GA",
                  seats: Array.from({ length: 20 }, (_, i) => i + 1),
                },
              ],
            };
          }
        );

        const defaultAvailability = {
          event: {
            id: eventData.id,
            tickets: tickets.length > 0 ? tickets : [defaultTicketData],
          },
        };

        setAvailability(defaultAvailability);

        if (defaultAvailability.event.tickets.length > 0) {
          setSelectedTicket(defaultAvailability.event.tickets[0]);

          // Auto-select first section and row
          if (
            defaultAvailability.event.tickets[0].inventory &&
            defaultAvailability.event.tickets[0].inventory.length > 0
          ) {
            setSelectedSection(
              defaultAvailability.event.tickets[0].inventory[0].section
            );
            setSelectedRow(
              defaultAvailability.event.tickets[0].inventory[0].row
            );

            // Select first available seats based on quantity
            if (
              defaultAvailability.event.tickets[0].inventory[0].seats &&
              defaultAvailability.event.tickets[0].inventory[0].seats.length >=
                quantity
            ) {
              setSelectedSeats(
                defaultAvailability.event.tickets[0].inventory[0].seats.slice(
                  0,
                  quantity
                )
              );
            }
          }
        }
      } else {
        // If no ticket types, use a completely default structure
        const defaultAvailability = {
          event: {
            id: eventData.id,
            tickets: [defaultTicketData],
          },
        };

        setAvailability(defaultAvailability);
        setSelectedTicket(defaultTicketData);

        if (
          defaultTicketData.inventory &&
          defaultTicketData.inventory.length > 0
        ) {
          setSelectedSection(defaultTicketData.inventory[0].section);
          setSelectedRow(defaultTicketData.inventory[0].row);

          if (
            defaultTicketData.inventory[0].seats &&
            defaultTicketData.inventory[0].seats.length >= quantity
          ) {
            setSelectedSeats(
              defaultTicketData.inventory[0].seats.slice(0, quantity)
            );
          }
        }
      }
    };

    // Helper function to create dummy resale tickets
    const createDummyResaleTickets = (eventData: any) => {
      // Create 0-1 dummy resale tickets
      const royaltyPercentage = eventData.royaltyPercentage || 5;
      const dummyResaleTickets: ResaleTicket[] = [];

      // 50% chance of having a resale ticket
      if (Math.random() > 0.5) {
        const originalPrice = 50 + Math.floor(Math.random() * 100);
        const markup = 1 + Math.random() * 0.5; // 0-50% markup
        const resalePrice = Math.round(originalPrice * markup);
        const royaltyFee = Math.round(resalePrice * (royaltyPercentage / 100));
        const serviceFee = Math.round(resalePrice * 0.1); // 10% service fee

        dummyResaleTickets.push({
          id: `resale_${Math.random().toString(36).substring(2, 10)}`,
          ticketId: `ticket_${Math.random().toString(36).substring(2, 10)}`,
          eventId: eventData.id,
          section: "GA",
          row: "GA",
          seat: undefined,
          price: resalePrice,
          originalPrice: originalPrice,
          royaltyPercentage: royaltyPercentage,
          royaltyFee: royaltyFee,
          serviceFee: serviceFee,
          sellerId: `user_${Math.random().toString(36).substring(2, 10)}`,
        });
      }

      setResaleTickets(dummyResaleTickets);
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
      section: selectedResaleTicket.section,
      row: selectedResaleTicket.row,
      seats: selectedResaleTicket.seat ? [selectedResaleTicket.seat] : [],
      quantity: 1, // Resale tickets are sold individually
      price: selectedResaleTicket.price,
      fees: selectedResaleTicket.serviceFee + selectedResaleTicket.royaltyFee,
      offerName: `Resale Ticket - ${selectedResaleTicket.section} ${
        selectedResaleTicket.row
      }${
        selectedResaleTicket.seat ? ` Seat ${selectedResaleTicket.seat}` : ""
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

  const handleSectionChange = (value: string) => {
    setSelectedSection(value);
    setSelectedRow("");
    setSelectedSeats([]);

    // Find available rows for this section
    const inventory = selectedTicket?.inventory?.filter(
      (item: any) => item.section === value
    );

    if (inventory && inventory.length > 0) {
      setSelectedRow(inventory[0].row);

      // Select first available seats based on quantity
      if (inventory[0].seats && inventory[0].seats.length >= quantity) {
        setSelectedSeats(inventory[0].seats.slice(0, quantity));
      }
    }
  };

  const handleRowChange = (value: string) => {
    setSelectedRow(value);
    setSelectedSeats([]);

    // Find available seats for this section and row
    const inventoryItem = selectedTicket?.inventory?.find(
      (item: any) => item.section === selectedSection && item.row === value
    );

    if (
      inventoryItem &&
      inventoryItem.seats &&
      inventoryItem.seats.length >= quantity
    ) {
      setSelectedSeats(inventoryItem.seats.slice(0, quantity));
    }
  };

  // Handle seat selection
  const handleSeatClick = (seat: number, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default behavior

    // Toggle seat selection
    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seat));
    } else {
      // Only allow selecting up to the quantity
      if (selectedSeats.length < quantity) {
        setSelectedSeats([...selectedSeats, seat].sort((a, b) => a - b));
      } else {
        // Replace the first seat with the new one
        const newSeats = [...selectedSeats.slice(1), seat].sort(
          (a, b) => a - b
        );
        setSelectedSeats(newSeats);
      }
    }
  };

  const getAvailableSections = () => {
    if (!selectedTicket || !selectedTicket.inventory) return [];

    const sections = new Set<string>();
    selectedTicket.inventory.forEach((item: any) => {
      if (item && item.section) {
        sections.add(item.section);
      }
    });

    return Array.from(sections);
  };

  const getAvailableRows = () => {
    if (!selectedTicket || !selectedTicket.inventory || !selectedSection)
      return [];

    const rows = new Set<string>();
    selectedTicket.inventory
      .filter((item: any) => item && item.section === selectedSection)
      .forEach((item: any) => {
        if (item && item.row) {
          rows.add(item.row);
        }
      });

    return Array.from(rows);
  };

  const getAvailableSeats = () => {
    if (
      !selectedTicket ||
      !selectedTicket.inventory ||
      !selectedSection ||
      !selectedRow
    )
      return [];

    const inventoryItem = selectedTicket.inventory.find(
      (item: any) =>
        item.section === selectedSection && item.row === selectedRow
    );

    return inventoryItem && inventoryItem.seats ? inventoryItem.seats : [];
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{event.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <CartSheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
            <Button
              variant="outline"
              size="icon"
              className="relative"
              onClick={() => setCartSheetOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </Button>
          </CartSheet>

          <Button variant="outline" asChild>
            <Link href="/cart">
              <ShoppingCart className="h-4 w-4 mr-2" />
              View Cart
            </Link>
          </Button>

          <Button variant="outline" asChild>
            <Link href="/my-tickets">
              <Ticket className="h-4 w-4 mr-2" />
              My Tickets
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden mb-6 bg-gray-100">
            <Image
              src={event.image || "/placeholder.svg?height=400&width=800"}
              alt={event.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="flex flex-wrap gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <span>
                {new Date(event.date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-500" />
              <span>{event.venue}</span>
            </div>
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-gray-500" />
              <span>Max {event.ticketLimit || 10} tickets per order</span>
            </div>
            {event.royaltyPercentage > 0 && (
              <div className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-gray-500" />
                <span>Resale Royalty: {event.royaltyPercentage}%</span>
              </div>
            )}
          </div>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">About This Event</h2>
            <p className="text-gray-700">
              {event.description || "No description available for this event."}
            </p>
          </div>
          <ChainTickets eventPublicKey={chainEventKey ?? undefined} />
        </div>

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
                    <TabsTrigger value="resale" className="flex-1">
                      Resale
                    </TabsTrigger>
                    <TabsTrigger value="seating" className="flex-1">
                      Seating
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="tickets" className="mt-4">
                    <div className="space-y-4">
                      {availability.event.tickets.map(
                        (ticket: any, index: number) => (
                          <div
                            key={index}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedTicket === ticket
                                ? "border-primary bg-primary/5"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setSelectedSection("");
                              setSelectedRow("");
                              setSelectedSeats([]);
                              setSelectedResaleTicket(null);

                              // Auto-select first section and row
                              if (
                                ticket.inventory &&
                                ticket.inventory.length > 0
                              ) {
                                setSelectedSection(ticket.inventory[0].section);
                                setSelectedRow(ticket.inventory[0].row);

                                // Select first available seats based on quantity
                                if (
                                  ticket.inventory[0].seats &&
                                  ticket.inventory[0].seats.length >= quantity
                                ) {
                                  setSelectedSeats(
                                    ticket.inventory[0].seats.slice(0, quantity)
                                  );
                                }
                              }
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">
                                  {ticket.offers[0].offerName}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {ticket.available} available
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">
                                  {formatCurrency(ticket.offers[0].faceValue)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  +{" "}
                                  {formatCurrency(
                                    ticket.offers[0].charges.reduce(
                                      (total: number, charge: any) =>
                                        total + (charge.amount || 0),
                                      0
                                    )
                                  )}{" "}
                                  fees
                                </div>
                              </div>
                            </div>

                            {selectedTicket === ticket && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="mb-4">
                                  <Label htmlFor="quantity">Quantity</Label>
                                  {/* Then update the ticket selection UI to show a loading indicator when changing quantity */}
                                  {/* Find the quantity selector and update it: */}
                                  <Select
                                    value={quantity.toString()}
                                    onValueChange={(value) => {
                                      setIsTicketLoading(true);
                                      setQuantity(Number.parseInt(value));
                                      // Use setTimeout to give a small delay for UI to update
                                      setTimeout(
                                        () => setIsTicketLoading(false),
                                        300
                                      );
                                    }}
                                  >
                                    <SelectTrigger id="quantity">
                                      <SelectValue placeholder="Select quantity" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ticket.offers[0].sellableQuantities
                                        ? ticket.offers[0].sellableQuantities
                                            .slice(
                                              0,
                                              Math.min(
                                                10,
                                                ticket.offers[0]
                                                  .sellableQuantities.length
                                              )
                                            )
                                            .map((qty: number) => (
                                              <SelectItem
                                                key={qty}
                                                value={qty.toString()}
                                              >
                                                {qty}
                                              </SelectItem>
                                            ))
                                        : Array.from(
                                            { length: 10 },
                                            (_, i) => i + 1
                                          ).map((qty) => (
                                            <SelectItem
                                              key={qty}
                                              value={qty.toString()}
                                            >
                                              {qty}
                                            </SelectItem>
                                          ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="resale" className="mt-4">
                    {resaleTickets.length === 0 ? (
                      <div className="text-center py-8">
                        <RefreshCw className="mx-auto h-8 w-8 text-gray-300 mb-4" />
                        <p className="text-gray-500 mb-4">
                          No resale tickets available
                        </p>
                        <p className="text-sm text-gray-400">
                          Check back later for fan-to-fan resale tickets
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {resaleTickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedResaleTicket?.id === ticket.id
                                ? "border-primary bg-primary/5"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => {
                              setSelectedResaleTicket(ticket);
                              setSelectedTicket(null);
                              setSelectedSection("");
                              setSelectedRow("");
                              setSelectedSeats([]);
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center">
                                  <h3 className="font-medium">
                                    {ticket.section} {ticket.row}
                                    {ticket.seat ? ` Seat ${ticket.seat}` : ""}
                                  </h3>
                                  <Badge
                                    variant="outline"
                                    className="ml-2 bg-amber-50 text-amber-800 border-amber-200"
                                  >
                                    Resale
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-500">
                                  Original price:{" "}
                                  {formatCurrency(ticket.originalPrice)}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">
                                  {formatCurrency(ticket.price)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  +{" "}
                                  {formatCurrency(
                                    ticket.serviceFee + ticket.royaltyFee
                                  )}{" "}
                                  fees
                                </div>
                              </div>
                            </div>

                            {selectedResaleTicket?.id === ticket.id && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      Ticket Price
                                    </span>
                                    <span>{formatCurrency(ticket.price)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      Service Fee
                                    </span>
                                    <span>
                                      {formatCurrency(ticket.serviceFee)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="flex items-center text-gray-500">
                                      <Percent className="h-3 w-3 mr-1" />
                                      Royalty Fee ({ticket.royaltyPercentage}%)
                                    </span>
                                    <span>
                                      {formatCurrency(ticket.royaltyFee)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="seating" className="mt-4">
                    {selectedTicket ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="section">Section</Label>
                          <Select
                            value={selectedSection}
                            onValueChange={handleSectionChange}
                          >
                            <SelectTrigger id="section">
                              <SelectValue placeholder="Select section" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableSections().map((section) => (
                                <SelectItem key={section} value={section}>
                                  Section {section}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedSection && (
                          <div>
                            <Label htmlFor="row">Row</Label>
                            <Select
                              value={selectedRow}
                              onValueChange={handleRowChange}
                            >
                              <SelectTrigger id="row">
                                <SelectValue placeholder="Select row" />
                              </SelectTrigger>

                              <SelectContent>
                                {getAvailableRows().map((row) => (
                                  <SelectItem key={row} value={row}>
                                    Row {row}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {selectedRow && (
                          <div>
                            <Label>Available Seats</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {getAvailableSeats().map((seat) => (
                                <Badge
                                  key={seat}
                                  variant={
                                    selectedSeats.includes(seat)
                                      ? "default"
                                      : "outline"
                                  }
                                  className="cursor-pointer"
                                  onClick={(e) => handleSeatClick(seat, e)}
                                >
                                  Seat {seat}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Click to select up to {quantity} seats
                            </p>
                          </div>
                        )}

                        {selectedSeats.length > 0 && (
                          <div>
                            <Label>Selected Seats</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {selectedSeats.map((seat) => (
                                <Badge key={seat} variant="default">
                                  Seat {seat}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        Please select a ticket type first
                      </div>
                    )}
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

              {selectedTicket &&
                selectedTicket.offers &&
                selectedTicket.offers[0] && (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>
                        Price ({quantity} x{" "}
                        {formatCurrency(
                          selectedTicket.offers[0].faceValue || 0
                        )}
                        )
                      </span>
                      <span>
                        {formatCurrency(
                          (selectedTicket.offers[0].faceValue || 0) * quantity
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Fees</span>
                      <span>
                        {formatCurrency(
                          selectedTicket.offers[0].charges.reduce(
                            (total: number, charge: any) =>
                              total + (charge.amount || 0),
                            0
                          ) * quantity || 0
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Total</span>
                      <span>
                        {formatCurrency(
                          ((selectedTicket.offers[0].faceValue || 0) +
                            (selectedTicket.offers[0].charges.reduce(
                              (total: number, charge: any) =>
                                total + (charge.amount || 0),
                              0
                            ) || 0)) *
                            quantity
                        )}
                      </span>
                    </div>

                    {/* Then update the Add to Cart button to show the ticket loading state: */}
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleAddToCart}
                      disabled={
                        !selectedTicket || quantity < 1 || isTicketLoading
                      }
                    >
                      {isTicketLoading ? (
                        <div className="flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </div>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-5 w-5" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
