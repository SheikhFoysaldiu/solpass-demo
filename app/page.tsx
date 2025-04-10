import Link from "next/link";
import { Calendar, MapPin, Ticket } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import InitializeEventInChain from "@/components/events/initialize";
import { WalletButton } from "@/components/providers/solana";

const events = [
  {
    id: "0B004D43F86C478F",
    title: "Concert at Stadium Arena",
    date: "2021-11-26 03:00:00.0",
    venue: "Stadium Arena",
    imageUrl: "/placeholder.svg?height=200&width=400",
  },
  {
    id: "1C115E54G97D589G",
    title: "Sports Championship Finals",
    date: "2021-12-15 19:30:00.0",
    venue: "Sports Complex",
    imageUrl: "/placeholder.svg?height=200&width=400",
  },
];

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <WalletButton />
      <h1 className="text-3xl font-bold mb-8">Upcoming Events</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((event) => (
          <Card key={event.id} className="overflow-hidden">
            <div className="relative h-48 w-full">
              <img
                src={event.imageUrl || "/placeholder.svg"}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
            <CardHeader>
              <CardTitle>{event.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="mr-2 h-4 w-4" />
                  <span>{event.venue}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <InitializeEventInChain />
              <Link href={`/events/${event.id}`} className="w-full">
                <Button className="w-full">
                  <Ticket className="mr-2 h-4 w-4" />
                  View Tickets
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}
