import { AnchorProvider, Program, setProvider } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

import { programId } from "@/lib/contants";
import { IDLType } from "@/lib/idl";
import idl from "@/lib/idl.json";
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
    // No wallet and no program, return empty
    if (!program) return [];

    // If we have a regular wallet, use it
    if (wallet) {
      const events = await program.account.eventAccount.all([
        {
          memcmp: {
            offset: 8,
            bytes: wallet.publicKey.toBase58(),
          },
        },
      ]);
      console.log("Using regular wallet to fetch events:", events);
      return events as ChainEvent[];
    }
    // If we have a private key wallet, use it as fallback
    else if (privateKeyWallet && privateKeyWallet.wallet) {
      const events = await program.account.eventAccount.all([
        {
          memcmp: {
            offset: 8,
            bytes: privateKeyWallet.wallet.publicKey.toBase58(),
          },
        },
      ]);
      console.log("Using private key wallet to fetch events:", events);
      return events as ChainEvent[];
    }

    // No wallet available
    return [];
  };

  return useQuery({
    queryKey: [
      "chainEvents",
      wallet?.publicKey?.toBase58() ||
        privateKeyWallet?.wallet?.publicKey?.toBase58(),
    ],
    queryFn: fetchChainEvents,
    enabled: !!(program && (wallet || (privateKeyWallet && privateKey))),
  });
}

export default function ChainEvents() {
  const { data: events = [], isLoading, refetch } = useChainEvents();

  return (
    <div className="mt-12 border-t pt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Blockchain Events</h2>
        <Button onClick={() => refetch()} disabled={isLoading}>
          {isLoading && <Loader2 className="animate-spin mr-2" />}
          Refresh Chain Events
        </Button>
      </div>

      {events.length > 0 ? (
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
                <span>
                  Price: {Number(event.account.ticketPrice) / 1000000000} SOL
                </span>
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
