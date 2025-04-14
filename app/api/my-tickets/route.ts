import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("teamId")

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    // Fetch tickets from the database
    const tickets = await prisma.ticket.findMany({
      where: { ownerId: teamId },
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

    return NextResponse.json(tickets)
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}
