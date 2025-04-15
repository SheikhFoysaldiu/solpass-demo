import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketData } from "@/app/events/[id]/page";

interface EventSeatingSelectionProps {
  selectedTicket: TicketData | null;
  selectedSection: string;
  setSelectedSection: (section: string) => void;
  selectedRow: string;
  setSelectedRow: (row: string) => void;
  selectedSeats: number[];
  setSelectedSeats: (seats: number[]) => void;
  quantity: number;
}

export function EventSeatingSelection({
  selectedTicket,
  selectedSection,
  setSelectedSection,
  selectedRow,
  setSelectedRow,
  selectedSeats,
  setSelectedSeats,
  quantity,
}: EventSeatingSelectionProps) {
  const getAvailableSections = () => {
    if (!selectedTicket || !selectedTicket.inventory) return [];

    const sections = new Set<string>();
    selectedTicket.inventory.forEach((item: any) => {
      if (item && item.section) {
        sections.add(item.section);
      }
    });

    return Array.from(sections);
  };

  const getAvailableRows = () => {
    if (!selectedTicket || !selectedTicket.inventory || !selectedSection)
      return [];

    const rows = new Set<string>();
    selectedTicket.inventory
      .filter((item: any) => item && item.section === selectedSection)
      .forEach((item: any) => {
        if (item && item.row) {
          rows.add(item.row);
        }
      });

    return Array.from(rows);
  };

  const getAvailableSeats = () => {
    if (
      !selectedTicket ||
      !selectedTicket.inventory ||
      !selectedSection ||
      !selectedRow
    )
      return [];

    const inventoryItem = selectedTicket.inventory.find(
      (item: any) =>
        item.section === selectedSection && item.row === selectedRow
    );

    return inventoryItem && inventoryItem.seats ? inventoryItem.seats : [];
  };

  const handleSectionChange = (value: string) => {
    setSelectedSection(value);
    setSelectedRow("");
    setSelectedSeats([]);

    // Find available rows for this section
    const inventory = selectedTicket?.inventory?.filter(
      (item: any) => item.section === value
    );

    if (inventory && inventory.length > 0) {
      setSelectedRow(inventory[0].row);

      // Select first available seats based on quantity
      if (inventory[0].seats && inventory[0].seats.length >= quantity) {
        setSelectedSeats(inventory[0].seats.slice(0, quantity));
      }
    }
  };

  const handleRowChange = (value: string) => {
    setSelectedRow(value);
    setSelectedSeats([]);

    // Find available seats for this section and row
    const inventoryItem = selectedTicket?.inventory?.find(
      (item: any) => item.section === selectedSection && item.row === value
    );

    if (
      inventoryItem &&
      inventoryItem.seats &&
      inventoryItem.seats.length >= quantity
    ) {
      setSelectedSeats(inventoryItem.seats.slice(0, quantity));
    }
  };

  // Handle seat selection
  const handleSeatClick = (seat: number, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default behavior

    // Toggle seat selection
    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seat));
    } else {
      // Only allow selecting up to the quantity
      if (selectedSeats.length < quantity) {
        setSelectedSeats([...selectedSeats, seat].sort((a, b) => a - b));
      } else {
        // Replace the first seat with the new one
        const newSeats = [...selectedSeats.slice(1), seat].sort(
          (a, b) => a - b
        );
        setSelectedSeats(newSeats);
      }
    }
  };

  if (!selectedTicket) {
    return (
      <div className="text-center py-4 text-gray-500">
        Please select a ticket type first
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="section">Section</Label>
        <Select value={selectedSection} onValueChange={handleSectionChange}>
          <SelectTrigger id="section">
            <SelectValue placeholder="Select section" />
          </SelectTrigger>
          <SelectContent>
            {getAvailableSections().map((section) => (
              <SelectItem key={section} value={section}>
                Section {section}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedSection && (
        <div>
          <Label htmlFor="row">Row</Label>
          <Select value={selectedRow} onValueChange={handleRowChange}>
            <SelectTrigger id="row">
              <SelectValue placeholder="Select row" />
            </SelectTrigger>

            <SelectContent>
              {getAvailableRows().map((row) => (
                <SelectItem key={row} value={row}>
                  Row {row}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedRow && (
        <div>
          <Label>Available Seats</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {getAvailableSeats().map((seat) => (
              <Badge
                key={seat}
                variant={selectedSeats.includes(seat) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={(e) => handleSeatClick(seat, e)}
              >
                Seat {seat}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Click to select up to {quantity} seats
          </p>
        </div>
      )}

      {selectedSeats.length > 0 && (
        <div>
          <Label>Selected Seats</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedSeats.map((seat) => (
              <Badge key={seat} variant="default">
                Seat {seat}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
