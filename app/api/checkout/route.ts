import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { cartId, teamId } = data

    if (!cartId) {
      return NextResponse.json({ error: "Cart ID is required" }, { status: 400 })
    }

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    // Fetch the cart with its items
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true },
    })

    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 })
    }

    // Generate an order ID
    const orderId = `ORD-${Date.now().toString(36)}`

    // Process the order in a transaction
    await prisma.$transaction(async (tx) => {
      // Create tickets for each cart item
      for (const item of cart.items) {
        // For each quantity of the item, create a separate ticket
        for (let i = 0; i < item.quantity; i++) {
          // Handle resale ticket purchase
          if (item.isResale && item.resaleId) {
            // Get the resale ticket
            const resaleTicket = await tx.resaleTicket.findUnique({
              where: { id: item.resaleId },
              include: { ticket: true },
            })

            if (resaleTicket) {
              // Update the ticket ownership
              await tx.ticket.update({
                where: { id: resaleTicket.ticketId },
                data: {
                  ownerId: teamId,
                  isListed: false,
                  isResale: true,
                  price: resaleTicket.price,
                  orderId,
                },
              })

              // Delete the resale listing
              await tx.resaleTicket.delete({
                where: { id: item.resaleId },
              })
            }
          } else {
            // Handle regular ticket purchase
            // Get the ticket type to check availability
            const ticketType = await tx.ticketType.findUnique({
              where: { id: item.ticketTypeId },
            })

            if (ticketType && ticketType.available > 0) {
              // Create a new ticket
              await tx.ticket.create({
                data: {
                  eventId: item.eventId,
                  ticketTypeId: item.ticketTypeId,
                  ownerId: teamId,
                  section: item.section || "GA",
                  row: item.row || "GA",
                  seat: item.seats && item.seats.length > i ? item.seats[i] : null,
                  price: item.price,
                  orderId,
                },
              })

              // Update ticket type availability
              await tx.ticketType.update({
                where: { id: item.ticketTypeId },
                data: {
                  available: {
                    decrement: 1,
                  },
                },
              })
            }
          }
        }
      }

      // Create an order record
      await tx.order.create({
        data: {
          id: orderId,
          teamId,
          total: cart.items.reduce((sum, item) => sum + (item.price + item.fees) * item.quantity, 0),
          status: "completed",
        },
      })

      // Delete cart items
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      })

      // Delete the cart
      await tx.cart.delete({
        where: { id: cart.id },
      })
    })

    return NextResponse.json({
      success: true,
      orderId,
      message: "Order placed successfully",
    })
  } catch (error) {
    console.error("Error processing checkout:", error)
    return NextResponse.json({ error: "Failed to process checkout" }, { status: 500 })
  }
}
