"use client";

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
// import { useCluster } from "../cluster/cluster-data-access";
import { ReactNode, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";

// Dynamically import WalletMultiButton to avoid SSR issues
export const WalletButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export function SolanaProvider({ children }: { children: ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;
  //   const { cluster } = useCluster(); // Custom hook to get cluster config
  //   const endpoint = useMemo(() => cluster.endpoint, [cluster]); // Cluster endpoint (e.g., devnet)
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const onError = useCallback((error: WalletError) => {
    console.error(error); // Handle wallet errors
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} onError={onError} autoConnect={true}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
