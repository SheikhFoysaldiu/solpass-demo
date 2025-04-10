"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface TicketQuantitySelectorProps {
    quantities: number[]
    onSelect: (quantity: number) => void
}

export function TicketQuantitySelector({ quantities, onSelect }: TicketQuantitySelectorProps) {
    const [selectedQuantity, setSelectedQuantity] = useState<number>(1)

    const handleSelect = (quantity: number) => {
        setSelectedQuantity(quantity)
        onSelect(quantity)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                    {selectedQuantity} {selectedQuantity === 1 ? "Ticket" : "Tickets"}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
                {quantities.map((quantity) => (
                    <DropdownMenuItem key={quantity} onClick={() => handleSelect(quantity)}>
                        {quantity} {quantity === 1 ? "Ticket" : "Tickets"}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
