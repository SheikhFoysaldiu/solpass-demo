"use client";

import type React from "react";

import { useTeamStore } from "@/store/useTeamStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useWalletStore } from "@/store/useWalletStore";

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { team } = useTeamStore();
  const { privateKey } = useWalletStore();
  const router = useRouter();

  useEffect(() => {
    if (!privateKey) {
      router.push("/");
    }
  }, [privateKey, router]);

  if (!team) {
    return null;
  }

  return <>{children}</>;
}
