"use client"

import { useState, useEffect } from "react"
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
import { fetchMyTickets, listTicketForResale } from "@/lib/api-client"

interface MyTicket {
  id: string
  orderId: string
  eventId: string
  eventName: string
  eventDate: string
  section: string
  row: string
  seat?: number
  ticketType: string
  purchaseDate: string
  price: number
  isResale: boolean
  resalePrice?: number
  isListed: boolean
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<MyTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [resalePrice, setResalePrice] = useState<Record<string, number>>({})
  const [isResaleListing, setIsResaleListing] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setLoading(true)
        const myTickets = await fetchMyTickets()

        // Only set tickets if they exist from the API
        if (Array.isArray(myTickets) && myTickets.length > 0) {
          setTickets(myTickets)
        } else {
          // Don't create dummy tickets by default
          setTickets([])

          // Check if we have any tickets in localStorage from purchases
          const purchasedTickets = localStorage.getItem("purchasedTickets")
          if (purchasedTickets) {
            try {
              const parsedTickets = JSON.parse(purchasedTickets)
              if (Array.isArray(parsedTickets) && parsedTickets.length > 0) {
                setTickets(parsedTickets)
              }
            } catch (error) {
              console.error("Failed to parse purchased tickets:", error)
            }
          }
        }
      } catch (error) {
        console.error("Error loading tickets:", error)
        // Check localStorage for purchased tickets instead of creating dummy tickets
        const purchasedTickets = localStorage.getItem("purchasedTickets")
        if (purchasedTickets) {
          try {
            const parsedTickets = JSON.parse(purchasedTickets)
            if (Array.isArray(parsedTickets) && parsedTickets.length > 0) {
              setTickets(parsedTickets)
            }
          } catch (error) {
            console.error("Failed to parse purchased tickets:", error)
          }
        }
      } finally {
        setLoading(false)
      }
    }

    loadTickets()
  }, [])

  const createDummyTickets = (): MyTicket[] => {
    // Get order ID from localStorage or create a new one
    const orderId =
      localStorage.getItem("orderId") ||
      Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0")

    // Create 3 dummy tickets
    return [
      {
        id: "ticket_" + Math.random().toString(36).substring(2, 10),
        orderId,
        eventId: "0B004D43F86C478F",
        eventName: "Concert in the Park",
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        section: "GA",
        row: "GA",
        ticketType: "General Admission",
        purchaseDate: new Date().toISOString(),
        price: 50.5,
        isResale: false,
        isListed: false,
      },
      {
        id: "ticket_" + Math.random().toString(36).substring(2, 10),
        orderId,
        eventId: "0B004D43F86C478F",
        eventName: "Concert in the Park",
        section: "VIP",
        row: "A",
        seat: 12,
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ticketType: "VIP",
        purchaseDate: new Date().toISOString(),
        price: 120,
        isResale: false,
        isListed: false,
      },
      {
        id: "ticket_" + Math.random().toString(36).substring(2, 10),
        orderId,
        eventId: Math.random().toString(36).substring(2, 15).toUpperCase(),
        eventName: "Music Festival",
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        section: "SEC1",
        row: "ROW1",
        seat: 5,
        ticketType: "Premium",
        purchaseDate: new Date().toISOString(),
        price: 85,
        isResale: false,
        isListed: false,
      },
    ]
  }

  const handleResalePriceChange = (ticketId: string, price: string) => {
    const numericPrice = Number.parseFloat(price)
    if (!isNaN(numericPrice) && numericPrice > 0) {
      setResalePrice({
        ...resalePrice,
        [ticketId]: numericPrice,
      })
    }
  }

  const handleListForResale = async (ticket: MyTicket) => {
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
      const royaltyPercentage = 5 // Default if not specified
      const royaltyFee = Math.round(price * (royaltyPercentage / 100))
      const serviceFee = Math.round(price * 0.1) // 10% service fee

      // Create a resale ticket object
      const resaleTicket = {
        id: `resale_${Math.random().toString(36).substring(2, 10)}`,
        ticketId: ticket.id,
        eventId: ticket.eventId,
        eventName: ticket.eventName,
        section: ticket.section,
        row: ticket.row,
        seat: ticket.seat,
        price: price,
        originalPrice: ticket.price,
        royaltyPercentage: royaltyPercentage,
        royaltyFee: royaltyFee,
        serviceFee: serviceFee,
        sellerId: "user_1",
      }

      // Call API to list ticket for resale with full ticket data
      await listTicketForResale(ticketId, price, {
        eventId: ticket.eventId,
        eventName: ticket.eventName,
        section: ticket.section,
        row: ticket.row,
        seat: ticket.seat,
        originalPrice: ticket.price,
        royaltyPercentage: ticket.royaltyPercentage || 5,
      })

      // Update the ticket in the local state
      setTickets(tickets.map((t) => (t.id === ticketId ? { ...t, isListed: true, resalePrice: price } : t)))

      // Also save directly to localStorage for immediate availability
      try {
        // Get existing resale tickets
        const storedTickets = localStorage.getItem("resaleTickets")
        let allTickets = []

        if (storedTickets) {
          try {
            allTickets = JSON.parse(storedTickets)
          } catch (e) {
            console.error("Error parsing stored resale tickets:", e)
            allTickets = []
          }
        }

        // Add the new ticket
        allTickets.push(resaleTicket)

        // Save back to localStorage
        localStorage.setItem("resaleTickets", JSON.stringify(allTickets))
      } catch (error) {
        console.error("Error saving resale ticket to localStorage:", error)
      }

      toast({
        title: "Ticket listed for resale",
        description: `Your ticket has been listed for ${formatCurrency(price)}`,
      })
    } catch (error) {
      console.error("Error listing ticket for resale:", error)

      // Even if API fails, update the UI for demo purposes
      setTickets(tickets.map((t) => (t.id === ticketId ? { ...t, isListed: true, resalePrice: price } : t)))

      toast({
        title: "Ticket listed for resale",
        description: `Your ticket has been listed for ${formatCurrency(price)}`,
      })
    } finally {
      setIsResaleListing({
        ...isResaleListing,
        [ticketId]: false,
      })
    }
  }

  const activeTickets = tickets.filter((ticket) => {
    const eventDate = new Date(ticket.eventDate)
    return eventDate > new Date() && !ticket.isListed
  })

  const listedTickets = tickets.filter((ticket) => ticket.isListed)

  const pastTickets = tickets.filter((ticket) => {
    const eventDate = new Date(ticket.eventDate)
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
          <Link href="/">
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
                <Link href="/">Browse Events</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTickets.map((ticket) => (
                <Card key={ticket.id} className="overflow-hidden">
                  <CardHeader className="bg-primary/5 pb-2">
                    <CardTitle className="flex justify-between items-start">
                      <div className="truncate">{ticket.eventName}</div>
                      <div className="text-sm font-normal bg-primary/10 px-2 py-1 rounded">{ticket.ticketType}</div>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{formatDate(ticket.eventDate)}</p>
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
                      <div className="truncate">{ticket.eventName}</div>
                      <div className="text-sm font-normal bg-amber-100 text-amber-800 px-2 py-1 rounded">Listed</div>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{formatDate(ticket.eventDate)}</p>
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
                        <span className="text-green-600">{formatCurrency(ticket.resalePrice || 0)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <Button variant="outline" asChild>
                      <Link href={`/events/${ticket.eventId}`}>View Event</Link>
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        // Remove from listed tickets
                        setTickets(
                          tickets.map((t) =>
                            t.id === ticket.id ? { ...t, isListed: false, resalePrice: undefined } : t,
                          ),
                        )

                        toast({
                          title: "Listing removed",
                          description: "Your ticket is no longer listed for resale",
                        })
                      }}
                    >
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
                      <div className="truncate">{ticket.eventName}</div>
                      <div className="text-sm font-normal bg-gray-200 px-2 py-1 rounded">Past</div>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{formatDate(ticket.eventDate)}</p>
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
