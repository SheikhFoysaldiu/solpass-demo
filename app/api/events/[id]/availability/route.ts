import { NextResponse } from "next/server"
import { mockEventAvailability } from "@/lib/mock-data"

export async function GET(request: Request, context: { params: { id: string } }) {
  try {
    // Simulate an asynchronous operation to fetch params
    const params = await Promise.resolve(context.params)
    const id = params.id

    // In a real app, we would fetch availability data for the specific event
    // For now, we'll return our mock data
    const availability = { ...mockEventAvailability }

    // Make sure the event ID matches the requested ID
    if (availability && availability.event) {
      availability.event.id = id
    }

    return NextResponse.json(availability)
  } catch (error) {
    console.error(`Error fetching availability for event:`, error)
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 })
  }
}
