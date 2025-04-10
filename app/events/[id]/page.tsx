import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate } from "@/lib/utils"
import { getEventAvailability } from "@/lib/api"
import { TicketOfferCard } from "@/components/ticket-offer-card"

export default async function EventPage({ params }: { params: { id: string } }) {
    const eventData = await getEventAvailability(params.id, true)

    if (!eventData) {
        notFound()
    }

    const { event } = eventData


    const eventDetails = {
        title: params.id === "0B004D43F86C478F" ? "Concert at Stadium Arena" : "Sports Championship Finals",
        venue: "Stadium Arena",
        venueAddress: "123 Stadium Way, City, State",
    }

    return (
        <main className="container mx-auto py-8 px-4">
            <Link href="/" className="inline-flex items-center mb-6 text-sm font-medium">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Events
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold mb-2">{eventDetails.title}</h1>
                        <div className="flex flex-wrap gap-4 text-muted-foreground">
                            <div className="flex items-center">
                                <Calendar className="mr-2 h-4 w-4" />
                                <span>{formatDate(event.eventDateTime)}</span>
                            </div>
                            <div className="flex items-center">
                                <Clock className="mr-2 h-4 w-4" />
                                <span>
                                    {new Date(event.eventDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <MapPin className="mr-2 h-4 w-4" />
                                <span>{eventDetails.venue}</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative h-64 w-full mb-6 rounded-lg overflow-hidden">
                        <img
                            src="/placeholder.svg?height=300&width=600"
                            alt={eventDetails.title}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-2">Event Information</h2>
                        <p className="text-muted-foreground">
                            Join us for an unforgettable experience at {eventDetails.venue}. This event features amazing performances
                            and entertainment for all attendees. Don't miss out on this opportunity to create lasting memories!
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold mb-2">Venue Information</h2>
                        <p className="text-muted-foreground mb-2">{eventDetails.venueAddress}</p>
                        <p className="text-muted-foreground">
                            The venue offers convenient parking and is accessible by public transportation. Food and beverages will be
                            available for purchase inside.
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Available Tickets</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="standard">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="standard">Standard</TabsTrigger>
                                    <TabsTrigger value="premium">Premium</TabsTrigger>
                                </TabsList>

                                <TabsContent value="standard" className="space-y-4 mt-4">
                                    {event.tickets[1]?.offers.map((offer: any, index: number) => (
                                        <TicketOfferCard
                                            key={index}
                                            offer={offer}
                                            eventId={event.id}
                                            eventName={eventDetails.title}
                                            inventory={event.tickets[1]?.inventory || []}
                                        />
                                    ))}
                                </TabsContent>

                                <TabsContent value="premium" className="space-y-4 mt-4">
                                    {event.tickets[0]?.offers.map((offer: any, index: number) => (
                                        <TicketOfferCard
                                            key={index}
                                            offer={offer}
                                            eventId={event.id}
                                            eventName={eventDetails.title}
                                            inventory={event.tickets[0]?.inventory || []}
                                        />
                                    ))}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    )
}
