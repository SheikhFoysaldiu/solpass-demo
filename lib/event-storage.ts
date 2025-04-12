import type { Event } from "@/types"
import { generateDummyEvent } from "@/lib/mock-data"

// Check if we're in the browser environment
const isBrowser = typeof window !== "undefined"

// Helper functions to manage events in localStorage
export const getStoredEvents = (): Event[] => {
  if (!isBrowser) return [] // Return empty array if not in browser

  try {
    const storedEvents = localStorage.getItem("events")
    if (storedEvents) {
      const events = JSON.parse(storedEvents)
      if (Array.isArray(events) && events.length > 0) {
        return events
      }
    }

    // If no events in storage, create initial events
    const initialEvents = [generateDummyEvent(), generateDummyEvent()]
    if (isBrowser) {
      localStorage.setItem("events", JSON.stringify(initialEvents))
    }
    return initialEvents
  } catch (error) {
    console.error("Error getting stored events:", error)
    return [generateDummyEvent()]
  }
}

export const getEventById = (id: string): Event | null => {
  if (!isBrowser) return null

  try {
    const events = getStoredEvents()
    return events.find((event) => event.id === id) || null
  } catch (error) {
    console.error(`Error getting event with id ${id}:`, error)
    return null
  }
}

export const addEvent = (event: Event): Event => {
  if (!isBrowser) return event

  try {
    const events = getStoredEvents()

    // Ensure the event has an ID
    if (!event.id) {
      event.id = Math.random().toString(36).substring(2, 15).toUpperCase()
    }

    // Add the event to the array
    events.push(event)

    // Save the updated array
    if (isBrowser) {
      localStorage.setItem("events", JSON.stringify(events))
    }

    return event
  } catch (error) {
    console.error("Error adding event:", error)
    return event
  }
}

export const updateEvent = (event: Event): Event => {
  if (!isBrowser) return event

  try {
    const events = getStoredEvents()
    const index = events.findIndex((e) => e.id === event.id)

    if (index !== -1) {
      events[index] = event
      if (isBrowser) {
        localStorage.setItem("events", JSON.stringify(events))
      }
    }

    return event
  } catch (error) {
    console.error(`Error updating event with id ${event.id}:`, error)
    return event
  }
}

export const deleteEvent = (id: string): boolean => {
  if (!isBrowser) return false

  try {
    const events = getStoredEvents()
    const filteredEvents = events.filter((event) => event.id !== id)

    if (filteredEvents.length !== events.length) {
      if (isBrowser) {
        localStorage.setItem("events", JSON.stringify(filteredEvents))
      }
      return true
    }

    return false
  } catch (error) {
    console.error(`Error deleting event with id ${id}:`, error)
    return false
  }
}
