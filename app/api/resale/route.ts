import { NextResponse } from "next/server"
import { getStoredResaleTickets, addResaleTicket, removeResaleTicket } from "@/lib/resale-storage"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    // Get resale tickets from localStorage
    const tickets = getStoredResaleTickets(eventId)

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error("Error fetching resale tickets:", error)
    return NextResponse.json({ error: "Failed to fetch resale tickets" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { ticketId, price, ticket } = data

    // If a complete ticket object is provided, use it
    if (ticket) {
      const savedTicket = addResaleTicket(ticket)
      return NextResponse.json({ success: true, resaleTicket: savedTicket })
    }

    // Otherwise, require ticketId and price
    if (!ticketId || !price) {
      return NextResponse.json({ error: "Ticket ID and price are required" }, { status: 400 })
    }

    // Create a basic resale ticket
    const resaleTicket = {
      id: `resale_${Math.random().toString(36).substring(2, 10)}`,
      ticketId,
      price,
      eventId: data.eventId || "unknown",
      section: data.section || "GA",
      row: data.row || "GA",
      seat: data.seat,
      originalPrice: data.originalPrice || price * 0.8,
      royaltyPercentage: data.royaltyPercentage || 5,
      royaltyFee: data.royaltyFee || Math.round(price * 0.05),
      serviceFee: data.serviceFee || Math.round(price * 0.1),
      sellerId: data.sellerId || "user_1",
      createdAt: new Date().toISOString(),
    }

    // Add the resale ticket to localStorage
    const savedTicket = addResaleTicket(resaleTicket)

    return NextResponse.json({ success: true, resaleTicket: savedTicket })
  } catch (error) {
    console.error("Error listing ticket for resale:", error)
    return NextResponse.json({ error: "Failed to list ticket for resale" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const resaleId = searchParams.get("resaleId")

    if (!resaleId) {
      return NextResponse.json({ error: "Resale ID is required" }, { status: 400 })
    }

    // Remove the resale ticket from localStorage
    const removed = removeResaleTicket(resaleId)

    if (!removed) {
      return NextResponse.json({ error: "Resale ticket not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing resale ticket:", error)
    return NextResponse.json({ error: "Failed to remove resale ticket" }, { status: 500 })
  }
}
