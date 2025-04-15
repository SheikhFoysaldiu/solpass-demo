import React, { useState } from "react";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { useProgram, usePrivateKeyAnchorWallet } from "@/lib/hooks/useProgram";
import { AnchorWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { ChainTicket } from "./chain-tickets";
import { Loader2 } from "lucide-react";
import { BN } from "@coral-xyz/anchor";
import { usdToLamports, formatCurrency, lamportsToUsd } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface ResellButtonProps {
  ticket: ChainTicket;
  royalties?: {
    ticketmaster: number;
    team: number;
    solpass: number;
  };

  onSuccess?: () => void;
}

export default function ResellButton({
  ticket,
  onSuccess,
  royalties,
}: ResellButtonProps) {
  const [isReselling, setIsReselling] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPrice, setNewPrice] = useState(100); // Default price in USD
  const [royaltyBreakdown, setRoyaltyBreakdown] = useState({
    ticketmaster: royalties?.ticketmaster ?? 10,
    team: royalties?.team ?? 5,
    solpass: royalties?.solpass ?? 5,
  });
  const { toast } = useToast();
  const program = useProgram();
  const w = useAnchorWallet();
  const privateWallet = usePrivateKeyAnchorWallet();

  // Calculate the royalty amount based on the new price
  const calculateRoyaltyAmount = () => {
    const totalRoyaltyPercentage =
      royaltyBreakdown.ticketmaster +
      royaltyBreakdown.team +
      royaltyBreakdown.solpass;

    return (newPrice * totalRoyaltyPercentage) / 100;
  };

  // Calculate how much each party gets
  const getTicketmasterAmount = () => {
    const totalPercentage =
      royaltyBreakdown.ticketmaster +
      royaltyBreakdown.team +
      royaltyBreakdown.solpass;

    return (
      (calculateRoyaltyAmount() * royaltyBreakdown.ticketmaster) /
      totalPercentage
    );
  };

  const getTeamAmount = () => {
    const totalPercentage =
      royaltyBreakdown.ticketmaster +
      royaltyBreakdown.team +
      royaltyBreakdown.solpass;

    return (calculateRoyaltyAmount() * royaltyBreakdown.team) / totalPercentage;
  };

  const getSolpassAmount = () => {
    const totalPercentage =
      royaltyBreakdown.ticketmaster +
      royaltyBreakdown.team +
      royaltyBreakdown.solpass;

    return (
      (calculateRoyaltyAmount() * royaltyBreakdown.solpass) / totalPercentage
    );
  };

  const handleOpenDialog = () => {
    // Try to parse royalty percentages from event
    if (program) {
      // We could fetch the event here to get the royalty breakdown
      // For now we'll use default values
      setIsDialogOpen(true);
    } else {
      toast({
        title: "Program not found",
        description: "The Solana program could not be loaded.",
        variant: "destructive",
      });
    }
  };

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

      // Generate new price from input
      const newPriceInLamport = new BN(usdToLamports(newPrice));
      const eventAccount = new PublicKey(ticket.account.event.toBase58());

      // Call resellTicket instruction
      const tx = await program.methods
        .resellTicket(sellar, buyer, newPriceInLamport)
        .accounts({
          ticketAccount: ticket.publicKey,
          ticketHistory: ticketHistoryPda,
          eventAccount: eventAccount,
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

      // Close the dialog
      setIsDialogOpen(false);

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
    <>
      <Button size="sm" onClick={handleOpenDialog} disabled={isReselling}>
        {isReselling ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Resell"
        )}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Resell Ticket #{ticket.account.ticketId}</DialogTitle>
            <DialogDescription>
              Set a new price for your ticket. A portion will be collected as
              royalties.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                New Price (USD)
              </Label>
              <Input
                id="price"
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(parseFloat(e.target.value))}
                className="col-span-3"
              />
            </div>

            <div className="mt-4">
              <h4 className="font-medium mb-2">Royalty Breakdown</h4>
              <div className="bg-slate-50 p-3 rounded-md border space-y-2 text-sm">
                <p className="flex justify-between">
                  <span>
                    Total Royalty (
                    {royaltyBreakdown.ticketmaster +
                      royaltyBreakdown.team +
                      royaltyBreakdown.solpass}
                    %):
                  </span>
                  <span className="font-medium">
                    {formatCurrency(calculateRoyaltyAmount())}
                  </span>
                </p>
                <hr className="my-1" />
                <p className="flex justify-between">
                  <span>Ticketmaster ({royaltyBreakdown.ticketmaster}%):</span>
                  <span>{formatCurrency(getTicketmasterAmount())}</span>
                </p>
                <p className="flex justify-between">
                  <span>Team ({royaltyBreakdown.team}%):</span>
                  <span>{formatCurrency(getTeamAmount())}</span>
                </p>
                <p className="flex justify-between">
                  <span>SolPass ({royaltyBreakdown.solpass}%):</span>
                  <span>{formatCurrency(getSolpassAmount())}</span>
                </p>
              </div>
            </div>

            <div className="mt-2">
              <p className="text-sm text-muted-foreground">
                You will receive:{" "}
                <span className="font-medium">
                  {formatCurrency(newPrice - calculateRoyaltyAmount())}
                </span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResell} disabled={isReselling}>
              {isReselling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Resell"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
