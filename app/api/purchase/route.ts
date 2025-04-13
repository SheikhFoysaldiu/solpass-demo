import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { eventId, ticketTypeId, ownerId, quantity, section, row, seats, resaleTicketId } = data

    // Generate an order ID
    const orderId = `ORD-${Date.now().toString(36)}`

    // Handle resale ticket purchase
    if (resaleTicketId) {
      // Get the resale ticket
      const resaleTicket = await prisma.resaleTicket.findUnique({
        where: { id: resaleTicketId },
        include: {
          ticket: true,
        },
      })

      if (!resaleTicket) {
        return NextResponse.json({ error: "Resale ticket not found" }, { status: 404 })
      }

      // Start a transaction to handle the resale purchase
      const result = await prisma.$transaction(async (tx) => {
        // Update the ticket ownership
        const updatedTicket = await tx.ticket.update({
          where: { id: resaleTicket.ticketId },
          data: {
            ownerId, // New owner
            isListed: false,
            isResale: true,
            price: resaleTicket.price,
            orderId,
          },
        })

        // Delete the resale listing
        await tx.resaleTicket.delete({
          where: { id: resaleTicketId },
        })

        return updatedTicket
      })

      return NextResponse.json({
        success: true,
        orderId,
        ticket: result,
      })
    }

    // Handle regular ticket purchase
    else {
      if (!eventId || !ticketTypeId || !ownerId) {
        return NextResponse.json(
          {
            error: "Missing required fields for ticket purchase",
          },
          { status: 400 },
        )
      }

      // Get the ticket type to check availability and price
      const ticketType = await prisma.ticketType.findUnique({
        where: { id: ticketTypeId },
      })

      if (!ticketType) {
        return NextResponse.json({ error: "Ticket type not found" }, { status: 404 })
      }

      // Create a single ticket
      const ticket = await prisma.ticket.create({
        data: {
          eventId,
          ticketTypeId,
          ownerId,
          section: section || "GA",
          row: row || "GA",
          seat: seats && seats.length > 0 ? seats[0] : null,
          price: ticketType.price,
          orderId,
        },
      })

      // Update ticket type availability
      await prisma.ticketType.update({
        where: { id: ticketTypeId },
        data: {
          available: {
            decrement: 1,
          },
        },
      })

      return NextResponse.json({
        success: true,
        orderId,
        ticket,
      })
    }
  } catch (error) {
    console.error("Error processing purchase:", error)
    return NextResponse.json({ error: "Failed to process purchase" }, { status: 500 })
  }
}
