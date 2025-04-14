import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RoyaltyFormValues } from "@/types";

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const createRoyaltiesString = (royalties: RoyaltyFormValues): string => {
  return `${royalties.ticketmaster},${royalties.team},${royalties.solpass}`;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SOL_TO_USD_RATE = 134.27;
export const LAMPORTS_PER_SOL = 1_000_000_000; // 1 SOL = 10^9 lamports
export const solToUsd = (solAmount: number): number => {
  return solAmount * SOL_TO_USD_RATE;
};

export const usdToSol = (usdAmount: number): number => {
  return usdAmount / SOL_TO_USD_RATE;
};

// SOL <-> Lamport conversions
export const solToLamports = (solAmount: number): number => {
  return Math.round(solAmount * LAMPORTS_PER_SOL);
};

export const lamportsToSol = (lamports: number): number => {
  return lamports / LAMPORTS_PER_SOL;
};

// USD <-> Lamport conversions
export const usdToLamports = (usdAmount: number): number => {
  const solAmount = usdToSol(usdAmount);
  return solToLamports(solAmount);
};

export const lamportsToUsd = (lamports: number): number => {
  const solAmount = lamportsToSol(lamports);
  return solToUsd(solAmount);
};
