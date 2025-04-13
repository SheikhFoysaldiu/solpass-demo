import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log("Received data:", data)
    const {
      name,
      date,
      venue,
      description,
      image,
      onsale,
      offsale,
      ticketLimit,
      royaltyPercentage,
      teamId,
      chainEventKey,
      ticketTypes,
    } = data

    // Validate required fields
    if (!name || !date || !venue || !teamId) {
      return NextResponse.json(
        {
          error: "Missing required fields: name, date, venue, and teamId are required",
        },
        { status: 400 },
      )
    }

    // Create the event with ticket types in a transaction
    const event = await prisma.$transaction(async (tx) => {
      // Create the event
      const newEvent = await tx.event.create({
        data: {
          name,
          date: new Date(date),
          venue,
          description,
          image,
          onsale: new Date(onsale || Date.now()),
          offsale: new Date(offsale || new Date(date).getTime()),
          ticketLimit: ticketLimit || 10,
          royaltyPercentage: royaltyPercentage || 5,
          chainEventKey,
          teamId,
        },
      })

      // Create ticket types if provided
      if (ticketTypes && Array.isArray(ticketTypes) && ticketTypes.length > 0) {
        for (const type of ticketTypes) {
          await tx.ticketType.create({
            data: {
              name: type.name,
              price: type.price,
              fees: type.fees,
              available: type.available,
              eventId: newEvent.id,
            },
          })
        }
      } else {
        // Create a default ticket type if none provided
        await tx.ticketType.create({
          data: {
            name: "General Admission",
            price: 50,
            fees: 10,
            available: 100,
            eventId: newEvent.id,
          },
        })
      }

      return newEvent
    })

    // Fetch the complete event with ticket types
    const completeEvent = await prisma.event.findUnique({
      where: { id: event.id },
      include: { ticketTypes: true },
    })

    return NextResponse.json(completeEvent, { status: 201 })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("teamId")

    let events
    if (teamId) {
      // Get events for a specific team
      events = await prisma.event.findMany({
        where: { teamId },
        include: { ticketTypes: true },
        orderBy: { date: "desc" },
      })
    } else {
      // Get all events
      events = await prisma.event.findMany({
        include: { ticketTypes: true },
        orderBy: { date: "desc" },
      })
    }

    return NextResponse.json(events)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}
