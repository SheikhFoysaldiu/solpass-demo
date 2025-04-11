import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface EventCardProps {
  event: {
    id: string
    name: string
    date: string
    venue: string
    image?: string
  }
}

export function EventCard({ event }: EventCardProps) {
  // Add a safety check to ensure the event object is valid
  if (!event || !event.id) {
    return null
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative h-48 w-full">
        <Image
          src={event.image || "/placeholder.svg?height=200&width=400"}
          alt={event.name || "Event"}
          fill
          className="object-cover"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-bold text-lg mb-2 line-clamp-1">{event.name || "Untitled Event"}</h3>
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{event.date ? formatDate(event.date) : "Date TBD"}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="line-clamp-1">{event.venue || "Venue TBD"}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full">
          <Link href={`/events/${event.id}`}>View Event</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
