import { AnchorProvider, Program, setProvider } from "@coral-xyz/anchor";
import {
  AnchorWallet,
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import { useMemo } from "react";

import { programId } from "@/lib/contants";
import { IDLType } from "@/lib/idl";
import idl from "@/lib/idl.json";
import { useWalletStore } from "@/store/useWalletStore";
import { Keypair, Transaction, VersionedTransaction } from "@solana/web3.js";

// Hook to create an Anchor wallet from private key
export function usePrivateKeyAnchorWallet() {
  const { connection } = useConnection();
  const { privateKey, getKeypair } = useWalletStore();

  return useMemo(() => {
    if (!privateKey) return null;

    const keypair = getKeypair();
    if (!keypair) return null;

    const anchorWallet = {
      publicKey: keypair.publicKey,
      signTransaction: async (
        transaction: Transaction | VersionedTransaction
      ) => {
        const keypair = useWalletStore.getState().getKeypair();
        if (!keypair) throw new Error("Wallet not connected");

        if (transaction instanceof Transaction) {
          transaction.partialSign(keypair);
        } else if ("sign" in transaction) {
          // This handles VersionedTransaction which has a different signing method
          transaction.sign([keypair]);
        }

        return transaction;
      },
      signAllTransactions: async (
        transactions: (Transaction | VersionedTransaction)[]
      ) => {
        return Promise.all(
          transactions.map((transaction) => {
            const keypair = useWalletStore.getState().getKeypair();
            if (!keypair) throw new Error("Wallet not connected");

            if (transaction instanceof Transaction) {
              transaction.partialSign(keypair);
            } else if ("sign" in transaction) {
              // This handles VersionedTransaction which has a different signing method
              transaction.sign([keypair]);
            }
            return transaction;
          })
        );
      },
    };

    return { wallet: anchorWallet as AnchorWallet, connection };
  }, [connection, privateKey, getKeypair]);
}

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { privateKey } = useWalletStore();
  const privateKeyWallet = usePrivateKeyAnchorWallet();

  const program = useMemo(() => {
    if (wallet) {
      // Use connected wallet
      const provider = new AnchorProvider(connection, wallet, {});
      setProvider(provider);
      // @ts-ignore
      return new Program(idl as IDLType, programId, provider);
    } else if (privateKey && privateKeyWallet) {
      // Use private key wallet
      const provider = new AnchorProvider(
        privateKeyWallet.connection,
        privateKeyWallet.wallet,
        {}
      );
      setProvider(provider);
      // @ts-ignore
      const programs = new Program(idl as IDLType, programId, provider);
      //   console.log("program", programs);
      return programs;
    }

    return null;
  }, [connection, wallet, privateKey, privateKeyWallet]);

  return program;
}