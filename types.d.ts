export interface Event {
  id: string
  name: string
  date: string
  venue: string
  image?: string
  description?: string
  onsale: string
  offsale: string
  ticketLimit?: number
  royaltyPercentage?: number
  ticketTypes?: {
    name: string
    price: number
    fees: number
    available: number
  }[]
}

export interface ResaleTicket {
  id: string
  ticketId: string
  eventId: string
  section: string
  row: string
  seat?: number
  price: number
  originalPrice: number
  royaltyPercentage: number
  royaltyFee: number
  serviceFee: number
  sellerId: string
}
