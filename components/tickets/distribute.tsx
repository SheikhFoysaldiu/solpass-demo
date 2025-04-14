import React, { useState } from "react";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { useProgram, usePrivateKeyAnchorWallet } from "@/lib/hooks/useProgram";
import { AnchorWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { ChainTicket } from "./chain-tickets";
import { Loader2 } from "lucide-react";
import {
  solPassWalletAddress,
  teamWalletAddress,
  ticketMasterWalletAddress,
} from "@/lib/contants";

interface DistributeButtonProps {
  ticket: ChainTicket;
  //   teamWalletAddress: string; // Public key of the team wallet to receive royalties
  onSuccess?: () => void;
}

export default function DistributeButton({
  ticket,
  //   teamWalletAddress,
  onSuccess,
}: DistributeButtonProps) {
  const [isDistributing, setIsDistributing] = useState(false);
  const { toast } = useToast();
  const program = useProgram();
  const w = useAnchorWallet();
  const privateWallet = usePrivateKeyAnchorWallet();

  const handleDistribute = async () => {
    if (!program) {
      toast({
        title: "Program not found",
        description: "The Solana program could not be loaded.",
        variant: "destructive",
      });
      return;
    }

    // Get the right wallet instance
    let wallet: AnchorWallet | null = null;
    if (w) {
      wallet = w;
    } else if (privateWallet) {
      wallet = privateWallet.wallet;
    }

    if (!wallet) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to distribute royalties.",
        variant: "destructive",
      });
      return;
    }

    setIsDistributing(true);

    try {
      // Parse team wallet address
      const ticketMasterWallet = new PublicKey(ticketMasterWalletAddress);
      const solPassWallet = new PublicKey(solPassWalletAddress);
      const teamWallet = new PublicKey(teamWalletAddress);

      // Get the event account from the ticket
      const eventAccount = new PublicKey(ticket.account.event);

      // Call distribute_royalty instruction
      const tx = await program.methods
        .distributeRoyalty(
          ticket.account.ticketId
          // Remove these parameters, they'll be used as accounts
          // ticketMasterWallet,
          // solPassWallet
        )
        .accounts({
          ticketAccount: ticket.publicKey,
          eventAccount: eventAccount,
          payer: wallet.publicKey,
          teamWallet: teamWallet,
          ticketmasterWallet: ticketMasterWallet, // Add this
          solpassWallet: solPassWallet, // Add this
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Royalty distribution transaction:", tx);

      toast({
        title: "Royalties Distributed",
        description:
          "Royalties have been successfully distributed to the team wallet.",
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error distributing royalties:", error);
      toast({
        title: "Distribution failed",
        description: "Failed to distribute royalties. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDistributing(false);
    }
  };

  return (
    <Button
      size="sm"
      onClick={handleDistribute}
      disabled={isDistributing}
      variant="outline"
    >
      {isDistributing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        "Distribute Royalties"
      )}
    </Button>
  );
}
