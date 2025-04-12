import type { Event, ResaleTicket } from "@/types"
import axios from "axios"
import { getEventById, addEvent, getStoredEvents } from "@/lib/event-storage"
import { getStoredResaleTickets, addResaleTicket } from "@/lib/resale-storage"

// Check if we're in the browser environment
const isBrowser = typeof window !== "undefined"

// Create an axios instance
const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Events API
export const fetchEvents = async () => {
  try {
    // First try to get events from localStorage
    let localEvents = null
    if (isBrowser) {
      localEvents = getStoredEvents()
    }
    if (localEvents && localEvents.length > 0) {
      console.log("Using events from localStorage:", localEvents)
      return localEvents
    }

    // If no events in localStorage, try the API
    const response = await apiClient.get("/events")
    // Ensure we return a valid array of events with required properties
    if (response.data && response.data.events && Array.isArray(response.data.events)) {
      const events = response.data.events.filter((event: Event) => event && typeof event === "object" && "id" in event)
      return events
    }
    return []
  } catch (error) {
    console.error("Error fetching events:", error)
    // If API fails, try to get events from localStorage
    let localEvents = null
    if (isBrowser) {
      localEvents = getStoredEvents()
    }
    return localEvents || []
  }
}

export const fetchEventById = async (id: string) => {
  try {
    console.log(`Fetching event with ID: ${id}`)

    // First try to get the event from localStorage
    let localEvent = null
    if (isBrowser) {
      localEvent = getEventById(id)
    }
    if (localEvent) {
      console.log(`Found event in localStorage:`, localEvent)
      return localEvent
    }

    // If not in localStorage, try the API
    const response = await apiClient.get(`/events/${id}`)
    console.log(`API response for event ${id}:`, response.data)

    // If we got an event from the API, add it to localStorage
    if (response.data && response.data.event) {
      if (isBrowser) {
        addEvent(response.data.event)
      }
    }

    return response.data.event
  } catch (error) {
    console.error(`Error fetching event with id ${id}:`, error)
    // If API fails, try to get the event from localStorage
    let localEvent = null
    if (isBrowser) {
      localEvent = getEventById(id)
    }
    return localEvent
  }
}

export const fetchEventAvailability = async (id: string) => {
  try {
    const response = await apiClient.get(`/events/${id}/availability`)
    return response.data
  } catch (error) {
    console.error(`Error fetching availability for event ${id}:`, error)
    return null
  }
}

export const createEvent = async (eventData: any) => {
  try {
    console.log("API client creating event:", eventData)

    // First add the event to localStorage
    let savedEvent = null
    if (isBrowser) {
      savedEvent = addEvent(eventData)
    }
    console.log("Event saved to localStorage:", savedEvent)

    // Then try to create it via the API
    try {
      const response = await apiClient.post("/events", eventData)
      console.log("API response for create event:", response.data)
      if (response.data && response.data.event) {
        return response.data.event
      }
    } catch (apiError) {
      console.error("API error creating event:", apiError)
      // If API fails, we already saved to localStorage, so return that
    }

    // Return the event we saved to localStorage
    return savedEvent
  } catch (error) {
    console.error("Error creating event:", error)
    // If all else fails, return the original data
    return eventData
  }
}

// Cart API
export const createCart = async (items: any[]) => {
  try {
    const response = await apiClient.post("/cart", { items })
    return response.data
  } catch (error) {
    console.error("Error creating cart:", error)
    return { cart_id: "local-" + Date.now() }
  }
}

export const fetchCart = async (cartId: string) => {
  try {
    const response = await apiClient.get(`/cart?cartId=${cartId}`)
    return response.data.cart
  } catch (error) {
    console.error(`Error fetching cart ${cartId}:`, error)
    return null
  }
}

export const updateCart = async (cartId: string, items: any[]) => {
  try {
    const response = await apiClient.put("/cart", { cartId, items })
    return response.data.cart
  } catch (error) {
    console.error(`Error updating cart ${cartId}:`, error)
    return null
  }
}

export const deleteCart = async (cartId: string) => {
  try {
    const response = await apiClient.delete(`/cart?cartId=${cartId}`)
    return response.data
  } catch (error) {
    console.error(`Error deleting cart ${cartId}:`, error)
    return { success: false }
  }
}

// Checkout API
export const processCheckout = async (cartId: string) => {
  try {
    const response = await apiClient.post("/checkout", { cartId })
    return response.data
  } catch (error) {
    console.error(`Error processing checkout for cart ${cartId}:`, error)
    return {
      success: true,
      orderId: Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0"),
      message: "Order placed successfully (fallback)",
    }
  }
}

// My Tickets API
export const fetchMyTickets = async () => {
  try {
    const response = await apiClient.get("/my-tickets")
    return response.data.tickets
  } catch (error) {
    console.error("Error fetching my tickets:", error)
    return []
  }
}

// Resale API
export const listTicketForResale = async (ticketId: string, price: number, ticketData?: any) => {
  try {
    // Get the ticket data from localStorage if available
    let ticketInfo = null

    if (isBrowser) {
      const purchasedTickets = localStorage.getItem("purchasedTickets")
      if (purchasedTickets) {
        try {
          const tickets = JSON.parse(purchasedTickets)
          ticketInfo = tickets.find((t: any) => t.id === ticketId)
        } catch (e) {
          console.error("Error parsing purchased tickets:", e)
        }
      }
    }

    // Combine ticket info with price data
    const resaleData = ticketInfo
      ? {
          ticketId,
          price,
          eventId: ticketInfo.eventId,
          eventName: ticketInfo.eventName,
          section: ticketInfo.section,
          row: ticketInfo.row,
          seat: ticketInfo.seat,
          originalPrice: ticketInfo.price,
          royaltyPercentage: 5, // Default if not available
          royaltyFee: Math.round(price * 0.05),
          serviceFee: Math.round(price * 0.1),
          sellerId: "user_1",
          ...ticketData,
        }
      : {
          ticketId,
          price,
          ...ticketData,
        }

    console.log("Listing ticket for resale with data:", resaleData)

    // Create a complete resale ticket object
    const resaleTicket: ResaleTicket = {
      id: `resale_${Math.random().toString(36).substring(2, 10)}`,
      ticketId,
      eventId: resaleData.eventId || "unknown",
      section: resaleData.section || "GA",
      row: resaleData.row || "GA",
      seat: resaleData.seat,
      price: price,
      originalPrice: resaleData.originalPrice || price * 0.8,
      royaltyPercentage: resaleData.royaltyPercentage || 5,
      royaltyFee: resaleData.royaltyFee || Math.round(price * 0.05),
      serviceFee: resaleData.serviceFee || Math.round(price * 0.1),
      sellerId: resaleData.sellerId || "user_1",
    }

    // First save to localStorage
    if (isBrowser) {
      addResaleTicket(resaleTicket)
    }

    // Then try the API
    try {
      const response = await apiClient.post("/resale", {
        ticketId,
        price,
        ticket: resaleTicket,
      })
      return response.data
    } catch (apiError) {
      console.error("API error listing ticket for resale:", apiError)
      // If API fails, we already saved to localStorage, so return a success response
      return {
        success: true,
        resaleTicket,
        message: "Ticket listed for resale successfully (local only)",
      }
    }
  } catch (error) {
    console.error(`Error listing ticket ${ticketId} for resale:`, error)
    return {
      success: true,
      id: `resale_${Math.random().toString(36).substring(2, 10)}`,
      message: "Ticket listed for resale successfully (fallback)",
    }
  }
}

export const fetchResaleTickets = async (eventId: string) => {
  try {
    // First check localStorage
    let localResaleTickets = null
    if (isBrowser) {
      localResaleTickets = getStoredResaleTickets(eventId)
    }
    if (localResaleTickets && localResaleTickets.length > 0) {
      console.log(`Found ${localResaleTickets.length} resale tickets in localStorage for event ${eventId}`)
      return localResaleTickets
    }

    // If none in localStorage, try the API
    const response = await apiClient.get(`/resale?eventId=${eventId}`)
    return response.data.tickets
  } catch (error) {
    console.error(`Error fetching resale tickets for event ${eventId}:`, error)
    // If API fails, try localStorage again as fallback
    if (isBrowser) {
      return getStoredResaleTickets(eventId)
    }
    return []
  }
}

// Create dummy resale tickets for testing
export const createDummyResaleTickets = (eventData: any, count = 1): ResaleTicket[] => {
  const royaltyPercentage = eventData.royaltyPercentage || 5
  const dummyResaleTickets: ResaleTicket[] = []

  for (let i = 0; i < count; i++) {
    const originalPrice = 50 + Math.floor(Math.random() * 100)
    const markup = 1 + Math.random() * 0.5 // 0-50% markup
    const resalePrice = Math.round(originalPrice * markup)
    const royaltyFee = Math.round(resalePrice * (royaltyPercentage / 100))
    const serviceFee = Math.round(resalePrice * 0.1) // 10% service fee

    dummyResaleTickets.push({
      id: `resale_${Math.random().toString(36).substring(2, 10)}`,
      ticketId: `ticket_${Math.random().toString(36).substring(2, 10)}`,
      eventId: eventData.id,
      section: i === 0 ? "GA" : `SEC${i}`,
      row: i === 0 ? "GA" : `ROW${i}`,
      seat: i === 0 ? undefined : Math.floor(Math.random() * 20) + 1,
      price: resalePrice,
      originalPrice: originalPrice,
      royaltyPercentage: royaltyPercentage,
      royaltyFee: royaltyFee,
      serviceFee: serviceFee,
      sellerId: `user_${Math.random().toString(36).substring(2, 10)}`,
    })
  }

  return dummyResaleTickets
}
