import React, { useState } from "react";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { useProgram, usePrivateKeyAnchorWallet } from "@/lib/hooks/useProgram";
import { AnchorWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { ChainTicket } from "./chain-tickets";
import { Loader2 } from "lucide-react";
import { BN } from "@coral-xyz/anchor";

interface ResellButtonProps {
  ticket: ChainTicket;
  onSuccess?: () => void;
}

export default function ResellButton({ ticket, onSuccess }: ResellButtonProps) {
  console.log("ticket", ticket);
  const [isReselling, setIsReselling] = useState(false);
  const { toast } = useToast();
  const program = useProgram();
  const w = useAnchorWallet();
  const privateWallet = usePrivateKeyAnchorWallet();

  const handleResell = async () => {
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
        description: "Please connect your wallet to resell this ticket.",
        variant: "destructive",
      });
      return;
    }

    setIsReselling(true);
    const sellar = ticket.account.owner; // The current owner of the ticket
    const buyer = "new_buyer";
    console.log(
      Buffer.from("HISTORY"),
      ticket.publicKey.toBuffer(),
      Buffer.from(ticket.account.ticketId)
    );

    try {
      // Create a PDA for ticket history
      const [ticketHistoryPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("HISTORY"),
          ticket.publicKey.toBuffer(),
          Uint8Array.from([ticket.account.resellCount]),
        ],
        program.programId
      );

      // Generate new price (increase by 10%)
      const currentPrice = 10; // Ideally get this from the ticket if available
      const newPrice = new BN(currentPrice > 0 ? currentPrice * 1.1 : 250000); // Default or increase by 10%

      // Call resellTicket instruction
      const tx = await program.methods
        .resellTicket(
          //   wallet.publicKey.toBase58(), // seller
          sellar,
          buyer,
          newPrice
        )
        .accounts({
          ticketAccount: ticket.publicKey,
          ticketHistory: ticketHistoryPda,
          payer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Ticket resell transaction:", tx);

      toast({
        title: "Ticket listed for resale",
        description:
          "Your ticket has been successfully listed for resale on the blockchain.",
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error reselling ticket:", error);
      toast({
        title: "Resell failed",
        description: "Failed to list your ticket for resale on the blockchain.",
        variant: "destructive",
      });
    } finally {
      setIsReselling(false);
    }
  };

  return (
    <Button size="sm" onClick={handleResell} disabled={isReselling}>
      {isReselling ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        "Resell"
      )}
    </Button>
  );
}
