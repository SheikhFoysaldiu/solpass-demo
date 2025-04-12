import { RoyaltyFormValues } from "@/components/event-card";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Add the formatCurrency function if it doesn't exist
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Add the missing formatDate function
export function formatDate(dateString: string): string {
  if (!dateString) return "TBD";

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) return "Invalid Date";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
}

// Function to create a royalties string
export const createRoyaltiesString = (royalties: RoyaltyFormValues): string => {
  return `Ticketmaster: ${royalties.ticketmaster}%, Team: ${royalties.team}%, Solpass: ${royalties.solpass}%`;
};

// Function to extract royalties values from a string
export const extractRoyaltiesFromString = (
  royaltiesString: string
): RoyaltyFormValues => {
  const regex = /Ticketmaster: (\d+)%.*Team: (\d+)%.*Solpass: (\d+)%/;
  const match = royaltiesString.match(regex);

  if (!match) {
    throw new Error("Invalid royalties string format");
  }

  return {
    ticketmaster: parseInt(match[1], 10),
    team: parseInt(match[2], 10),
    solpass: parseInt(match[3], 10),
  };
};
