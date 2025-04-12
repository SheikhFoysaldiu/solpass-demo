import { NextResponse } from "next/server";
import { mockEventData, generateDummyEvent } from "@/lib/mock-data";

// In-memory storage for events - export it so it can be accessed from other routes
export const events = [
  // Ensure the mock event has all required properties
  {
    ...mockEventData,
    id: "0B004D43F86C478F",
    name: mockEventData.name || "Concert in the Park",
    date: mockEventData.date || "2021-11-26 03:00:00.0",
    venue: mockEventData.venue || "Central Stadium",
  },
];

// Generate a few more dummy events
for (let i = 0; i < 2; i++) {
  events.push(generateDummyEvent(i));
}

export async function GET() {
  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  try {
    const newEvent = await request.json();

    // Generate a random ID if not provided
    if (!newEvent.id) {
      newEvent.id = Math.random().toString(36).substring(2, 15).toUpperCase();
    }

    // Add default values if not provided
    if (!newEvent.name) {
      newEvent.name = "New Event";
    }

    if (!newEvent.date) {
      const date = new Date();
      date.setDate(date.getDate() + 30); // Default to 30 days from now
      newEvent.date = date.toISOString();
    }

    if (!newEvent.venue) {
      newEvent.venue = "TBD";
    }

    if (!newEvent.onsale) {
      newEvent.onsale = new Date().toISOString();
    }

    if (!newEvent.offsale) {
      const offsaleDate = new Date();
      offsaleDate.setMonth(offsaleDate.getMonth() + 3);
      newEvent.offsale = offsaleDate.toISOString();
    }

    if (!newEvent.image) {
      newEvent.image = `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(
        newEvent.name
      )}`;
    }

    // Add the new event to our in-memory storage
    events.push(newEvent);

    return NextResponse.json({ event: newEvent }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 400 }
    );
  }
}
