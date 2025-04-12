import type { ResaleTicket } from "@/types"

// Check if we're in the browser environment
const isBrowser = typeof window !== "undefined"

// Helper functions to manage resale tickets in localStorage
export const getStoredResaleTickets = (eventId?: string): ResaleTicket[] => {
  if (!isBrowser) return [] // Return empty array if not in browser

  try {
    const storedResaleTickets = localStorage.getItem("resaleTickets")
    if (storedResaleTickets) {
      const resaleTickets = JSON.parse(storedResaleTickets)
      if (Array.isArray(resaleTickets)) {
        // If eventId is provided, filter by that event
        if (eventId) {
          return resaleTickets.filter((ticket) => ticket.eventId === eventId)
        }
        return resaleTickets
      }
    }
    return []
  } catch (error) {
    console.error("Error getting stored resale tickets:", error)
    return []
  }
}

export const addResaleTicket = (ticket: ResaleTicket): ResaleTicket => {
  if (!isBrowser) return ticket

  try {
    const resaleTickets = getStoredResaleTickets()

    // Ensure the ticket has an ID
    if (!ticket.id) {
      ticket.id = `resale_${Math.random().toString(36).substring(2, 10)}`
    }

    // Add the ticket to the array
    resaleTickets.push(ticket)

    // Save the updated array
    localStorage.setItem("resaleTickets", JSON.stringify(resaleTickets))

    return ticket
  } catch (error) {
    console.error("Error adding resale ticket:", error)
    return ticket
  }
}

export const removeResaleTicket = (ticketId: string): boolean => {
  if (!isBrowser) return false

  try {
    const resaleTickets = getStoredResaleTickets()
    const filteredTickets = resaleTickets.filter((ticket) => ticket.id !== ticketId)

    if (filteredTickets.length !== resaleTickets.length) {
      localStorage.setItem("resaleTickets", JSON.stringify(filteredTickets))
      return true
    }

    return false
  } catch (error) {
    console.error(`Error removing resale ticket with id ${ticketId}:`, error)
    return false
  }
}
