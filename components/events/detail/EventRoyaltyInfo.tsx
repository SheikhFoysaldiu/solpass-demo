import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "@/lib/hooks/useProgram";

interface RoyaltyInfo {
  ticketmaster: number;
  team: number;
  solpass: number;
}

interface EventRoyaltyInfoProps {
  chainEventKey?: string | null;
}

export function useEventRoyaltyInfo(chainEventKey?: string | null) {
  const program = useProgram();

  const fetchEventDetails = async () => {
    if (!program || !chainEventKey) return null;

    try {
      // Convert chainEventKey to PublicKey
      const eventPublicKey = new PublicKey(chainEventKey);

      // Fetch the event account data
      const eventAccount = await program.account.eventAccount.fetch(
        eventPublicKey
      );

      const royalies = eventAccount?.royalty;

      // Parse the royalty string (format: "ticketmaster,team,solpass")
      if (royalies) {
        const r = royalies as string;

        const royaltyParts = r.split(",");

        if (royaltyParts.length >= 3) {
          return {
            ticketmaster: parseFloat(royaltyParts[0]) || 10,
            team: parseFloat(royaltyParts[1]) || 5,
            solpass: parseFloat(royaltyParts[2]) || 5,
          };
        }
      }

      // Return default values if parsing fails
      return {
        ticketmaster: 10,
        team: 5,
        solpass: 5,
      };
    } catch (error) {
      console.error("Error fetching event royalty data:", error);
      // Return default values on error
      return {
        ticketmaster: 10,
        team: 5,
        solpass: 5,
      };
    }
  };

  return useQuery({
    queryKey: ["eventRoyalty", chainEventKey],
    queryFn: fetchEventDetails,
    enabled: !!program && !!chainEventKey,
  });
}

export function EventRoyaltyInfo({ chainEventKey }: EventRoyaltyInfoProps) {
  // This component could display royalty information in the UI if needed
  // Currently, this is mainly a hook that can be used in the parent component
  // This helps separate the blockchain logic from the UI
  return null;
}
