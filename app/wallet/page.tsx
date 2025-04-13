"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Keypair } from "@solana/web3.js"
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, type PublicKey } from "@solana/web3.js"
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Key, CreditCard, ArrowRight, LogOut } from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { useWalletStore } from "@/store/useWalletStore"
import { useTeamStore } from "@/store/useTeamStore"

export default function WalletPage() {
  const router = useRouter()
  const { setPrivateKey: setWalletPrivateKey, privateKey: Pvkey } = useWalletStore()
  const { team, clearTeam } = useTeamStore()
  const [name, setName] = useState("")
  const [privateKey, setPrivateKey] = useState("")
  const [generatedKeypair, setGeneratedKeypair] = useState<Keypair | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isFunding, setIsFunding] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [balance, setBalance] = useState(0)
  const [error, setError] = useState("")

  // If no team is logged in, redirect to login page
  useEffect(() => {
    if (!team) {
      router.push("/")
    }
  }, [team, router])

  // If wallet is already connected, redirect to events page
  useEffect(() => {
    if (Pvkey) {
      router.push("/events")
    }
  }, [Pvkey, router])

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed")

  // Generate new keypair
  const generateKeypair = () => {
    if (!name) {
      setError("Please enter a name for your wallet")
      return
    }

    setIsGenerating(true)
    setError("")

    try {
      // Generate a new keypair
      const newKeypair = Keypair.generate()
      setGeneratedKeypair(newKeypair)

      // Set the private key for display
      const privateKeyBase58 = bs58.encode(newKeypair.secretKey)
      setPrivateKey(privateKeyBase58)

      toast.success("New wallet generated successfully", {
        description: "Remember to save your private key securely!",
      })

      // Get initial balance
      checkBalance(newKeypair.publicKey)
    } catch (err) {
      console.error("Failed to generate keypair:", err)
      setError("Failed to generate keypair")
      toast.error("Failed to generate keypair")
    } finally {
      setIsGenerating(false)
    }
  }

  // Request airdrop
  const requestAirdrop = async () => {
    if (!generatedKeypair) {
      setError("No keypair available. Generate one first.")
      return
    }

    setIsFunding(true)
    setError("")

    try {
      const signature = await connection.requestAirdrop(generatedKeypair.publicKey, LAMPORTS_PER_SOL)

      // Wait for confirmation
      await connection.confirmTransaction(signature)
      toast.success("Airdrop successful", {
        description: "1 SOL has been added to your wallet",
      })

      // Update balance after airdrop
      await checkBalance(generatedKeypair.publicKey)
    } catch (err) {
      console.error("Failed to request airdrop:", err)
      setError("Failed to request airdrop. Please try again later.")
      toast.error("Airdrop failed")
    } finally {
      setIsFunding(false)
    }
  }

  // Check account balance
  const checkBalance = async (publicKey: PublicKey) => {
    try {
      const balance = await connection.getBalance(publicKey)
      setBalance(balance / LAMPORTS_PER_SOL)
    } catch (err) {
      console.error("Failed to get balance:", err)
    }
  }

  // Connect with private key
  const connectWithPrivateKey = () => {
    if (!privateKey) {
      setError("Please enter a private key")
      return
    }

    setIsConnecting(true)
    setError("")

    try {
      // Try to convert the private key to Uint8Array to validate it
      const secretKey = bs58.decode(privateKey)
      const keypair = Keypair.fromSecretKey(secretKey)

      // Store in Zustand for persistent access across the app
      setWalletPrivateKey(privateKey)

      toast.success("Connected successfully", {
        description: "Redirecting to events page...",
      })

      // Redirect to events page
      setTimeout(() => {
        router.push("/events")
      }, 1500)
    } catch (err) {
      console.error("Invalid private key:", err)
      setError("Invalid private key format. Please check and try again.")
      toast.error("Invalid private key")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleLogout = () => {
    clearTeam()
    toast.success("Logged out successfully")
    router.push("/")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-md w-full space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-600">
            SolPass
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Your gateway to blockchain ticketing</p>

          {team && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <p className="text-sm font-medium">
                Team: <span className="text-blue-600 dark:text-blue-400">{team.name}</span>
              </p>
            </div>
          )}
        </div>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="generate">Generate New</TabsTrigger>
            <TabsTrigger value="import">Import Existing</TabsTrigger>
          </TabsList>

          {/* Generate New Wallet Tab */}
          <TabsContent value="generate">
            <Card>
              <CardHeader>
                <CardTitle>Create New Wallet</CardTitle>
                <CardDescription>Generate a new wallet for testing on Solana Devnet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {generatedKeypair && (
                  <>
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Public Key</span>
                      </div>
                      <p className="text-xs break-all font-mono p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                        {generatedKeypair.publicKey.toString()}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Private Key (keep it safe!)</span>
                      </div>
                      <p className="text-xs break-all font-mono p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                        {privateKey}
                      </p>
                    </div>

                    <Alert>
                      <CreditCard className="h-4 w-4" />
                      <AlertTitle>Current Balance: {balance} SOL</AlertTitle>
                      <AlertDescription>This is a devnet wallet for testing purposes only</AlertDescription>
                    </Alert>
                  </>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                {!generatedKeypair ? (
                  <Button className="w-full" onClick={generateKeypair} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Generate Keypair
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <div className="flex gap-3 w-full">
                      <Button className="flex-1" variant="outline" onClick={requestAirdrop} disabled={isFunding}>
                        {isFunding ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Funding...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Request Airdrop
                          </>
                        )}
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          // Store the private key in Zustand before navigating
                          setWalletPrivateKey(privateKey)
                          router.push("/events")
                        }}
                      >
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Continue
                      </Button>
                    </div>
                  </>
                )}
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Import Existing Wallet Tab */}
          <TabsContent value="import">
            <Card>
              <CardHeader>
                <CardTitle>Import Existing Wallet</CardTitle>
                <CardDescription>Enter your private key to access your wallet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="privateKey">Private Key</Label>
                  <Input
                    id="privateKey"
                    type="password"
                    placeholder="Enter your private key"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={connectWithPrivateKey} disabled={isConnecting}>
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Connect Wallet
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLogout} className="text-red-500">
            <LogOut className="mr-2 h-4 w-4" />
            Team Logout
          </Button>
        </div>

        <p className="text-center text-sm text-slate-500">SolPass • Blockchain Ticketing Platform</p>
      </div>
    </main>
  )
}
