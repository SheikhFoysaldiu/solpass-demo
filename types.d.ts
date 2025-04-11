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
  ticketTypes?: {
    name: string
    price: number
    fees: number
    available: number
  }[]
}
