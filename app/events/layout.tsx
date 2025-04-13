"use client"

import type React from "react"

import { useTeamStore } from "@/store/useTeamStore"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { team } = useTeamStore()
  const router = useRouter()

  useEffect(() => {
    if (!team) {
      router.push("/")
    }
  }, [team, router])

  if (!team) {
    return null
  }

  return <>{children}</>
}
