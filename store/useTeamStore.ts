import { create } from "zustand"
import { persist } from "zustand/middleware"

interface Team {
  id: string
  publicKey: string
  name: string
  privateKey?: string
}

type TeamState = {
  team: Team | null
  setTeam: (team: Team) => void
  clearTeam: () => void
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set) => ({
      team: null,

      setTeam: (team: Team) => {
        set({ team })
      },

      clearTeam: () => {
        set({ team: null })
      },
    }),
    {
      name: "solpass-team-storage",
    },
  ),
)
