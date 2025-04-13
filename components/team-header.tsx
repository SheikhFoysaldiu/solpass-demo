"use client"

import { useTeamStore } from "@/store/useTeamStore"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function TeamHeader() {
  const { team, clearTeam } = useTeamStore()
  const router = useRouter()

  if (!team) return null

  const handleLogout = () => {
    clearTeam()
    toast.success("Logged out successfully")
    router.push("/")
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 py-2 px-4 flex justify-between items-center">
      <div>
        <p className="text-sm font-medium">
          Team: <span className="text-blue-600 dark:text-blue-400">{team.name}</span>
        </p>
        <p className="text-xs text-gray-500 font-mono truncate max-w-[200px]">{team.publicKey}</p>
      </div>
      <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-500">
        <LogOut className="mr-2 h-3 w-3" />
        Logout
      </Button>
    </div>
  )
}
