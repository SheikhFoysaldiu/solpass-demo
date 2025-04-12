import { NextResponse } from "next/server"

// In-memory storage for tickets
const tickets: Record<string, any[]> = {}

export async function GET(request: Request) {
  try {
    // In a real app, we would get the user ID from the session
    // For now, we'll use a dummy user ID
    const userId = "user_1"

    // Return the tickets for this user, or an empty array if none exist
    return NextResponse.json({ tickets: tickets[userId] || [] })
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { userId = "user_1", ticket } = data

    if (!ticket) {
      return NextResponse.json({ error: "Ticket data is required" }, { status: 400 })
    }

    // Initialize the tickets array for this user if it doesn't exist
    if (!tickets[userId]) {
      tickets[userId] = []
    }

    // Add the ticket to the user's tickets
    tickets[userId].push(ticket)

    return NextResponse.json({ success: true, ticket })
  } catch (error) {
    console.error("Error adding ticket:", error)
    return NextResponse.json({ error: "Failed to add ticket" }, { status: 500 })
  }
}
