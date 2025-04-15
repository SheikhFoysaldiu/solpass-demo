import { PublicKey } from "@solana/web3.js";
import { AnchorWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { useState } from "react";

import { Button } from "../ui/button";
import { usePrivateKeyAnchorWallet, useProgram } from "@/lib/hooks/useProgram";
import ResellButton from "./resell";
import DistributeButton from "./distribute";
import { Badge } from "../ui/badge";
import { useViewModeStore } from "@/store/useViewModeStore";

export type ChainTicket = {
  publicKey: PublicKey;
  account: {
    owner: string;
    event: PublicKey;
    ticketId: string;
    purchaseDate: number;
    ticketPrice: number;
    resellCount: number;
    accumulatedRoyalty: string;
    royaltyDistributed: boolean;
  };
};

export type TicketHistory = {
  publicKey: PublicKey;
  account: {
    ticket: PublicKey;
    seller: string;
    buyer: string;
    purchaseDate: number;
    ticketPrice: number;
  };
};

export function useEventTickets(eventPublicKey?: string) {
  const w = useAnchorWallet();
  const program = useProgram();
  const privateWallet = usePrivateKeyAnchorWallet();

  let wallet: AnchorWallet | null = null;
  if (w) {
    wallet = w;
  } else {
    if (privateWallet) {
      wallet = privateWallet.wallet;
    }
  }

  const fetchEventTickets = async () => {
    if (!wallet || !program || !eventPublicKey) return [];

    try {
      // Fetch all tickets for the specified event
      const tickets = await program.account.ticketAccount.all([
        {
          memcmp: {
            offset: 8,
            bytes: eventPublicKey,
          },
        },
      ]);

      console.log(">> Event Tickets:", tickets);
      return tickets as ChainTicket[];
    } catch (error) {
      console.error("Error fetching tickets:", error);
      return [];
    }
  };

  return useQuery({
    queryKey: ["eventTickets", eventPublicKey],
    queryFn: fetchEventTickets,
    enabled: !!wallet && !!eventPublicKey && !!program,
  });
}

export function useMyTickets() {
  const wallet = useAnchorWallet();
  const program = useProgram();

  const fetchMyTickets = async () => {
    if (!wallet || !program) return [];

    try {
      // Fetch tickets owned by the wallet
      const tickets = await program.account.ticketAccount.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: wallet.publicKey.toBase58(),
          },
        },
      ]);

      return tickets as ChainTicket[];
    } catch (error) {
      console.error("Error fetching tickets:", error);
      return [];
    }
  };

  return useQuery({
    queryKey: ["myTickets", wallet?.publicKey?.toBase58()],
    queryFn: fetchMyTickets,
    enabled: !!wallet && !!program,
  });
}

export function useTicketHistory(ticketPublicKey?: string) {
  const program = useProgram();

  const fetchTicketHistory = async () => {
    if (!program || !ticketPublicKey) return [];

    try {
      // Fetch all history records for this ticket
      const historyRecords = await program.account.ticketSellHistory.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: ticketPublicKey,
          },
        },
      ]);

      console.log(">> Ticket History:", historyRecords);
      return historyRecords as TicketHistory[];
    } catch (error) {
      console.error("Error fetching ticket history:", error);
      return [];
    }
  };

  return useQuery({
    queryKey: ["ticketHistory", ticketPublicKey],
    queryFn: fetchTicketHistory,
    enabled: !!ticketPublicKey && !!program,
  });
}

function TicketHistoryDisplay({
  ticketPublicKey,
}: {
  ticketPublicKey: string;
}) {
  const { data: historyRecords = [], isLoading } =
    useTicketHistory(ticketPublicKey);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="py-4 flex justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (historyRecords.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No resale history found for this ticket.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      <h4 className="text-sm font-medium">Resale History</h4>
      <div className="space-y-2">
        {historyRecords.map((record, index) => (
          <div
            key={record.publicKey.toString()}
            className="bg-white p-3 rounded-md border text-sm"
          >
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Transaction #{index + 1}
              </span>
              <span className="font-medium">
                {record.account.ticketPrice
                  ? `${record.account.ticketPrice} Lamport`
                  : "Price not available"}
              </span>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-xs">
                <span className="text-muted-foreground">From:</span>{" "}
                <span className="font-mono">
                  {record.account.seller.substring(0, 8)}...
                </span>
              </p>
              <p className="text-xs">
                <span className="text-muted-foreground">To:</span>{" "}
                <span className="font-mono">
                  {record.account.buyer.substring(0, 8)}...
                </span>
              </p>
              <p className="text-xs">
                <span className="text-muted-foreground">Date:</span>{" "}
                {formatDate(record.account.purchaseDate)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ChainTicketsProps {
  eventPublicKey?: string;
  showOwners?: boolean;
  title?: string;
  royalties?: {
    ticketmaster: number;
    team: number;
    solpass: number;
  };
}

export default function ChainTickets({
  eventPublicKey,
  showOwners = false,
  title,
  royalties,
}: ChainTicketsProps) {
  // Get the current view mode
  const { mode } = useViewModeStore();

  // Use the appropriate hook based on whether we're showing event tickets or user tickets
  const {
    data: allTickets = [],
    isLoading,
    refetch,
  } = eventPublicKey ? useEventTickets(eventPublicKey) : useMyTickets();

  const wallet = usePrivateKeyAnchorWallet();
  const anchorWallet = useAnchorWallet();
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {}
  );

  // Filter tickets based on mode
  const tickets =
    mode === "user" && eventPublicKey
      ? allTickets.filter(
          (ticket) =>
            wallet?.wallet.publicKey.toString() ===
              ticket.account.owner.toString() ||
            anchorWallet?.publicKey.toString() ===
              ticket.account.owner.toString()
        )
      : allTickets;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Determine display title based on mode and props
  const displayTitle =
    title ||
    (mode === "user"
      ? "My Tickets"
      : eventPublicKey
      ? "Event Tickets"
      : "My Tickets");

  const handleResellSuccess = () => {
    // Refetch the tickets to update the UI
    refetch();
  };

  const toggleExpand = (ticketId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [ticketId]: !prev[ticketId],
    }));
  };

  return (
    <div className="mt-12 border-t pt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">{displayTitle}</h2>
        <Button onClick={() => refetch()} disabled={isLoading}>
          {isLoading && <Loader2 className="animate-spin mr-2" />}
          Refresh Tickets
        </Button>
      </div>

      {tickets.length > 0 ? (
        <div className="grid grid-cols-1  gap-4">
          {tickets.map((ticket) => {
            const isOwned =
              wallet?.wallet.publicKey.toString() ===
                ticket.account.owner.toString() ||
              anchorWallet?.publicKey.toString() ===
                ticket.account.owner.toString();
            const isExpanded =
              expandedCards[ticket.publicKey.toBase58()] || false;
            const isRoyaltyDistributed = ticket.account.royaltyDistributed;

            return (
              <div
                key={ticket.publicKey.toBase58()}
                className={`border rounded-lg shadow-sm overflow-hidden ${
                  isRoyaltyDistributed
                    ? "border-purple-300"
                    : isOwned
                    ? "border-green-200"
                    : "border-slate-200"
                }`}
              >
                {/* Card header */}
                <div
                  className={`p-4 ${
                    isRoyaltyDistributed
                      ? "bg-gradient-to-br from-purple-50 to-purple-100"
                      : isOwned
                      ? "bg-gradient-to-br from-green-50 to-green-100"
                      : "bg-gradient-to-br from-slate-50 to-slate-100"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-semibold">
                          Ticket #{ticket.account.ticketId}
                        </h3>
                        {isRoyaltyDistributed && (
                          <Badge className="ml-2 bg-purple-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Royalty Paid
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Purchased: {formatDate(ticket.account.purchaseDate)}
                      </p>
                      {showOwners && (
                        <p className="text-xs mt-1 text-gray-500">
                          {isOwned
                            ? "You own this ticket"
                            : "Owned by someone else"}
                        </p>
                      )}
                    </div>
                    <div className="bg-white p-2 rounded-md border text-center">
                      <p className="text-xs font-mono">
                        {ticket.publicKey.toString().substring(0, 8)}...
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 mt-2">
                    <p>Resell count: {ticket.account.resellCount}</p>
                    <p>
                      Total royalty:{" "}
                      {parseFloat(ticket.account.accumulatedRoyalty)} Lamport
                      {isRoyaltyDistributed && (
                        <span className="text-purple-600 font-medium ml-2">
                          (Distributed)
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Owner information when showOwners is true */}
                  {showOwners && (
                    <div className="mt-3 pt-2 border-t">
                      <p className="text-xs text-gray-500">Owner:</p>
                      <p className="text-sm font-mono truncate">
                        {ticket.account.owner.toString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card actions */}
                <div
                  className={`px-4 py-3 ${
                    isRoyaltyDistributed ? "bg-purple-50" : "bg-white"
                  } border-t flex justify-between items-center`}
                >
                  <div className="flex flex-col space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(ticket.publicKey.toBase58())}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 mr-1" />
                      ) : (
                        <ChevronDown className="h-4 w-4 mr-1" />
                      )}
                      {isExpanded ? "Hide History" : "Show History"}
                    </Button>
                  </div>

                  <div className="flex space-x-2">
                    {/* Only show resell button for user mode when royalty is not distributed yet */}
                    {!ticket.account.royaltyDistributed && (
                      <>
                        {/* Only show resell button in user mode */}
                        {mode === "user" && (
                          <ResellButton
                            ticket={ticket}
                            onSuccess={handleResellSuccess}
                            royalties={royalties}
                          />
                        )}

                        {/* Only show distribute button in team mode */}
                        {mode === "team" && ticket.account.resellCount > 0 && (
                          <DistributeButton
                            ticket={ticket}
                            royalties={royalties}
                            onSuccess={handleResellSuccess}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded ticket history section */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50 border-t">
                    <TicketHistoryDisplay
                      ticketPublicKey={ticket.publicKey.toBase58()}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 border rounded-lg bg-slate-50">
          <p className="text-gray-500">
            {isLoading
              ? "Loading tickets..."
              : mode === "user" && eventPublicKey
              ? "You don't have any tickets for this event"
              : "No onchain tickets found"}
          </p>
        </div>
      )}
    </div>
  );
}
