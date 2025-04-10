// API utility functions

export async function getEventAvailability(eventId: string, getBasePrice = false) {
    try {
        // In a real application, this would be a fetch to your API
        // For this demo, we're returning mock data based on the provided JSON

        // Mock data based on the provided JSON response
        const mockEventData = {
            event: {
                id: "0B004D43F86C478F",
                restrictSingle: false,
                safeTixEnabled: false,
                eventTicketLimit: 0,
                onsale: "2016-04-29 17:00:00.0",
                offsale: "2022-08-20 17:00:00.0",
                eventDateTime: "2021-11-26 03:00:00.0",
                granularPricing: false,
                allInclusivePricing: false,
                tickets: [
                    {
                        offers: [
                            {
                                ticketTypeId: "000000000001",
                                priceLevelId: "9",
                                currency: "USD",
                                faceValue: 50.5,
                                totalPrice: 49.4,
                                listPrice: 30,
                                charges: [
                                    {
                                        reason: "facility",
                                        type: "fee",
                                        amount: 8,
                                    },
                                    {
                                        reason: "order_processing",
                                        type: "fee",
                                        amount: 0,
                                    },
                                    {
                                        reason: "service",
                                        type: "fee",
                                        amount: 15.8,
                                    },
                                    {
                                        reason: "service",
                                        type: "tax",
                                        amount: 2,
                                    },
                                    {
                                        reason: "face_value_tax",
                                        type: "tax",
                                        amount: 3,
                                    },
                                    {
                                        reason: "service_tax_2",
                                        type: "tax",
                                        amount: 0.33,
                                    },
                                ],
                                offerName: "Premium Ticket",
                                offerDescription: "Premium seating with best views",
                                eventTicketMinimum: 1,
                                restrictedPayment: false,
                                sellableQuantities: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                                protected: false,
                                available: 536,
                            },
                        ],
                        available: 536,
                        total: 1009,
                        seating: "reserved",
                        currentTicketLimit: 20,
                        inventory: [
                            {
                                section: "328",
                                row: "11",
                                seats: [15, 16, 17, 18],
                                places: ["GMZDQORRGE5DCNI", "GMZDQORRGE5DCNQ", "GMZDQORRGE5DCNY", "GMZDQORRGE5DCOA"],
                                areas: [
                                    {
                                        description: "Concourse 3",
                                        name: "CON3",
                                        areaId: "2",
                                        areaLabel: "zone",
                                    },
                                ],
                                attributes: [],
                                hasEvenOddMix: true,
                            },
                        ],
                        eventTicketLimit: 0,
                    },
                    {
                        offers: [
                            {
                                ticketTypeId: "000000000001",
                                priceLevelId: "8",
                                currency: "USD",
                                faceValue: 64.5,
                                charges: [
                                    {
                                        reason: "facility",
                                        type: "fee",
                                        amount: 8,
                                    },
                                    {
                                        reason: "service",
                                        type: "fee",
                                        amount: 6.75,
                                    },
                                    {
                                        reason: "order_processing",
                                        type: "fee",
                                        amount: 0,
                                    },
                                    {
                                        reason: "service_tax",
                                        type: "tax",
                                        amount: 2,
                                    },
                                    {
                                        reason: "face_value_tax",
                                        type: "tax",
                                        amount: 3,
                                    },
                                    {
                                        reason: "service_tax_2",
                                        type: "tax",
                                        amount: 2,
                                    },
                                ],
                                offerName: "Standard Ticket",
                                offerDescription: "Standard seating with good views",
                                eventTicketMinimum: 1,
                                restrictedPayment: false,
                                sellableQuantities: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                                protected: false,
                                available: 1518,
                            },
                        ],
                        available: 1518,
                        total: 2429,
                        seating: "reserved",
                        currentTicketLimit: 27,
                        inventory: [
                            {
                                section: "317",
                                row: "1",
                                seats: [1, 2, 3, 4, 5, 6],
                                places: [
                                    "GMYTOORRHIYQ",
                                    "GMYTOORRHIZA",
                                    "GMYTOORRHIZQ",
                                    "GMYTOORRHI2A",
                                    "GMYTOORRHI2Q",
                                    "GMYTOORRHI3A",
                                ],
                                areas: [
                                    {
                                        description: "Concourse 3",
                                        name: "CON3",
                                        areaId: "2",
                                        areaLabel: "zone",
                                    },
                                ],
                                attributes: [],
                                hasEvenOddMix: true,
                            },
                        ],
                        eventTicketLimit: 0,
                    },
                ],
                seatLocationMapRestrict: false,
                locXnumAddescRestrict: false,
                locRowSeatRestrict: false,
                serviceFeeRollup: false,
                facilityFeeRollup: false,
                venueId: "263135",
            },
        }

        return mockEventData
    } catch (error) {
        console.error("Error fetching event availability:", error)
        return null
    }
}

// New function to reserve tickets and add to cart
export async function reserveTickets(ticketData: {
    ticketId: string
    quantity: number
    section?: string
    row?: string
    beginSeat?: number
    endSeat?: number
    priceId?: string
    areas?: { id: string | number }[]
}) {
    try {

        console.log("Reserving tickets with data:", ticketData)

        const itemId = Math.floor(Math.random() * 1000) + 1


        const basePrice = 285.0
        const totalPrice = basePrice * ticketData.quantity


        const mockResponse = {
            cart_id: "e4f1caf4-70a3-406c-a1dd-1e53478a3ec1",
            cart: {
                items: [
                    {
                        type: "ticket",
                        id: itemId,
                        view: {},
                        totals: {
                            currency_code: "USD",
                            fee: 0.0,
                            grand: totalPrice,
                            merchandise: totalPrice,
                            tax: 0.0,
                        },
                        areas: [
                            {
                                description: "Price Level 1",
                                id: 3,
                            },
                            {
                                description: ticketData.section || "GENERAL ADMISSION STANDING",
                                id: 14,
                            },
                        ],
                        tickets: [
                            {
                                description: ticketData.ticketId === "000000000001" ? "Standard Ticket" : "Premium Ticket",
                                id: ticketData.ticketId,
                                quantity: ticketData.quantity,
                                inventory_type: "PRIMARY",
                                charges: [
                                    {
                                        price: 0.0,
                                        type: "distance",
                                        quantity: 1,
                                        tax: 0.0,
                                    },
                                    {
                                        price: 0.0,
                                        type: "facility",
                                        quantity: 1,
                                        tax: 0.0,
                                    },
                                    {
                                        price: basePrice,
                                        type: "face_value",
                                        quantity: ticketData.quantity,
                                        tax: 0.0,
                                    },
                                    {
                                        price: 0.0,
                                        type: "service",
                                        quantity: 1,
                                        tax: 0.0,
                                    },
                                ],
                            },
                        ],
                        ga: true,
                        event_id: "2000527EE48A9334",
                        num_seats: ticketData.quantity,
                        x_num: ticketData.quantity,
                        section: ticketData.section || "GAPIT1",
                        row: ticketData.row || "",
                        is_ga: true,
                        transfer: {
                            eligible: true,
                        },
                    },
                    {
                        type: "processing",
                        id: itemId + 1,
                        totals: {
                            currency_code: "USD",
                            fee: 0.0,
                            grand: 0.0,
                            merchandise: 0.0,
                            tax: 0.0,
                        },
                    },
                    {
                        type: "delivery",
                        id: itemId + 2,
                        carrier: "TICKETMASTER",
                        service_level: "ETICKET",
                        description: {
                            long: "Get in with:",
                            short: "eTickets",
                            eta: "eTickets",
                        },
                        totals: {
                            currency_code: "USD",
                            fee: 0.0,
                            grand: 0.0,
                            merchandise: 0.0,
                            tax: 0.0,
                        },
                        requires_address: false,
                    },
                ],
                totals: {
                    currency_code: "USD",
                    delivery: 0.0,
                    fee: 0.0,
                    grand: totalPrice,
                    merchandise: totalPrice,
                    tax: 0.0,
                    unpaid: totalPrice,
                    upsell: 0.0,
                },
                hold_time: 298,
            },
        }


        console.log("API Response:", mockResponse)

        return mockResponse
    } catch (error) {
        console.error("Error reserving tickets:", error)
        throw new Error("Failed to reserve tickets")
    }
}
