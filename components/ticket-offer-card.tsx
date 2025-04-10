"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TicketQuantitySelector } from "@/components/ticket-quantity-selector"
import { SeatSelector } from "@/components/seat-selector"
import { useCart } from "@/components/cart-provider"
import { formatCurrency } from "@/lib/utils"
import { Check, Loader2 } from "lucide-react"
import { reserveTickets } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

interface TicketOfferCardProps {
    offer: any
    eventId: string
    eventName: string
    inventory: any[]
}

export function TicketOfferCard({ offer, eventId, eventName, inventory }: TicketOfferCardProps) {
    const [selectedQuantity, setSelectedQuantity] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [isAdded, setIsAdded] = useState(false)
    const [selectedSeat, setSelectedSeat] = useState<{
        section?: string
        row?: string
        beginSeat?: number
        endSeat?: number
        areaId?: string | number
    } | null>(null)

    const { setCart } = useCart()
    const { toast } = useToast()


    const calculateTotalPrice = (offer: any) => {
        let total = offer.faceValue || 0

        if (offer.charges) {
            offer.charges.forEach((charge: any) => {
                total += charge.amount
            })
        }

        return total
    }

    const totalPrice = calculateTotalPrice(offer)

    const handleAddToCart = async () => {
        setIsLoading(true)

        try {

            const requestData = {
                ticketId: offer.ticketTypeId,
                quantity: selectedQuantity,
                priceId: offer.priceLevelId,
                ...(selectedSeat?.section && { section: selectedSeat.section }),
                ...(selectedSeat?.row && { row: selectedSeat.row }),
                ...(selectedSeat?.beginSeat && { beginSeat: selectedSeat.beginSeat }),
                ...(selectedSeat?.endSeat && { endSeat: selectedSeat.endSeat }),
                ...(selectedSeat?.areaId && { areas: [{ id: selectedSeat.areaId }] }),
            }

            const response = await reserveTickets(requestData)


            console.log("API Response:", response)


            setCart(response)


            setIsAdded(true)

            toast({
                title: "Added to cart",
                description: `${selectedQuantity} ${offer.offerName} ticket(s) added to your cart.`,
            })

            setTimeout(() => setIsAdded(false), 2000)
        } catch (error) {
            console.error("Failed to add tickets to cart:", error)


            toast({
                title: "Error",
                description: "Failed to add tickets to cart. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-semibold">{offer.offerName}</h3>
                        <p className="text-sm text-muted-foreground">{offer.offerDescription}</p>
                    </div>
                    <Badge variant="outline">{offer.currency}</Badge>
                </div>

                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                        <span>Face Value:</span>
                        <span>{formatCurrency(offer.faceValue, offer.currency)}</span>
                    </div>

                    {offer.charges.map((charge: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                            <span>
                                {charge.reason.replace(/_/g, " ")} ({charge.type}):
                            </span>
                            <span>{formatCurrency(charge.amount, offer.currency)}</span>
                        </div>
                    ))}

                    <div className="flex justify-between font-semibold pt-2 border-t">
                        <span>Total Price:</span>
                        <span>{formatCurrency(totalPrice, offer.currency)}</span>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-green-600 font-medium">
                            <span className="font-bold">{offer.sellableQuantities?.length || 0}</span> ticket types available
                        </p>
                        <Badge variant="outline" className="bg-green-50">
                            {offer.available || "536"} available
                        </Badge>
                    </div>
                    <TicketQuantitySelector
                        quantities={offer.sellableQuantities?.slice(0, 10) || [1, 2, 3, 4, 5]}
                        onSelect={setSelectedQuantity}
                    />
                </div>

                {/* Seat Selector */}
                <div className="mb-4">
                    <SeatSelector inventory={inventory} onSeatSelect={setSelectedSeat} />

                    {selectedSeat && (
                        <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                            <p className="font-medium">Selected seats:</p>
                            <p>Section: {selectedSeat.section}</p>
                            <p>Row: {selectedSeat.row}</p>
                            {selectedSeat.beginSeat && (
                                <p>
                                    Seat(s): {selectedSeat.beginSeat}
                                    {selectedSeat.endSeat && selectedSeat.endSeat !== selectedSeat.beginSeat
                                        ? ` - ${selectedSeat.endSeat}`
                                        : ""}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <Button className="w-full" onClick={handleAddToCart} disabled={isLoading || isAdded}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding to Cart...
                        </>
                    ) : isAdded ? (
                        <>
                            <Check className="mr-2 h-4 w-4" />
                            Added to Cart
                        </>
                    ) : (
                        "Add to Cart"
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}
