import { NextResponse } from "next/server"
import { getStoredEvents, addEvent } from "@/lib/event-storage"

export async function GET() {
  try {
    // Get events from localStorage
    const events = getStoredEvents()
    return NextResponse.json({ events })
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const newEvent = await request.json()

    // Generate a random ID if not provided
    if (!newEvent.id) {
      newEvent.id = Math.random().toString(36).substring(2, 15).toUpperCase()
    }

    // Add default values if not provided
    if (!newEvent.name) {
      newEvent.name = "New Event"
    }

    if (!newEvent.date) {
      const date = new Date()
      date.setDate(date.getDate() + 30) // Default to 30 days from now
      newEvent.date = date.toISOString()
    }

    if (!newEvent.venue) {
      newEvent.venue = "TBD"
    }

    if (!newEvent.onsale) {
      newEvent.onsale = new Date().toISOString()
    }

    if (!newEvent.offsale) {
      const offsaleDate = new Date()
      offsaleDate.setMonth(offsaleDate.getMonth() + 3)
      newEvent.offsale = offsaleDate.toISOString()
    }

    if (!newEvent.image) {
      newEvent.image = `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(newEvent.name)}`
    }

    // Add the new event to localStorage
    const savedEvent = addEvent(newEvent)

    // Log the event for debugging
    console.log("Created new event:", savedEvent)

    return NextResponse.json({ event: savedEvent }, { status: 201 })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 400 })
  }
}
