"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";

// Dynamically import WalletMultiButton to avoid SSR issues
export const WalletButton = dynamic(
  async () => {
    const { WalletMultiButton } = await import(
      "@solana/wallet-adapter-react-ui"
    );

    // Return a styled version of the WalletMultiButton
    return function StyledWalletButton(props: any) {
      // Custom styles for the wallet button
      const style: CSSProperties = {
        backgroundColor: "#4f46e5",
        color: "white",
        borderRadius: "0.5rem",
        padding: "0.75rem 1.5rem",
        fontSize: "0.875rem",
        fontWeight: "500",
        border: "none",
        cursor: "pointer",
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        boxShadow:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      };

      return <WalletMultiButton {...props} style={style} />;
    };
  },
  { ssr: false }
);
