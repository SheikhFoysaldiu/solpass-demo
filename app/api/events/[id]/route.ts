import { NextResponse } from "next/server"
import { getEventById } from "@/lib/event-storage"
import { generateDummyEvent } from "@/lib/mock-data"

export async function GET(request: Request, context: { params: { id: string } }) {
  try {
    const params = await Promise.resolve(context.params)
    const id = params.id

    // Find the event with the matching ID from localStorage
    const event = getEventById(id)

    if (!event) {
      console.log(`Event with ID ${id} not found.`)
      // If event not found, create a dummy event with the requested ID
      const dummyEvent = generateDummyEvent()
      dummyEvent.id = id
      return NextResponse.json({ event: dummyEvent })
    }

    console.log(`Found event with ID ${id}:`, event)
    return NextResponse.json({ event })
  } catch (error) {
    console.error(`Error fetching event`, error)
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 })
  }
}
