import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        ticketTypes: true,
        team: {
          select: {
            id: true,
            name: true,
            publicKey: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error(`Error fetching event ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const data = await request.json()

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        name: data.name,
        date: data.date ? new Date(data.date) : undefined,
        venue: data.venue,
        description: data.description,
        image: data.image,
        onsale: data.onsale ? new Date(data.onsale) : undefined,
        offsale: data.offsale ? new Date(data.offsale) : undefined,
        ticketLimit: data.ticketLimit,
        royaltyPercentage: data.royaltyPercentage,
        chainEventKey: data.chainEventKey,
      },
      include: { ticketTypes: true },
    })

    // Update ticket types if provided
    if (data.ticketTypes && Array.isArray(data.ticketTypes)) {
      // This is a simplified approach - in a real app, you might want to handle
      // updating, creating, and deleting ticket types more carefully
      await prisma.ticketType.deleteMany({
        where: { eventId: id },
      })

      for (const type of data.ticketTypes) {
        await prisma.ticketType.create({
          data: {
            name: type.name,
            price: type.price,
            fees: type.fees,
            available: type.available,
            eventId: id,
          },
        })
      }
    }

    // Fetch the updated event with ticket types
    const completeEvent = await prisma.event.findUnique({
      where: { id },
      include: { ticketTypes: true },
    })

    return NextResponse.json(completeEvent)
  } catch (error) {
    console.error(`Error updating event ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Delete the event (this will cascade delete ticket types if you set up your schema that way)
    await prisma.event.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error deleting event ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}
