import { NextResponse } from "next/server"
import { generateDummyEvent } from "@/lib/mock-data"

// In-memory storage for events - reference the global events array from the main events route
import { events } from "../route"

export async function GET(request: Request, context: { params: { id: string } }) {

  try {
    const params = await Promise.resolve(context.params)
    const id = params.id
    // Find the event with the matching ID
    const event = events.find((event) => event.id === id)

    if (!event) {
      // If event not found, create a dummy event with the requested ID
      const dummyEvent = generateDummyEvent()
      dummyEvent.id = id
      events.push(dummyEvent)
      return NextResponse.json({ event: dummyEvent })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error(`Error fetching event`, error)
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 })
  }
}
