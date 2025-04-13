"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useWalletStore } from "@/store/useWalletStore";
import { WalletButton } from "./wallate-button";
import { useWallet } from "@solana/wallet-adapter-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import {
  Keypair,
  Connection,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from "@solana/web3.js";
import { toast } from "sonner";
import { Loader2, Key, LogOut, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function WalletModal() {
  const [open, setOpen] = useState(false);
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");
  const { privateKey, setPrivateKey, walletType, clearWallet, getKeypair } =
    useWalletStore();
  const { connected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Function to fetch wallet balance
  const fetchWalletBalance = async () => {
    if (walletType === "privateKey") {
      setIsLoadingBalance(true);
      try {
        const keypair = getKeypair();
        if (keypair) {
          const connection = new Connection(
            clusterApiUrl("devnet"),
            "confirmed"
          );
          const walletBalance = await connection.getBalance(keypair.publicKey);
          setBalance(walletBalance / LAMPORTS_PER_SOL);
        }
      } catch (err) {
        console.error("Error fetching balance:", err);
        toast.error("Failed to fetch wallet balance");
      } finally {
        setIsLoadingBalance(false);
      }
    }
  };

  // Fetch balance when wallet type changes or when modal opens
  useEffect(() => {
    if (walletType === "privateKey") {
      fetchWalletBalance();
    }
  }, [walletType]);

  // Close the dialog when wallet gets connected
  useEffect(() => {
    if (connected) {
      setOpen(false);
    }
  }, [connected]);

  const connectWithPrivateKey = () => {
    if (!privateKeyInput) {
      setError("Please enter a private key");
      return;
    }

    setIsConnecting(true);
    setError("");

    try {
      // Validate the private key by attempting to create a keypair
      const secretKey = bs58.decode(privateKeyInput);
      const keypair = Keypair.fromSecretKey(secretKey);

      // Store in Zustand
      setPrivateKey(privateKeyInput);

      toast.success("Connected with private key successfully", {
        description: `Address: ${keypair.publicKey
          .toString()
          .slice(0, 8)}...${keypair.publicKey.toString().slice(-8)}`,
      });

      // Close the dialog
      setOpen(false);

      // Fetch balance after connecting
      fetchWalletBalance();
    } catch (err) {
      console.error("Invalid private key:", err);
      setError("Invalid private key format. Please check and try again.");
      toast.error("Invalid private key");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    clearWallet();
    setBalance(null);
    toast.success("Wallet disconnected");
    setOpen(false);
  };

  const buttonLabel = connected
    ? "Wallet Connected"
    : walletType === "privateKey"
    ? "Private Key Connected"
    : "Connect Wallet";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={`${
            connected || walletType === "privateKey"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
          } 
            text-white font-medium py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2`}
          // disabled={connected}
        >
          <WalletIcon />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect your wallet</DialogTitle>
          <DialogDescription>
            Connect your Solana wallet to continue
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          {walletType === "privateKey" ? (
            <Card>
              <CardContent className="pt-6 space-y-4">
                {getKeypair() && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      Wallet Address
                    </Label>
                    <div className="font-mono text-sm bg-muted p-2 rounded-md break-all">
                      {getKeypair()?.publicKey.toString()}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm text-muted-foreground">
                      Balance
                    </Label>
                    {isLoadingBalance && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                  <div className="font-mono text-xl font-bold">
                    {balance !== null
                      ? `${balance.toFixed(4)} SOL`
                      : "Loading..."}
                  </div>
                </div>

                <Separator />

                <div className="pt-2">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleDisconnect}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="wallet-button-wrapper">
                <WalletButton />
              </div>

              <div className="relative flex items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="mx-4 flex-shrink text-gray-400 text-sm">
                  or
                </span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="privateKeyInput">
                  Connect with Private Key
                </Label>
                <Input
                  id="privateKeyInput"
                  type="password"
                  placeholder="Enter your private key"
                  value={privateKeyInput}
                  onChange={(e) => setPrivateKeyInput(e.target.value)}
                />

                {error && <div className="text-sm text-red-500">{error}</div>}

                <Button
                  className="w-full"
                  onClick={connectWithPrivateKey}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Connect with Key
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WalletIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18 8H21C21.5523 8 22 8.44772 22 9V19C22 19.5523 21.5523 20 21 20H3C2.44772 20 2 19.5523 2 19V5C2 4.44772 2.44772 4 3 4H18V8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 14C17.4477 14 17 14.4477 17 15C17 15.5523 17.4477 16 18 16C18.5523 16 19 15.5523 19 15C19 14.4477 18.5523 14 18 14Z"
        fill="currentColor"
      />
    </svg>
  );
}
