import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { v4 as uuidv4 } from "uuid"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cartId = searchParams.get("cartId")

    if (!cartId) {
      return NextResponse.json({ error: "Cart ID is required" }, { status: 400 })
    }

    // Fetch cart from database
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true },
    })

    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 })
    }

    return NextResponse.json({ cart })
  } catch (error) {
    console.error("Error fetching cart:", error)
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { teamId, items } = data
    console.log("Received data:", data)
    console.log("Received items:", items)
    console.log("Received teamId:", teamId)
    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    // Generate a cart ID
    const cartId = uuidv4()

    // Create a new cart in the database
    const newCart = await prisma.cart.create({
      data: {
        id: cartId,
        teamId,
        items: {
          create:
            items?.map((item: any) => ({
              eventId: item.eventId,
              ticketTypeId: item.ticketTypeId,
              quantity: item.quantity,
              price: item.price,
              fees: item.fees,
              section: item.section || "GA",
              row: item.row || "GA",
              seats: item.seats || [],
              isResale: item.isResale || false,
              resaleId: item.resaleId,
            })) || [],
        },
      },
      include: { items: true },
    })

    return NextResponse.json(newCart)
  } catch (error) {
    console.error("Error creating cart:", error)
    return NextResponse.json({ error: "Failed to create cart" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const { cartId, items } = data

    if (!cartId) {
      return NextResponse.json({ error: "Cart ID is required" }, { status: 400 })
    }

    // Check if the cart exists
    const existingCart = await prisma.cart.findUnique({
      where: { id: cartId },
    })

    if (!existingCart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 })
    }

    // Delete existing items
    await prisma.cartItem.deleteMany({
      where: { cartId },
    })

    // Update the cart with new items
    const updatedCart = await prisma.cart.update({
      where: { id: cartId },
      data: {
        items: {
          create:
            items?.map((item: any) => ({
              eventId: item.eventId,
              ticketTypeId: item.ticketTypeId,
              quantity: item.quantity,
              price: item.price,
              fees: item.fees,
              section: item.section || "GA",
              row: item.row || "GA",
              seats: item.seats || [],
              isResale: item.isResale || false,
              resaleId: item.resaleId,
            })) || [],
        },
      },
      include: { items: true },
    })

    return NextResponse.json({ cart: updatedCart })
  } catch (error) {
    console.error("Error updating cart:", error)
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cartId = searchParams.get("cartId")

    if (!cartId) {
      return NextResponse.json({ error: "Cart ID is required" }, { status: 400 })
    }

    // Check if the cart exists
    const existingCart = await prisma.cart.findUnique({
      where: { id: cartId },
    })

    if (!existingCart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 })
    }

    // Delete cart items first (due to foreign key constraints)
    await prisma.cartItem.deleteMany({
      where: { cartId },
    })

    // Delete the cart
    await prisma.cart.delete({
      where: { id: cartId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting cart:", error)
    return NextResponse.json({ error: "Failed to delete cart" }, { status: 500 })
  }
}
