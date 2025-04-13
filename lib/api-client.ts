import axios from "axios"
import type { Event, Team, Ticket, ResaleTicket } from "@/types"

// Create an axios instance
const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Teams API
export const createTeam = async (name: string): Promise<Team & { privateKey: string }> => {
  try {
    const response = await apiClient.post("/teams", { name })
    return response.data
  } catch (error) {
    console.error("Error creating team:", error)
    throw error
  }
}

export const getTeamByPrivateKey = async (privateKey: string): Promise<Team> => {
  try {
    const response = await apiClient.get(`/teams?privateKey=${privateKey}`)
    return response.data
  } catch (error) {
    console.error("Error fetching team:", error)
    throw error
  }
}

// Events API
export const fetchEvents = async (teamId?: string): Promise<Event[]> => {
  try {
    const url = teamId ? `/events?teamId=${teamId}` : "/events"
    const response = await apiClient.get(url)
    return response.data
  } catch (error) {
    console.error("Error fetching events:", error)
    throw error
  }
}

export const fetchEventById = async (id: string): Promise<Event> => {
  try {
    const response = await apiClient.get(`/events/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching event with id ${id}:`, error)
    throw error
  }
}

export const createEvent = async (eventData: Partial<Event>): Promise<Event> => {
  try {
    const response = await apiClient.post("/events", eventData)
    return response.data
  } catch (error) {
    console.error("Error creating event:", error)
    throw error
  }
}

export const updateEvent = async (id: string, eventData: Partial<Event>): Promise<Event> => {
  try {
    const response = await apiClient.put(`/events/${id}`, eventData)
    return response.data
  } catch (error) {
    console.error(`Error updating event ${id}:`, error)
    throw error
  }
}

// Tickets API
export const fetchMyTickets = async (ownerId: string): Promise<Ticket[]> => {
  try {
    const response = await apiClient.get(`/tickets?ownerId=${ownerId}`)
    return response.data
  } catch (error) {
    console.error("Error fetching my tickets:", error)
    throw error
  }
}

export const fetchEventTickets = async (eventId: string): Promise<Ticket[]> => {
  try {
    const response = await apiClient.get(`/tickets?eventId=${eventId}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching tickets for event ${eventId}:`, error)
    throw error
  }
}

export const purchaseTickets = async (purchaseData: {
  eventId: string
  ticketTypeId: string
  ownerId: string
  quantity: number
  section?: string
  row?: string
  seats?: number[]
  resaleTicketId?: string
}): Promise<{ success: boolean; orderId: string; ticket: Ticket }> => {
  try {
    const response = await apiClient.post("/purchase", purchaseData)
    return response.data
  } catch (error) {
    console.error("Error purchasing tickets:", error)
    throw error
  }
}

// Resale API
export const listTicketForResale = async (resaleData: {
  ticketId: string
  price: number
  originalPrice?: number
  royaltyPercentage?: number
  royaltyFee?: number
  serviceFee?: number
}): Promise<ResaleTicket> => {
  try {
    const response = await apiClient.post("/resale", resaleData)
    return response.data
  } catch (error) {
    console.error("Error listing ticket for resale:", error)
    throw error
  }
}

export const fetchResaleTickets = async (eventId: string): Promise<ResaleTicket[]> => {
  try {
    const response = await apiClient.get(`/resale?eventId=${eventId}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching resale tickets for event ${eventId}:`, error)
    return [] // Return empty array instead of throwing to handle gracefully
  }
}

export const cancelResaleListing = async (resaleId: string): Promise<{ success: boolean }> => {
  try {
    const response = await apiClient.delete(`/resale?id=${resaleId}`)
    return response.data
  } catch (error) {
    console.error(`Error canceling resale listing ${resaleId}:`, error)
    throw error
  }
}

export const fetchEventAvailability = async (
  eventId: string,
): Promise<{
  event: {
    id: string
    tickets: Array<{
      offers: Array<{
        ticketTypeId: string
        priceLevelId: string
        currency: string
        faceValue: number
        charges: Array<{
          reason: string
          type: string
          amount: number
        }>
        offerName: string
        offerDescription: string
        eventTicketMinimum: number
        sellableQuantities: number[]
      }>
      available: number
      inventory: Array<{
        section: string
        row: string
        seats: number[]
      }>
    }>
  }
}> => {
  try {
    const response = await apiClient.get(`/events/${eventId}/availability`)
    return response.data
  } catch (error) {
    console.error(`Error fetching availability for event ${eventId}:`, error)
    throw error
  }
}
