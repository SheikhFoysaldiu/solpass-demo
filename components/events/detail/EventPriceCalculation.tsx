import { ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { TicketData } from "@/app/events/[id]/page";
import { ResaleTicket } from "@/types";

interface EventPriceCalculationProps {
  selectedTicket: TicketData | null;
  selectedResaleTicket: ResaleTicket | null;
  quantity: number;
  isTicketLoading: boolean;
  onAddToCart: () => void;
  onAddResaleToCart: () => void;
}

export function EventPriceCalculation({
  selectedTicket,
  selectedResaleTicket,
  quantity,
  isTicketLoading,
  onAddToCart,
  onAddResaleToCart,
}: EventPriceCalculationProps) {
  if (selectedTicket && selectedTicket.offers && selectedTicket.offers[0]) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span>
            Price ({quantity} x{" "}
            {formatCurrency(selectedTicket.offers[0].faceValue || 0)})
          </span>
          <span>
            {formatCurrency(
              (selectedTicket.offers[0].faceValue || 0) * quantity
            )}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span>Fees</span>
          <span>
            {formatCurrency(
              selectedTicket.offers[0].charges.reduce(
                (total: number, charge: any) => total + (charge.amount || 0),
                0
              ) * quantity || 0
            )}
          </span>
        </div>

        <div className="flex justify-between font-semibold pt-2 border-t">
          <span>Total</span>
          <span>
            {formatCurrency(
              ((selectedTicket.offers[0].faceValue || 0) +
                (selectedTicket.offers[0].charges.reduce(
                  (total: number, charge: any) => total + (charge.amount || 0),
                  0
                ) || 0)) *
                quantity
            )}
          </span>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={onAddToCart}
          disabled={!selectedTicket || quantity < 1 || isTicketLoading}
        >
          {isTicketLoading ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </div>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </>
          )}
        </Button>
      </div>
    );
  }

  if (selectedResaleTicket) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span>Ticket Price</span>
          <span>{formatCurrency(selectedResaleTicket.price)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span>Service Fee</span>
          <span>{formatCurrency(selectedResaleTicket.serviceFee)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span>Royalty Fee ({selectedResaleTicket.royaltyPercentage}%)</span>
          <span>{formatCurrency(selectedResaleTicket.royaltyFee)}</span>
        </div>

        <div className="flex justify-between font-semibold pt-2 border-t">
          <span>Total</span>
          <span>
            {formatCurrency(
              selectedResaleTicket.price +
                selectedResaleTicket.serviceFee +
                selectedResaleTicket.royaltyFee
            )}
          </span>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={onAddResaleToCart}
          disabled={!selectedResaleTicket}
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          Add Resale Ticket to Cart
        </Button>
      </div>
    );
  }

  return null;
}
