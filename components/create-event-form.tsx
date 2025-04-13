"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createEvent } from "@/lib/api-client"
import { useTeamStore } from "@/store/useTeamStore"
import type { Event, TicketType } from "@/types"
import { Loader2, Percent, Plus, Trash2 } from "lucide-react"
import type React from "react"
import { useState } from "react"

interface CreateEventFormProps {
  onSubmit: (event: Event) => void
}

interface TicketTypeInput {
  name: string
  price: number
  fees: number
  available: number
}

export function CreateEventForm({ onSubmit }: CreateEventFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { team } = useTeamStore()

  const [formData, setFormData] = useState({
    name: "",
    date: "",
    venue: "",
    description: "",
    ticketLimit: 10,
    image: "/placeholder.svg?height=400&width=600",
    royaltyPercentage: 5, // Default royalty percentage
  })

  const [ticketTypes, setTicketTypes] = useState<TicketTypeInput[]>([
    { name: "General Admission", price: 50, fees: 10, available: 100 },
  ])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoyaltyChange = (value: number[]) => {
    setFormData((prev) => ({ ...prev, royaltyPercentage: value[0] }))
  }

  const handleTicketTypeChange = (index: number, field: keyof TicketTypeInput, value: string | number) => {
    const newTicketTypes = [...ticketTypes]

    // Convert to number if the field is price, fees, or available
    if (field === "price" || field === "fees" || field === "available") {
      newTicketTypes[index][field] = Number(value)
    } else {
      newTicketTypes[index][field] = value as string
    }

    setTicketTypes(newTicketTypes)
  }

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { name: "", price: 0, fees: 0, available: 0 }])
  }

  const removeTicketType = (index: number) => {
    if (ticketTypes.length > 1) {
      setTicketTypes(ticketTypes.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form data
      if (!formData.name || !formData.date || !formData.venue) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Validate ticket types
      for (const ticket of ticketTypes) {
        if (!ticket.name || ticket.price <= 0 || ticket.available <= 0) {
          toast({
            title: "Invalid ticket information",
            description: "Please ensure all ticket types have a name, price, and available quantity.",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      }

      // Create a new event object
      const newEvent: Partial<Event> = {
        name: formData.name,
        date: new Date(formData.date),
        venue: formData.venue,
        description: formData.description,
        image: formData.image || `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(formData.name)}`,
        onsale: new Date(),
        offsale: new Date(new Date().setMonth(new Date().getMonth() + 3)),
        ticketLimit: Number(formData.ticketLimit),
        royaltyPercentage: formData.royaltyPercentage,
        teamId: team?.id,
        ticketTypes: ticketTypes.map(
          (type) =>
            ({
              name: type.name,
              price: type.price,
              fees: type.fees,
              available: type.available,

            }) as TicketType,
        ),
      }

      console.log("Creating event:", newEvent)

      // Try to create the event via API
      let createdEvent
      try {
        onSubmit(newEvent as Event)
        console.log("Event created successfully:", createdEvent)
      } catch (apiError) {
        console.error("API error creating event:", apiError)
        throw apiError
      }

      // Reset form
      setFormData({
        name: "",
        date: "",
        venue: "",
        description: "",
        ticketLimit: 10,
        image: "/placeholder.svg?height=400&width=600",
        royaltyPercentage: 5,
      })
      setTicketTypes([{ name: "General Admission", price: 50, fees: 10, available: 100 }])

      toast({
        title: "Success",
        description: `Event "${newEvent.name}" has been created successfully.`,
      })
    } catch (error) {
      console.error("Error creating event:", error)
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Event</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Event Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter event name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Event Date & Time</Label>
            <Input id="date" name="date" type="datetime-local" value={formData.date} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue">Venue</Label>
            <Input
              id="venue"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              placeholder="Enter venue name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter event description"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image URL</Label>
            <Input
              id="image"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="Enter image URL"
            />
            <p className="text-xs text-muted-foreground">Leave blank to use default image</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticketLimit">Ticket Limit Per Person</Label>
            <Input
              id="ticketLimit"
              name="ticketLimit"
              type="number"
              min="1"
              max="50"
              value={formData.ticketLimit}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="royaltyPercentage" className="flex items-center">
                <Percent className="h-4 w-4 mr-2" />
                Resale Royalty Percentage
              </Label>
              <span className="font-medium">{formData.royaltyPercentage}%</span>
            </div>
            <Slider
              id="royaltyPercentage"
              min={0}
              max={20}
              step={1}
              value={[formData.royaltyPercentage]}
              onValueChange={handleRoyaltyChange}
            />
            <p className="text-xs text-muted-foreground">
              This percentage will be charged as a royalty fee on all resale transactions and paid to the event
              organizer.
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Ticket Types</Label>
              <Button type="button" variant="outline" size="sm" onClick={addTicketType}>
                <Plus className="h-4 w-4 mr-2" />
                Add Ticket Type
              </Button>
            </div>

            {ticketTypes.map((ticket, index) => (
              <div key={index} className="space-y-4 p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Ticket Type {index + 1}</h4>
                  {ticketTypes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTicketType(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`ticket-name-${index}`}>Name</Label>
                  <Input
                    id={`ticket-name-${index}`}
                    value={ticket.name}
                    onChange={(e) => handleTicketTypeChange(index, "name", e.target.value)}
                    placeholder="e.g. General Admission, VIP, etc."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`ticket-price-${index}`}>Price ($)</Label>
                    <Input
                      id={`ticket-price-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={ticket.price}
                      onChange={(e) => handleTicketTypeChange(index, "price", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`ticket-fees-${index}`}>Fees ($)</Label>
                    <Input
                      id={`ticket-fees-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={ticket.fees}
                      onChange={(e) => handleTicketTypeChange(index, "fees", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`ticket-available-${index}`}>Available Tickets</Label>
                    <Input
                      id={`ticket-available-${index}`}
                      type="number"
                      min="1"
                      value={ticket.available}
                      onChange={(e) => handleTicketTypeChange(index, "available", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Event"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
