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
        <h1 className="text-3xl font-bold">My Tickets</h1>
        <Button variant="outline" asChild>
          <Link href="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Tickets ({activeTickets.length})</TabsTrigger>
          <TabsTrigger value="listed">Listed for Resale ({listedTickets.length})</TabsTrigger>
          <TabsTrigger value="past">Past Events ({pastTickets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {activeTickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No active tickets</h2>
              <p className="text-gray-500 mb-6">You don't have any upcoming event tickets.</p>
              <Button asChild>
                <Link href="/events">Browse Events</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTickets.map((ticket) => (
                <Card key={ticket.id} className="overflow-hidden">
                  <CardHeader className="bg-primary/5 pb-2">
                    <CardTitle className="flex justify-between items-start">
                      <div className="truncate">{ticket.event.name}</div>
                      <div className="text-sm font-normal bg-primary/10 px-2 py-1 rounded">
                        {ticket.ticketType.name}
                      </div>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{formatDate(ticket.event.date)}</p>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Section</span>
                        <span className="font-medium">{ticket.section}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Row</span>
                        <span className="font-medium">{ticket.row}</span>
                      </div>
                      {ticket.seat && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Seat</span>
                          <span className="font-medium">{ticket.seat}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Order #</span>
                        <span className="font-medium">{ticket.orderId}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Purchase Price</span>
                        <span className="font-medium">{formatCurrency(ticket.price)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <Button variant="outline" asChild>
                      <Link href={`/events/${ticket.eventId}`}>View Event</Link>
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Tag className="mr-2 h-4 w-4" />
                          Resell Ticket
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>List Ticket for Resale</DialogTitle>
                          <DialogDescription>
                            Set your price for this ticket. The buyer will also pay applicable fees.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor={`resale-price-${ticket.id}`}>Resale Price</Label>
                            <Input
                              id={`resale-price-${ticket.id}`}
                              type="number"
                              min={1}
                              step="0.01"
                              placeholder="Enter price"
                              defaultValue={ticket.price.toFixed(2)}
                              onChange={(e) => handleResalePriceChange(ticket.id, e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Original Purchase Price:</span>
                              <span>{formatCurrency(ticket.price)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-medium">
                              <span>You'll Receive:</span>
                              <span>{formatCurrency((resalePrice[ticket.id] || ticket.price) * 0.95)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              *5% service fee will be deducted from the resale price
                            </p>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button onClick={() => handleListForResale(ticket)} disabled={isResaleListing[ticket.id]}>
                            {isResaleListing[ticket.id] ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Listing...
                              </>
                            ) : (
                              "List for Resale"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="listed" className="mt-6">
          {listedTickets.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No listed tickets</h2>
              <p className="text-gray-500 mb-6">You haven't listed any tickets for resale.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listedTickets.map((ticket) => (
                <Card key={ticket.id} className="overflow-hidden">
                  <CardHeader className="bg-amber-50 pb-2">
                    <CardTitle className="flex justify-between items-start">
                      <div className="truncate">{ticket.event.name}</div>
                      <div className="text-sm font-normal bg-amber-100 text-amber-800 px-2 py-1 rounded">Listed</div>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{formatDate(ticket.event.date)}</p>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Section</span>
                        <span className="font-medium">{ticket.section}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Row</span>
                        <span className="font-medium">{ticket.row}</span>
                      </div>
                      {ticket.seat && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Seat</span>
                          <span className="font-medium">{ticket.seat}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Original Price</span>
                        <span className="font-medium">{formatCurrency(ticket.price)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>Resale Price</span>
                        <span className="text-green-600">{formatCurrency(ticket.resaleTicket?.price || 0)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <Button variant="outline" asChild>
                      <Link href={`/events/${ticket.eventId}`}>View Event</Link>
                    </Button>
                    <Button variant="destructive" onClick={() => handleCancelResale(ticket)}>
                      Remove Listing
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {pastTickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No past tickets</h2>
              <p className="text-gray-500 mb-6">You don't have any past event tickets.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastTickets.map((ticket) => (
                <Card key={ticket.id} className="overflow-hidden opacity-80">
                  <CardHeader className="bg-gray-100 pb-2">
                    <CardTitle className="flex justify-between items-start">
                      <div className="truncate">{ticket.event.name}</div>
                      <div className="text-sm font-normal bg-gray-200 px-2 py-1 rounded">Past</div>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{formatDate(ticket.event.date)}</p>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Section</span>
                        <span className="font-medium">{ticket.section}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Row</span>
                        <span className="font-medium">{ticket.row}</span>
                      </div>
                      {ticket.seat && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Seat</span>
                          <span className="font-medium">{ticket.seat}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Order #</span>
                        <span className="font-medium">{ticket.orderId}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Purchase Price</span>
                        <span className="font-medium">{formatCurrency(ticket.price)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
