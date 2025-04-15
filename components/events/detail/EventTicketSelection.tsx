import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { TicketData } from "@/app/events/[id]/page";

interface EventTicketSelectionProps {
  tickets: TicketData[];
  selectedTicket: TicketData | null;
  setSelectedTicket: (ticket: TicketData) => void;
  quantity: number;
  setQuantity: (quantity: number) => void;
  isTicketLoading: boolean;
  setIsTicketLoading: (loading: boolean) => void;
  setSelectedSection: (section: string) => void;
  setSelectedRow: (row: string) => void;
  setSelectedSeats: (seats: number[]) => void;
  setSelectedResaleTicket: (ticket: any) => void;
}

export function EventTicketSelection({
  tickets,
  selectedTicket,
  setSelectedTicket,
  quantity,
  setQuantity,
  isTicketLoading,
  setIsTicketLoading,
  setSelectedSection,
  setSelectedRow,
  setSelectedSeats,
  setSelectedResaleTicket,
}: EventTicketSelectionProps) {
  return (
    <div className="space-y-4">
      {tickets.map((ticket, index) => (
        <div
          key={index}
          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
            selectedTicket === ticket
              ? "border-primary bg-primary/5"
              : "border-gray-200 hover:border-gray-300"
          }`}
          onClick={() => {
            setSelectedTicket(ticket);
            setSelectedSection("");
            setSelectedRow("");
            setSelectedSeats([]);
            setSelectedResaleTicket(null);

            // Auto-select first section and row
            if (ticket.inventory && ticket.inventory.length > 0) {
              setSelectedSection(ticket.inventory[0].section);
              setSelectedRow(ticket.inventory[0].row);

              // Select first available seats based on quantity
              if (
                ticket.inventory[0].seats &&
                ticket.inventory[0].seats.length >= quantity
              ) {
                setSelectedSeats(ticket.inventory[0].seats.slice(0, quantity));
              }
            }
          }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{ticket.offers[0].offerName}</h3>
              <p className="text-sm text-gray-500">
                {ticket.available} available
              </p>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                {formatCurrency(ticket.offers[0].faceValue)}
              </div>
              <div className="text-xs text-gray-500">
                +{" "}
                {formatCurrency(
                  ticket.offers[0].charges.reduce(
                    (total: number, charge: any) =>
                      total + (charge.amount || 0),
                    0
                  )
                )}{" "}
                fees
              </div>
            </div>
          </div>

          {selectedTicket === ticket && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="mb-4">
                <Label htmlFor="quantity">Quantity</Label>
                <Select
                  value={quantity.toString()}
                  onValueChange={(value) => {
                    setIsTicketLoading(true);
                    setQuantity(Number.parseInt(value));
                    // Use setTimeout to give a small delay for UI to update
                    setTimeout(() => setIsTicketLoading(false), 300);
                  }}
                >
                  <SelectTrigger id="quantity">
                    <SelectValue placeholder="Select quantity" />
                  </SelectTrigger>
                  <SelectContent>
                    {ticket.offers[0].sellableQuantities
                      ? ticket.offers[0].sellableQuantities
                          .slice(
                            0,
                            Math.min(
                              10,
                              ticket.offers[0].sellableQuantities.length
                            )
                          )
                          .map((qty: number) => (
                            <SelectItem key={qty} value={qty.toString()}>
                              {qty}
                            </SelectItem>
                          ))
                      : Array.from({ length: 10 }, (_, i) => i + 1).map(
                          (qty) => (
                            <SelectItem key={qty} value={qty.toString()}>
                              {qty}
                            </SelectItem>
                          )
                        )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
