"use client"

import { useState, useEffect } from "react"
import { EventCard } from "@/components/event-card"
import { CreateEventForm } from "@/components/create-event-form"
import { Button } from "@/components/ui/button"
import { PlusCircle, ShoppingCart, Loader2, Ticket } from "lucide-react"
import { fetchEvents } from "@/lib/api-client"
import { CartSheet } from "@/components/cart-sheet"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import { generateDummyEvent } from "@/lib/mock-data"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Home() {
  const [events, setEvents] = useState<Event[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const { cart } = useCart()
  const { toast } = useToast()
  const [cartSheetOpen, setCartSheetOpen] = useState(false)
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0)
  const router = useRouter()

  useEffect(() => {
    // Load events from our API
    const fetchEventsData = async () => {
      try {
        setLoading(true)
        const eventsData = await fetchEvents()

        // Make sure eventsData is an array and filter out any invalid events
        const validEvents = Array.isArray(eventsData)
          ? eventsData.filter((event) => event && typeof event === "object" && "id" in event)
          : []

        if (validEvents.length > 0) {
          setEvents(validEvents)
        } else {
          // If no events, create a dummy event
          const dummyEvent = generateDummyEvent()
          setEvents([dummyEvent])
        }
      } catch (error) {
        console.error("Error fetching events:", error)
        // If API fails, create a dummy event
        const dummyEvent = generateDummyEvent()
        setEvents([dummyEvent])
      } finally {
        setLoading(false)
      }
    }

    fetchEventsData()
  }, [])

  const handleCreateEvent = (newEvent: Event) => {
    // Add the new event to the events array
    setEvents((prevEvents) => [...prevEvents, newEvent])
    setShowCreateForm(false)

    // Show success toast
    toast({
      title: "Event created",
      description: `${newEvent.name} has been created successfully.`,
    })

    // Navigate to the new event page
    router.push(`/events/${newEvent.id}`)
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Event Ticketing</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CartSheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
              <Button variant="outline" size="icon" className="relative" onClick={() => setCartSheetOpen(true)}>
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </CartSheet>

            <Button variant="outline" asChild>
              <Link href="/cart">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart ({totalItems})
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link href="/my-tickets">
                <Ticket className="h-4 w-4 mr-2" />
                My Tickets
              </Link>
            </Button>
          </div>

          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center gap-2">
            <PlusCircle size={18} />
            {showCreateForm ? "Cancel" : "Create Event"}
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <div className="mb-8">
          <CreateEventForm onSubmit={handleCreateEvent} />
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500 mb-4">No events found</p>
          <Button onClick={() => setShowCreateForm(true)}>Create Your First Event</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (event && event.id ? <EventCard key={event.id} event={event} /> : null))}
        </div>
      )}
    </main>
  )
}
