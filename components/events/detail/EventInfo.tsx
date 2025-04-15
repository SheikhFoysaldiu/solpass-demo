import { Calendar, Clock, MapPin, Ticket, Percent } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface EventInfoProps {
  date: string;
  venue: string;
  ticketLimit?: number;
  royaltyPercentage?: number;
}

export function EventInfo({
  date,
  venue,
  ticketLimit = 10,
  royaltyPercentage = 0,
}: EventInfoProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-gray-500" />
        <span>{formatDate(new Date(date).toISOString())}</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-gray-500" />
        <span>
          {new Date(date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-gray-500" />
        <span>{venue}</span>
      </div>
      <div className="flex items-center gap-2">
        <Ticket className="h-5 w-5 text-gray-500" />
        <span>Max {ticketLimit} tickets per order</span>
      </div>
      {royaltyPercentage > 0 && (
        <div className="flex items-center gap-2">
          <Percent className="h-5 w-5 text-gray-500" />
          <span>Resale Royalty: {royaltyPercentage}%</span>
        </div>
      )}
    </div>
  );
}
