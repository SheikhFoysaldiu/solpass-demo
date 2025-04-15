import { Badge } from "@/components/ui/badge";
import { Percent, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { ResaleTicket } from "@/types";

interface EventResaleTicketsProps {
  resaleTickets: ResaleTicket[];
  selectedResaleTicket: ResaleTicket | null;
  setSelectedResaleTicket: (ticket: ResaleTicket | null) => void;
  setSelectedTicket: (ticket: any | null) => void;
  setSelectedSection: (section: string) => void;
  setSelectedRow: (row: string) => void;
  setSelectedSeats: (seats: number[]) => void;
}

export function EventResaleTickets({
  resaleTickets,
  selectedResaleTicket,
  setSelectedResaleTicket,
  setSelectedTicket,
  setSelectedSection,
  setSelectedRow,
  setSelectedSeats,
}: EventResaleTicketsProps) {
  if (resaleTickets.length === 0) {
    return (
      <div className="text-center py-8">
        <RefreshCw className="mx-auto h-8 w-8 text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">No resale tickets available</p>
        <p className="text-sm text-gray-400">
          Check back later for fan-to-fan resale tickets
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {resaleTickets.map((ticket) => (
        <div
          key={ticket.id}
          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
            selectedResaleTicket?.id === ticket.id
              ? "border-primary bg-primary/5"
              : "border-gray-200 hover:border-gray-300"
          }`}
          onClick={() => {
            setSelectedResaleTicket(ticket);
            setSelectedTicket(null);
            setSelectedSection("");
            setSelectedRow("");
            setSelectedSeats([]);
          }}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <h3 className="font-medium">
                  {ticket.ticket?.section || "GA"} {ticket.ticket?.row || "GA"}
                  {ticket.ticket?.seat ? ` Seat ${ticket.ticket.seat}` : ""}
                </h3>
                <Badge
                  variant="outline"
                  className="ml-2 bg-amber-50 text-amber-800 border-amber-200"
                >
                  Resale
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                Original price: {formatCurrency(ticket.originalPrice)}
              </p>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                {formatCurrency(ticket.price)}
              </div>
              <div className="text-xs text-gray-500">
                + {formatCurrency(ticket.serviceFee + ticket.royaltyFee)} fees
              </div>
            </div>
          </div>

          {selectedResaleTicket?.id === ticket.id && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Ticket Price</span>
                  <span>{formatCurrency(ticket.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Service Fee</span>
                  <span>{formatCurrency(ticket.serviceFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center text-gray-500">
                    <Percent className="h-3 w-3 mr-1" />
                    Royalty Fee ({ticket.royaltyPercentage}%)
                  </span>
                  <span>{formatCurrency(ticket.royaltyFee)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
