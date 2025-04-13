import {
  BaseMessageSignerWalletAdapter,
  type SupportedTransactionVersions,
  type WalletName,
  WalletReadyState,
  scopePollingDetectionStrategy,
} from "@solana/wallet-adapter-base"
import { type PublicKey, Transaction, type VersionedTransaction } from "@solana/web3.js"
import { useWalletStore } from "../store/useWalletStore"

export const PrivateKeyWalletName = "Private Key" as WalletName<"PrivateKeyWalletName">

export class PrivateKeyWalletAdapter extends BaseMessageSignerWalletAdapter {
  supportedTransactionVersions?: SupportedTransactionVersions
  name = PrivateKeyWalletName
  url = "https://solpass.io"
  icon =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTggOEgyMUMyMS41NTIzIDggMjIgOC40NDc3MiAyMiA5VjE5QzIyIDE5LjU1MjMgMjEuNTUyMyAyMCAyMSAyMEgzQzIuNDQ3NzIgMjAgMiAxOS41NTIzIDIgMTlWNUMyIDQuNDQ3NzIgMi40NDc3MiA0IDMgNEgxOFY4WiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48L3BhdGg+PHBhdGggZD0iTTE4IDE0QzE3LjQ0NzcgMTQgMTcgMTQuNDQ3NyAxNyAxNUMxNyAxNS41NTIzIDE3LjQ0NzcgMTYgMTggMTZDMTguNTUyMyAxNiAxOSAxNS41NTIzIDE5IDE1QzE5IDE0LjQ0NzcgMTguNTUyMyAxNCAxOCAxNFoiIGZpbGw9ImN1cnJlbnRDb2xvciI+PC9wYXRoPjwvc3ZnPg=="

  private _publicKey: PublicKey | null = null
  private _connecting = false
  private _readyState = WalletReadyState.Installed

  constructor() {
    super()
    scopePollingDetectionStrategy(() => {
      return useWalletStore.getState().privateKey !== null
    })
  }

  get publicKey(): PublicKey | null {
    if (this._publicKey) return this._publicKey

    const keypair = useWalletStore.getState().getKeypair()
    if (keypair) {
      this._publicKey = keypair.publicKey
      return this._publicKey
    }

    return null
  }

  get connecting(): boolean {
    return this._connecting
  }

  get connected(): boolean {
    return !!this.publicKey
  }

  get readyState(): WalletReadyState {
    return useWalletStore.getState().privateKey ? WalletReadyState.Installed : WalletReadyState.NotDetected
  }

  async connect(): Promise<void> {
    try {
      if (this.connected || this.connecting) return
      this._connecting = true

      if (!useWalletStore.getState().privateKey) {
        throw new Error("No private key found")
      }

      // Make sure we update the public key
      const keypair = useWalletStore.getState().getKeypair()
      if (!keypair) {
        throw new Error("Invalid private key")
      }
      this._publicKey = keypair.publicKey

      this.emit("connect", this._publicKey)
    } catch (error: any) {
      this.emit("error", error)
      throw error
    } finally {
      this._connecting = false
    }
  }

  async disconnect(): Promise<void> {
    this._publicKey = null
    this.emit("disconnect")
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
    try {
      const keypair = useWalletStore.getState().getKeypair()
      if (!keypair) throw new Error("Wallet not connected")

      if (transaction instanceof Transaction) {
        transaction.partialSign(keypair)
      } else if ("sign" in transaction) {
        // This handles VersionedTransaction which has a different signing method
        transaction.sign([keypair])
      }

      return transaction
    } catch (error: any) {
      this.emit("error", error)
      throw error
    }
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
    return Promise.all(transactions.map((transaction) => this.signTransaction(transaction)))
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    try {
      const keypair = useWalletStore.getState().getKeypair()
      if (!keypair) throw new Error("Wallet not connected")

      // Sign the message with the keypair
      return keypair.secretKey.subarray(0, 64)
    } catch (error: any) {
      this.emit("error", error)
      throw error
    }
  }
}
