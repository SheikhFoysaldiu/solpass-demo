"use client";
import { AnchorWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import type { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { usePrivateKeyAnchorWallet, useProgram } from "@/lib/hooks/useProgram";
import { useWalletStore } from "@/store/useWalletStore";

export type ChainEvent = {
  publicKey: PublicKey;
  account: {
    authority: PublicKey;
    eventId: string;
    name: string;
    description: string;
    venue: string;
    date: number;
    totalTickets: bigint;
    ticketsSold: bigint;
    ticketPrice: bigint;
    isActive: boolean;
  };
};

export function useChainEvents() {
  const wallet = useAnchorWallet();
  const program = useProgram();
  const privateKeyWallet = usePrivateKeyAnchorWallet();
  const { privateKey } = useWalletStore();

  const fetchChainEvents = async () => {
    // No program, return empty
    if (!program) {
      console.log("No program available, skipping chain events fetch");
      return [];
    }

    // Determine which wallet to use
    let activeWallet: AnchorWallet | null = null;

    if (wallet) {
      activeWallet = wallet;
    } else if (privateKeyWallet && privateKeyWallet.wallet) {
      activeWallet = privateKeyWallet.wallet;
    }

    // If we don't have a wallet, return empty
    if (!activeWallet) {
      console.log("No wallet available, skipping chain events fetch");
      return [];
    }

    try {
      // Safely get the public key as a string
      const publicKeyString = activeWallet.publicKey.toBase58();

      // Fetch events
      try {
        // Check if program.account exists and has the eventAccount property
        if (!program.account || !program.account.eventAccount) {
          console.error("Program account or eventAccount not available");
          return [];
        }

        const events = await program.account.eventAccount.all([
          {
            memcmp: {
              offset: 8,
              bytes: publicKeyString,
            },
          },
        ]);
        console.log("Fetched events:", events);
        return events as ChainEvent[];
      } catch (error) {
        console.error("Error fetching events:", error);
        return [];
      }
    } catch (error) {
      console.error("Error in fetchChainEvents:", error);
      return [];
    }
  };

  // Only enable the query if we have a program and a wallet
  const hasWallet = !!(wallet || (privateKeyWallet && privateKey));
  const queryEnabled = !!program && hasWallet;

  return useQuery({
    queryKey: [
      "chainEvents",
      wallet?.publicKey?.toBase58() ||
        privateKeyWallet?.wallet?.publicKey?.toBase58(),
    ],
    queryFn: fetchChainEvents,
    enabled: queryEnabled,
    retry: false, // Don't retry on failure to avoid repeated errors
  });
}

export default function ChainEvents() {
  const { data: events = [], isLoading, refetch, isError } = useChainEvents();

  return (
    <div className="mt-12 border-t pt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Blockchain Events</h2>
        <Button onClick={() => refetch()} disabled={isLoading}>
          {isLoading && <Loader2 className="animate-spin mr-2" />}
          Refresh Chain Events
        </Button>
      </div>

      {isError ? (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-700">
          <p>Error loading blockchain events. Please try again later.</p>
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {events.map((event) => (
            <div
              key={event.publicKey.toBase58()}
              className="p-4 border rounded-lg"
            >
              <h3 className="font-semibold">{event.account.name}</h3>
              <p className="text-sm text-gray-500 truncate">
                {event.account.description}
              </p>
              <div className="flex justify-between mt-2 text-sm">
                <span>Price: {Number(event.account.ticketPrice)} Lamport</span>
                <span>
                  Sold: {Number(event.account.ticketsSold)}/
                  {Number(event.account.totalTickets)}
                </span>
              </div>
              <p className="text-xs mt-2 text-gray-400">
                ID: {event.account.eventId}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No events found on blockchain</p>
      )}
    </div>
  );
}
