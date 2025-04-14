"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Key, Plus } from "lucide-react";
import { toast } from "sonner";
import { useTeamStore } from "@/store/useTeamStore";
import { createTeam, getTeamByPrivateKey } from "@/lib/api-client";
import { useWalletStore } from "@/store/useWalletStore";

export default function LoginPage() {
  const router = useRouter();
  const { team, setTeam } = useTeamStore();
  const [teamPrivateKey, setTeamPrivateKey] = useState("");
  const [teamName, setTeamName] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const { setPrivateKey: setWalletPrivateKey, privateKey: Pvkey } =
    useWalletStore();
  // If team is already logged in, redirect to wallet page
  useEffect(() => {
    if (team) {
      router.push("/wallet");
    }
  }, [team, router]);

  const handleLogin = async () => {
    if (!teamPrivateKey) {
      setError("Please enter your team private key");
      return;
    }

    setIsLoggingIn(true);
    setError("");

    try {
      // Fetch team from the database
      const teamData = await getTeamByPrivateKey(teamPrivateKey);

      // Store the team in state
      setTeam({
        id: teamData.id,
        publicKey: teamData.publicKey,
        name: teamData.name,
      });
      setWalletPrivateKey(teamData.secretKey); // Store private key temporarily
      toast.success("Login successful", {
        description: "Welcome back to SolPass!",
      });

      // Redirect to wallet page
      router.push("/wallet");
    } catch (err) {
      console.error("Login error:", err);
      setError(
        "Team not found or invalid private key. Please check and try again."
      );
      toast.error("Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName) {
      setError("Please enter a team name");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      // Create team in the database
      const newTeam = await createTeam(teamName);
      setWalletPrivateKey(newTeam.privateKey); // Store private key temporarily
      // Store the team in state
      setTeam({
        id: newTeam.id,
        publicKey: newTeam.publicKey,
        name: newTeam.name,
        privateKey: newTeam.privateKey, // Store private key temporarily
      });

      toast.success("Team created successfully", {
        description: "Your team has been registered with SolPass!",
      });

      // Redirect to wallet page
      router.push("/wallet");
    } catch (err) {
      console.error("Failed to create team:", err);
      setError("Failed to create team");
      toast.error("Team creation failed");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-md w-full space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-600">
            SolPass
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Team Portal - Blockchain Ticketing Platform
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Create Team</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Team Login</CardTitle>
                <CardDescription>
                  Enter your team private key to access the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teamPrivateKey">Team Private Key</Label>
                  <Input
                    id="teamPrivateKey"
                    placeholder="Enter your team private key"
                    value={teamPrivateKey}
                    onChange={(e) => setTeamPrivateKey(e.target.value)}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Login
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Signup Tab */}
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create New Team</CardTitle>
                <CardDescription>
                  Register your team on the SolPass platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    placeholder="Enter your team name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={handleCreateTeam}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating team...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Team
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-slate-500">
          SolPass • Blockchain Ticketing Platform
        </p>
      </div>
    </main>
  );
}
