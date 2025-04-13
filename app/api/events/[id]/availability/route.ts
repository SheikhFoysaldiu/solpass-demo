import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request, context: { params: { id: string } }) {
  try {
    const id = context.params.id

    // Fetch the event and its ticket types
    const event = await prisma.event.findUnique({
      where: { id },
      include: { ticketTypes: true },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Transform the data to match the expected availability format
    const availabilityData = {
      event: {
        id: event.id,
        restrictSingle: false,
        safeTixEnabled: false,
        eventTicketLimit: event.ticketLimit,
        onsale: event.onsale,
        offsale: event.offsale,
        eventDateTime: event.date,
        granularPricing: false,
        allInclusivePricing: false,
        tickets: event.ticketTypes.map((ticketType) => ({
          offers: [
            {
              ticketTypeId: ticketType.id,
              priceLevelId: ticketType.id,
              currency: "USD",
              faceValue: ticketType.price,
              charges: [
                {
                  reason: "service",
                  type: "fee",
                  amount: ticketType.fees,
                },
              ],
              offerName: ticketType.name,
              offerDescription: ticketType.name,
              eventTicketMinimum: 1,
              restrictedPayment: false,
              sellableQuantities: Array.from({ length: 10 }, (_, i) => i + 1),
              protected: false,
            },
          ],
          available: ticketType.available,
          total: ticketType.available,
          seating: "general",
          currentTicketLimit: event.ticketLimit,
          inventory: [
            {
              section: "GA",
              row: "GA",
              seats: Array.from({ length: 20 }, (_, i) => i + 1),
              places: Array.from({ length: 20 }, (_, i) => `PLACE${i}`),
              areas: [
                {
                  description: "General Admission",
                  name: "GA",
                  areaId: "1",
                  areaLabel: "general",
                },
              ],
              attributes: [],
              hasEvenOddMix: true,
            },
          ],
          eventTicketLimit: event.ticketLimit,
        })),
        seatLocationMapRestrict: false,
        locXnumAddescRestrict: false,
        locRowSeatRestrict: false,
        serviceFeeRollup: false,
        facilityFeeRollup: false,
        venueId: event.id,
      },
    }

    return NextResponse.json(availabilityData)
  } catch (error) {
    console.error(`Error fetching availability for event:`, error)
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 })
  }
}
