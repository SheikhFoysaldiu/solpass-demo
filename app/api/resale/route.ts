import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { ticketId, price, originalPrice, royaltyPercentage, royaltyFee, serviceFee } = data

    // Validate required fields
    if (!ticketId || !price) {
      return NextResponse.json(
        {
          error: "Missing required fields: ticketId and price are required",
        },
        { status: 400 },
      )
    }

    // Get the ticket to verify it exists and get the eventId
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, eventId: true, isListed: true, price: true },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Check if ticket is already listed
    if (ticket.isListed) {
      return NextResponse.json({ error: "Ticket is already listed for resale" }, { status: 400 })
    }

    // Start a transaction to update the ticket and create the resale listing
    const result = await prisma.$transaction(async (tx) => {
      // Update the ticket to mark it as listed
      const updatedTicket = await tx.ticket.update({
        where: { id: ticketId },
        data: { isListed: true },
      })

      // Create the resale ticket listing
      const resaleTicket = await tx.resaleTicket.create({
        data: {
          ticketId,
          eventId: ticket.eventId,
          price,
          originalPrice: originalPrice || ticket.price,
          royaltyPercentage: royaltyPercentage || 5,
          royaltyFee: royaltyFee || (price * (royaltyPercentage || 5)) / 100,
          serviceFee: serviceFee || price * 0.1, // 10% service fee
        },
        include: {
          ticket: {
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
          },
        },
      })

      return resaleTicket
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error listing ticket for resale:", error)
    return NextResponse.json({ error: "Failed to list ticket for resale" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")

    if (!eventId) {
      return NextResponse.json({ error: "eventId parameter is required" }, { status: 400 })
    }

    // Get all resale tickets for a specific event
    const resaleTickets = await prisma.resaleTicket.findMany({
      where: { eventId },
      include: {
        ticket: {
          select: {
            section: true,
            row: true,
            seat: true,
            owner: {
              select: {
                name: true,
                publicKey: true,
              },
            },
            ticketType: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(resaleTickets)
  } catch (error) {
    console.error("Error fetching resale tickets:", error)
    return NextResponse.json({ error: "Failed to fetch resale tickets" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id parameter is required" }, { status: 400 })
    }

    // Get the resale ticket to find the associated ticket
    const resaleTicket = await prisma.resaleTicket.findUnique({
      where: { id },
      select: { ticketId: true },
    })

    if (!resaleTicket) {
      return NextResponse.json({ error: "Resale ticket not found" }, { status: 404 })
    }

    // Start a transaction to delete the resale listing and update the ticket
    await prisma.$transaction(async (tx) => {
      // Delete the resale ticket
      await tx.resaleTicket.delete({
        where: { id },
      })

      // Update the ticket to mark it as not listed
      await tx.ticket.update({
        where: { id: resaleTicket.ticketId },
        data: { isListed: false },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing resale ticket:", error)
    return NextResponse.json({ error: "Failed to remove resale ticket" }, { status: 500 })
  }
}
