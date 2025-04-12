// Generate random dummy event data
export function generateDummyEvent(i: number) {
  const eventTypes = [
    "Concert",
    "Festival",
    "Conference",
    "Workshop",
    "Exhibition",
    "Sports Event",
    "Comedy Show",
  ];
  const venues = [
    "Central Stadium",
    "City Arena",
    "Grand Hall",
    "Convention Center",
    "Outdoor Park",
    "Theater House",
    "Community Center",
  ];
  const artists = [
    "The Weeknd",
    "Taylor Swift",
    "BTS",
    "Ed Sheeran",
    "Billie Eilish",
    "Drake",
    "Adele",
    "Coldplay",
  ];

  // Generate a random date between now and 6 months from now
  const futureDate = new Date();
  futureDate.setMonth(
    futureDate.getMonth() + Math.floor(Math.random() * 6) + 1
  );

  // Generate random ID
  const id = Math.random().toString(36).substring(2, 12).toUpperCase();

  // Generate random event type and name
  const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const artist = artists[Math.floor(Math.random() * artists.length)];
  const name = `${eventType}: ${artist} Live`;

  // Generate random venue
  const venue = venues[Math.floor(Math.random() * venues.length)];

  // Generate random ticket types
  const ticketTypes = [
    {
      name: "General Admission",
      price: Math.floor(Math.random() * 50) + 30, // Random price between 30 and 80
      fees: Math.floor(Math.random() * 10) + 5, // Random fees between 5 and 15
      available: Math.floor(Math.random() * 500) + 100, // Random availability between 100 and 600
    },
    {
      name: "VIP",
      price: Math.floor(Math.random() * 100) + 80, // Random price between 80 and 180
      fees: Math.floor(Math.random() * 20) + 10, // Random fees between 10 and 30
      available: Math.floor(Math.random() * 100) + 50, // Random availability between 50 and 150
    },
  ];

  return {
    id: `0B004D43F86C478F${i}`,
    name,
    date: futureDate.toISOString(),
    venue,
    image: `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(
      name
    )}`,
    description: `Join us for an amazing ${eventType.toLowerCase()} featuring ${artist}! This event will be held at ${venue} and promises to be an unforgettable experience.`,
    onsale: new Date().toISOString(),
    offsale: new Date(futureDate.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1 day before event
    ticketLimit: 10,
    ticketTypes,
  };
}

// Mock event data
export const mockEventData = generateDummyEvent(100);
export type EventType = typeof mockEventData;

// Mock event availability data from the API response
export const mockEventAvailability = {
  event: {
    id: mockEventData.id,
    restrictSingle: false,
    safeTixEnabled: false,
    eventTicketLimit: 0,
    onsale: mockEventData.onsale,
    offsale: mockEventData.offsale,
    eventDateTime: mockEventData.date,
    granularPricing: false,
    allInclusivePricing: false,
    tickets: mockEventData.ticketTypes.map((ticketType, index) => ({
      offers: [
        {
          ticketTypeId: `00000000000${index + 1}`,
          priceLevelId: `${index + 1}`,
          currency: "USD",
          faceValue: ticketType.price,
          charges: [
            {
              reason: "facility",
              type: "fee",
              amount: Math.floor(ticketType.fees / 2),
            },
            {
              reason: "service",
              type: "fee",
              amount: Math.ceil(ticketType.fees / 2),
            },
          ],
          offerName: ticketType.name,
          offerDescription: ticketType.name,
          eventTicketMinimum: 1,
          restrictedPayment: false,
          sellableQuantities: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          protected: false,
        },
      ],
      available: ticketType.available,
      total: ticketType.available + Math.floor(Math.random() * 100),
      seating: index === 0 ? "general" : "reserved",
      currentTicketLimit: 10,
      inventory: [
        {
          section: index === 0 ? "GA" : `SEC${index}`,
          row: index === 0 ? "GA" : `ROW${index}`,
          seats: Array.from({ length: 20 }, (_, i) => i + 1),
          places: Array.from({ length: 20 }, (_, i) => `PLACE${i}`),
          areas: [
            {
              description:
                index === 0 ? "General Admission" : "Reserved Seating",
              name: index === 0 ? "GA" : "RS",
              areaId: `${index}`,
              areaLabel: index === 0 ? "general" : "reserved",
            },
          ],
          attributes: [],
          hasEvenOddMix: true,
        },
      ],
      eventTicketLimit: 0,
    })),
    seatLocationMapRestrict: false,
    locXnumAddescRestrict: false,
    locRowSeatRestrict: false,
    serviceFeeRollup: false,
    facilityFeeRollup: false,
    venueId: "263135",
  },
};

// Mock cart data
export const mockCartData = {
  cart_id: "e4f1caf4-70a3-406c-a1dd-1e53478a3ec1",
  cart: {
    items: [
      {
        type: "ticket",
        id: 1,
        view: {},
        totals: {
          currency_code: "USD",
          fee: 0.0,
          grand: 285.0,
          merchandise: 285.0,
          tax: 0.0,
        },
        areas: [
          {
            description: "Price Level 1",
            id: 3,
          },
          {
            description: "GENERAL ADMISSION STANDING",
            id: 14,
          },
        ],
        tickets: [
          {
            description: "Standard Ticket",
            id: "000000000001",
            quantity: 1,
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
                price: 285.0,
                type: "face_value",
                quantity: 1,
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
        num_seats: 1,
        x_num: 1,
        section: "GAPIT1",
        is_ga: true,
        transfer: {
          eligible: true,
        },
      },
      {
        type: "processing",
        id: 2,
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
        id: 4,
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
      grand: 285.0,
      merchandise: 285.0,
      tax: 0.0,
      unpaid: 285.0,
      upsell: 0.0,
    },
    hold_time: 298,
  },
};
