import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { eventId, ticketTypeId, ownerId, section, row, seat, price, isResale, orderId } = data

    // Validate required fields
    if (!eventId || !ticketTypeId || !ownerId || !section || !row || !price) {
      return NextResponse.json(
        {
          error: "Missing required fields",
        },
        { status: 400 },
      )
    }

    // Create the ticket
    const ticket = await prisma.ticket.create({
      data: {
        eventId,
        ticketTypeId,
        ownerId,
        section,
        row,
        seat,
        price,
        isResale: isResale || false,
        isListed: false,
        orderId: orderId || `ORD-${Date.now().toString(36)}`,
      },
      include: {
        event: {
          select: {
            name: true,
            date: true,
          },
        },
        ticketType: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error("Error creating ticket:", error)
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get("ownerId")
    const eventId = searchParams.get("eventId")

    if (!ownerId && !eventId) {
      return NextResponse.json({ error: "ownerId or eventId parameter is required" }, { status: 400 })
    }

    let tickets
    if (ownerId) {
      // Get tickets for a specific owner
      tickets = await prisma.ticket.findMany({
        where: { ownerId },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              date: true,
              venue: true,
              chainEventKey: true,
            },
          },
          ticketType: {
            select: {
              name: true,
            },
          },
          resaleTicket: true,
        },
        orderBy: { purchaseDate: "desc" },
      })
    } else if (eventId) {
      // Get tickets for a specific event
      tickets = await prisma.ticket.findMany({
        where: { eventId },
        include: {
          event: {
            select: {
              name: true,
              date: true,
            },
          },
          ticketType: {
            select: {
              name: true,
            },
          },
          owner: {
            select: {
              name: true,
              publicKey: true,
            },
          },
          resaleTicket: true,
        },
      })
    }

    return NextResponse.json(tickets)
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}
