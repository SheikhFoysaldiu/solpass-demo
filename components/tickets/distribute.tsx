import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { useProgram, usePrivateKeyAnchorWallet } from "@/lib/hooks/useProgram";
import { AnchorWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { ChainTicket } from "./chain-tickets";
import { Loader2, CheckCircle2 } from "lucide-react";
import {
  solPassWalletAddress,
  teamWalletAddress,
  ticketMasterWalletAddress,
} from "@/lib/contants";
import { formatCurrency, lamportsToUsd } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface DistributeButtonProps {
  royalties?: {
    ticketmaster: number;
    team: number;
    solpass: number;
  };
  ticket: ChainTicket;
  onSuccess?: () => void;
}

export default function DistributeButton({
  ticket,
  royalties,
  onSuccess,
}: DistributeButtonProps) {
  const [isDistributing, setIsDistributing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [royaltyBreakdown, setRoyaltyBreakdown] = useState({
    ticketmaster: royalties?.ticketmaster ?? 10,
    team: royalties?.team ?? 5,
    solpass: royalties?.solpass ?? 2.5,
  });
  const { toast } = useToast();
  const program = useProgram();
  const w = useAnchorWallet();
  const privateWallet = usePrivateKeyAnchorWallet();

  // Get the total accumulated royalty amount
  const totalRoyaltyAmount = parseFloat(ticket.account.accumulatedRoyalty);

  // Calculate how much each party gets
  const getTicketmasterAmount = () => {
    const totalPercentage =
      royaltyBreakdown.ticketmaster +
      royaltyBreakdown.team +
      royaltyBreakdown.solpass;

    return (
      (totalRoyaltyAmount * royaltyBreakdown.ticketmaster) / totalPercentage
    );
  };

  const getTeamAmount = () => {
    const totalPercentage =
      royaltyBreakdown.ticketmaster +
      royaltyBreakdown.team +
      royaltyBreakdown.solpass;

    return (totalRoyaltyAmount * royaltyBreakdown.team) / totalPercentage;
  };

  const getSolpassAmount = () => {
    const totalPercentage =
      royaltyBreakdown.ticketmaster +
      royaltyBreakdown.team +
      royaltyBreakdown.solpass;

    return (totalRoyaltyAmount * royaltyBreakdown.solpass) / totalPercentage;
  };

  const handleOpenDialog = () => {
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
      // Parse wallet addresses
      const ticketMasterWallet = new PublicKey(ticketMasterWalletAddress);
      const solPassWallet = new PublicKey(solPassWalletAddress);
      const teamWallet = new PublicKey(teamWalletAddress);

      // Get the event account from the ticket
      const eventAccount = new PublicKey(ticket.account.event);

      // Call distribute_royalty instruction
      const tx = await program.methods
        .distributeRoyalty(ticket.account.ticketId)
        .accounts({
          ticketAccount: ticket.publicKey,
          eventAccount: eventAccount,
          payer: wallet.publicKey,
          teamWallet: teamWallet,
          ticketmasterWallet: ticketMasterWallet,
          solpassWallet: solPassWallet,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Royalty distribution transaction:", tx);

      toast({
        title: "Royalties Distributed",
        description:
          "Royalties have been successfully distributed to all parties.",
      });

      // Close the dialog
      setIsDialogOpen(false);

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
    <>
      <Button
        size="sm"
        onClick={handleOpenDialog}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Distribute Royalties for Ticket #{ticket.account.ticketId}
            </DialogTitle>
            <DialogDescription>
              Review and confirm royalty distribution for this ticket.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Royalty Distribution</h4>
              <div className="bg-slate-50 p-4 rounded-md border space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Royalty Amount:</span>
                  <span className="text-lg font-semibold">
                    {formatCurrency(lamportsToUsd(totalRoyaltyAmount))}
                  </span>
                </div>

                <div className="pt-3 border-t space-y-2">
                  <h5 className="text-sm font-medium text-slate-500">
                    Distribution Breakdown:
                  </h5>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span>
                        Ticketmaster ({royaltyBreakdown.ticketmaster}%):
                      </span>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(lamportsToUsd(getTicketmasterAmount()))}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span>Team ({royaltyBreakdown.team}%):</span>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(lamportsToUsd(getTeamAmount()))}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span>SolPass ({royaltyBreakdown.solpass}%):</span>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(lamportsToUsd(getSolpassAmount()))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
              <p>
                Once distributed, royalties cannot be reclaimed. This action is
                irreversible.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDistribute} disabled={isDistributing}>
              {isDistributing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Distribution"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
