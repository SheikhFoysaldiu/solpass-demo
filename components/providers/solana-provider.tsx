"use client";

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { type ReactNode, useCallback, useMemo, useEffect } from "react";
import {
  WalletAdapterNetwork,
  type WalletError,
} from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { PrivateKeyWalletAdapter } from "@/lib/private-key-wallet-adapter";
import { useWalletStore } from "@/store/useWalletStore";

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

export function SolanaProvider({ children }: { children: ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const { privateKey, walletType } = useWalletStore();

  // Initialize wallet adapters
  const wallets = useMemo(() => {
    const walletAdapters = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ];

    // Add our custom Private Key wallet adapter if we have a private key
    // if (privateKey) {
    //   walletAdapters.unshift(new PrivateKeyWalletAdapter());
    // }

    return walletAdapters;
  }, [network, privateKey]);

  const onError = useCallback((error: WalletError) => {
    console.error(error); // Handle wallet errors
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect={true}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
