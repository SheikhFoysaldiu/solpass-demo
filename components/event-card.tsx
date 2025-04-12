import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChainEvent } from "@/components/events/chain-events";
import { EventType } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface EventCardProps {
  event: EventType;
  isOnChain?: boolean;
  chainData?: ChainEvent;
  onInitialize?: (royalties: RoyaltyFormValues) => void;
  isInitializing?: boolean;
  walletConnected?: boolean;
}

// Define our royalty schema
const royaltySchema = z
  .object({
    ticketmaster: z.coerce.number().min(0).max(100),
    team: z.coerce.number().min(0).max(100),
    solpass: z.coerce.number().min(0).max(100),
  })
  .refine(
    (data) => {
      const total = data.ticketmaster + data.team + data.solpass;
      return total <= 100;
    },
    {
      message: "Total royalties cannot exceed 100%",
      path: ["teamRoyalty"], // Show error on this field
    }
  );

export type RoyaltyFormValues = z.infer<typeof royaltySchema>;

export function EventCard({
  event,
  isOnChain = false,
  chainData,
  onInitialize,
  isInitializing = false,
  walletConnected = false,
}: EventCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Create form
  const form = useForm<RoyaltyFormValues>({
    resolver: zodResolver(royaltySchema),
    defaultValues: {
      ticketmaster: 11,
      team: 20,
      solpass: 2.5,
    },
  });

  // Add a safety check to ensure the event object is valid
  if (!event || !event.id) {
    return null;
  }

  // Calculate on-chain ticket stats if available
  const ticketsSold = chainData ? Number(chainData.account.ticketsSold) : 0;
  const totalTickets = chainData ? Number(chainData.account.totalTickets) : 0;
  const soldPercentage =
    totalTickets > 0 ? (ticketsSold / totalTickets) * 100 : 0;

  const handleInitialize = (values: RoyaltyFormValues) => {
    if (onInitialize) {
      onInitialize(values);
      setDialogOpen(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div className="relative h-48 w-full">
          <Image
            src={event.image || "/placeholder.svg?height=200&width=400"}
            alt={event.name || "Event"}
            fill
            className="object-cover"
          />
          {isOnChain && (
            <div className="absolute top-2 right-2">
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 border-0"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                On-chain
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold text-lg mb-2 line-clamp-1">
            {event.name || "Untitled Event"}
          </h3>
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{event.date ? formatDate(event.date) : "Date TBD"}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="line-clamp-1">{event.venue || "Venue TBD"}</span>
            </div>

            {/* Show price information */}
            <div className="pt-2">
              <span className="font-medium text-black">
                {/* {event.ticketTypes.price[0] || "Free"} {event.price ? "SOL" : ""} */}
              </span>
            </div>

            {/* Show on-chain stats if available */}
            {isOnChain && (
              <div className="pt-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Tickets sold:</span>
                  <span>
                    {ticketsSold}/{totalTickets}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                  <div
                    className="h-1.5 bg-green-500 rounded-full"
                    style={{ width: `${soldPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 gap-2 flex flex-col">
          {/* Show initialize button if not on chain and wallet connected */}
          {!isOnChain && walletConnected && onInitialize && (
            <Button
              variant="outline"
              onClick={() => setDialogOpen(true)}
              disabled={isInitializing}
              className="w-full"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Initializing...
                </>
              ) : (
                "Initialize on Blockchain"
              )}
            </Button>
          )}

          {/* The original View Event button */}
          <Button asChild className="w-full">
            <Link
              href={`/events/${event.id}${
                chainData
                  ? `?chainEventKey=${chainData.publicKey.toString()}`
                  : ""
              }`}
            >
              View Event
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Royalty Setting Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set Resell Royalty Distribution</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleInitialize)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="ticketmaster"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticketmaster (%)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.1" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="team"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Royalty (%)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.1" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="solpass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Solpass (%)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.1" />
                    </FormControl>
                    <FormDescription>
                      Remaining percentage goes to the user selling the ticket.
                    </FormDescription>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isInitializing}>
                  {isInitializing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    "Initialize Event"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
