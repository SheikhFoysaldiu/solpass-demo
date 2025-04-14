"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Ticket, ArrowLeft, Tag, Loader2 } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { fetchMyTickets, listTicketForResale, cancelResaleListing } from "@/lib/api-client"
import { useTeamStore } from "@/store/useTeamStore"
import ChainTickets from "@/components/tickets/chain-tickets"

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [resalePrice, setResalePrice] = useState<Record<string, number>>({})
  const [isResaleListing, setIsResaleListing] = useState<Record<string, boolean>>({})
  const { toast } = useToast()
  const { team } = useTeamStore()
  const router = useRouter()

  useEffect(() => {
    if (!team?.id) {
      router.push("/")
      return
    }

    const loadTickets = async () => {
      try {
        setLoading(true)
        const myTickets = await fetchMyTickets(team.id)

        if (Array.isArray(myTickets) && myTickets.length > 0) {
          setTickets(myTickets)
        } else {
          setTickets([])
        }
      } catch (error) {
        console.error("Error loading tickets:", error)
        setTickets([])
      } finally {
        setLoading(false)
      }
    }

    loadTickets()
  }, [team?.id, router])

  const handleResalePriceChange = (ticketId: string, price: string) => {
    const numericPrice = Number.parseFloat(price)
    if (!isNaN(numericPrice) && numericPrice > 0) {
      setResalePrice({
        ...resalePrice,
        [ticketId]: numericPrice,
      })
    }
  }

  const handleListForResale = async (ticket: any) => {
    const ticketId = ticket.id
    const price = resalePrice[ticketId]

    if (!price || price <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid resale price",
        variant: "destructive",
      })
      return
    }

    setIsResaleListing({
      ...isResaleListing,
      [ticketId]: true,
    })

    try {
      // Calculate fees
      const royaltyPercentage = ticket.event.royaltyPercentage || 5
      const royaltyFee = Math.round(price * (royaltyPercentage / 100))
      const serviceFee = Math.round(price * 0.1) // 10% service fee

      // Create a resale ticket object
      const resaleData = {
        ticketId,
        price,
        originalPrice: ticket.price,
        royaltyPercentage,
        royaltyFee,
        serviceFee,
      }

      // Call API to list ticket for resale
      const result = await listTicketForResale(resaleData)

      // Update the ticket in the local state
      setTickets(tickets.map((t) => (t.id === ticketId ? { ...t, isListed: true, resaleTicket: result } : t)))

      toast({
        title: "Ticket listed for resale",
        description: `Your ticket has been listed for ${formatCurrency(price)}`,
      })
    } catch (error) {
      console.error("Error listing ticket for resale:", error)
      toast({
        title: "Error",
        description: "Failed to list ticket for resale. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsResaleListing({
        ...isResaleListing,
        [ticketId]: false,
      })
    }
  }

  const handleCancelResale = async (ticket: any) => {
    if (!ticket.resaleTicket?.id) {
      toast({
        title: "Error",
        description: "No resale listing found for this ticket",
        variant: "destructive",
      })
      return
    }

    try {
      await cancelResaleListing(ticket.resaleTicket.id)

      // Update the ticket in the local state
      setTickets(tickets.map((t) => (t.id === ticket.id ? { ...t, isListed: false, resaleTicket: null } : t)))

      toast({
        title: "Listing removed",
        description: "Your ticket is no longer listed for resale",
      })
    } catch (error) {
      console.error("Error canceling resale listing:", error)
      toast({
        title: "Error",
        description: "Failed to cancel resale listing. Please try again.",
        variant: "destructive",
      })
    }
  }

  const activeTickets = tickets.filter((ticket) => {
    const eventDate = new Date(ticket.event.date)
    return eventDate > new Date() && !ticket.isListed
  })

  const listedTickets = tickets.filter((ticket) => ticket.isListed)

  const pastTickets = tickets.filter((ticket) => {
    const eventDate = new Date(ticket.event.date)
    return eventDate <= new Date() && !ticket.isListed
  })

  if (loading) {
    return (
      <div className="container mx-auto py-16 px-4 flex justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p>Loading your tickets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">

        <Button variant="outline" asChild>
          <Link href="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>
      </div>

      <ChainTickets />
    </div>
  )
}
