import { create } from "zustand"
import { persist } from "zustand/middleware"
import { Keypair } from "@solana/web3.js"
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes"

type WalletState = {
  privateKey: string | null
  getKeypair: () => Keypair | null
  setPrivateKey: (privateKey: string) => void
  clearWallet: () => void
  walletType: "privateKey" | "walletAdapter" | null
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      privateKey: null,
      walletType: null,

      getKeypair: () => {
        const { privateKey } = get()
        if (!privateKey) return null

        try {
          const secretKey = bs58.decode(privateKey)
          return Keypair.fromSecretKey(secretKey)
        } catch (error) {
          console.error("Failed to create keypair from private key:", error)
          return null
        }
      },

      setPrivateKey: (privateKey: string) => {
        set({ privateKey, walletType: "privateKey" })
      },

      clearWallet: () => {
        set({ privateKey: null, walletType: null })
      },
    }),
    {
      name: "solpass-wallet-storage",
      // Only store the privateKey in localStorage
      partialize: (state) => ({
        privateKey: state.privateKey,
        walletType: state.walletType,
      }),
    },
  ),
)
