import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { RoyaltyFormValues } from "@/types"

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export const createRoyaltiesString = (royalties: RoyaltyFormValues): string => {
  return `${royalties.ticketmaster},${royalties.team},${royalties.solpass}`
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
