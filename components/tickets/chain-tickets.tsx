import { PublicKey } from "@solana/web3.js";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Button } from "../ui/button";
import { useProgram } from "@/lib/hooks/useProgram";

export type ChainTicket = {
  publicKey: PublicKey;
  account: {
    owner: PublicKey;
    event: PublicKey;
    ticketId: string;
    purchaseDate: number;
  };
};

export function useEventTickets(eventPublicKey?: string) {
  const wallet = useAnchorWallet();
  const program = useProgram();

  const fetchEventTickets = async () => {
    if (!wallet || !program || !eventPublicKey) return [];

    try {
      // Fetch all tickets for the specified event
      const tickets = await program.account.ticketAccount.all([
        {
          memcmp: {
            offset: 8 + 32, // Skip discriminator (8 bytes) and owner public key (32 bytes)
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

interface ChainTicketsProps {
  eventPublicKey?: string;
  showOwners?: boolean;
  title?: string;
}

export default function ChainTickets({
  eventPublicKey,
  showOwners = false,
  title,
}: ChainTicketsProps) {
  // Use the appropriate hook based on whether we're showing event tickets or user tickets
  const {
    data: tickets = [],
    isLoading,
    refetch,
  } = eventPublicKey ? useEventTickets(eventPublicKey) : useMyTickets();

  const wallet = useAnchorWallet();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const displayTitle =
    title || (eventPublicKey ? "Event Tickets" : "My Tickets");

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tickets.map((ticket) => {
            const isOwned =
              wallet?.publicKey.toString() === ticket.account.owner.toString();

            return (
              <div
                key={ticket.publicKey.toBase58()}
                className={`p-4 border rounded-lg shadow-sm ${
                  isOwned
                    ? "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
                    : "bg-gradient-to-br from-slate-50 to-slate-100"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">
                      Ticket #{ticket.account.ticketId}
                    </h3>
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

                {showOwners && (
                  <div className="mt-4 pt-2 border-t">
                    <p className="text-xs text-gray-500">Owner:</p>
                    <p className="text-sm font-mono truncate">
                      {ticket.account.owner.toString()}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 border rounded-lg bg-slate-50">
          <p className="text-gray-500">
            {isLoading ? "Loading tickets..." : "No tickets found"}
          </p>
        </div>
      )}
    </div>
  );
}
