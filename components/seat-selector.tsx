"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface SeatSelectorProps {
    inventory: any[]
    onSeatSelect: (seatInfo: {
        section: string
        row: string
        beginSeat?: number
        endSeat?: number
        areaId?: string | number
    }) => void
}

export function SeatSelector({ inventory, onSeatSelect }: SeatSelectorProps) {
    const [selectedSection, setSelectedSection] = useState("")
    const [selectedRow, setSelectedRow] = useState("")
    const [beginSeat, setBeginSeat] = useState<number | undefined>(undefined)
    const [endSeat, setEndSeat] = useState<number | undefined>(undefined)


    const sections = [...new Set(inventory.map((item) => item.section))]


    const rows = selectedSection
        ? [...new Set(inventory.filter((item) => item.section === selectedSection).map((item) => item.row))]
        : []

    const seats =
        selectedSection && selectedRow
            ? inventory
                .filter((item) => item.section === selectedSection && item.row === selectedRow)
                .flatMap((item) => item.seats)
                .sort((a, b) => a - b)
            : []

    // Get area ID for selected section
    const areaId = selectedSection && inventory.find((item) => item.section === selectedSection)?.areas?.[0]?.areaId

    const handleApply = () => {
        onSeatSelect({
            section: selectedSection,
            row: selectedRow,
            beginSeat,
            endSeat,
            areaId,
        })
    }

    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="seat-selection">
                <AccordionTrigger>Select Specific Seats</AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="section">Section</Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection}>
                                <SelectTrigger id="section">
                                    <SelectValue placeholder="Select section" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map((section) => (
                                        <SelectItem key={section} value={section}>
                                            {section}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedSection && (
                            <div className="space-y-2">
                                <Label htmlFor="row">Row</Label>
                                <Select value={selectedRow} onValueChange={setSelectedRow}>
                                    <SelectTrigger id="row">
                                        <SelectValue placeholder="Select row" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rows.map((row) => (
                                            <SelectItem key={row} value={row}>
                                                {row}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {selectedSection && selectedRow && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="begin-seat">Begin Seat</Label>
                                    <Select
                                        value={beginSeat?.toString() || ""}
                                        onValueChange={(value) => setBeginSeat(Number.parseInt(value))}
                                    >
                                        <SelectTrigger id="begin-seat">
                                            <SelectValue placeholder="Select seat" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {seats.map((seat) => (
                                                <SelectItem key={`begin-${seat}`} value={seat.toString()}>
                                                    {seat}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end-seat">End Seat</Label>
                                    <Select
                                        value={endSeat?.toString() || ""}
                                        onValueChange={(value) => setEndSeat(Number.parseInt(value))}
                                        disabled={!beginSeat}
                                    >
                                        <SelectTrigger id="end-seat">
                                            <SelectValue placeholder="Select seat" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {seats
                                                .filter((seat) => seat >= (beginSeat || 0))
                                                .map((seat) => (
                                                    <SelectItem key={`end-${seat}`} value={seat.toString()}>
                                                        {seat}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        <Button onClick={handleApply} disabled={!selectedSection || !selectedRow} className="w-full">
                            Apply Seat Selection
                        </Button>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}
