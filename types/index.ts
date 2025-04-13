// Database model types that match our Prisma schema
export type Team = {
  id: string
  name: string
  publicKey: string
  createdAt: Date
  updatedAt: Date
}

export type Event = {
  id: string
  name: string
  date: Date
  venue: string
  description: string | null
  image: string | null
  onsale: Date
  offsale: Date
  ticketLimit: number
  royaltyPercentage: number
  createdAt: Date
  updatedAt: Date
  teamId: string
  chainEventKey: string | null
  ticketTypes?: TicketType[]
  team?: Team
}

export type TicketType = {
  id: string
  name: string
  price: number
  fees: number
  available: number
  createdAt: Date
  updatedAt: Date
  eventId: string
}

export type Ticket = {
  id: string
  orderId: string
  section: string
  row: string
  seat: number | null
  purchaseDate: Date
  price: number
  isResale: boolean
  isListed: boolean
  createdAt: Date
  updatedAt: Date
  eventId: string
  ticketTypeId: string
  ownerId: string
  event?: Event
  ticketType?: TicketType
  owner?: Team
  resaleTicket?: ResaleTicket
}

export type ResaleTicket = {
  id: string
  price: number
  originalPrice: number
  royaltyPercentage: number
  royaltyFee: number
  serviceFee: number
  createdAt: Date
  updatedAt: Date
  ticketId: string
  eventId: string
  ticket?: Ticket
}

export type Cart = {
  id: string
  createdAt: Date
  updatedAt: Date
  teamId: string
  items: CartItem[]
}

export type CartItem = {
  id: string
  eventId: string
  ticketTypeId: string
  quantity: number
  price: number
  fees: number
  section: string
  row: string
  seats: number[]
  isResale: boolean
  resaleId?: string
  createdAt: Date
  updatedAt: Date
  cartId: string
}

export type Order = {
  id: string
  createdAt: Date
  updatedAt: Date
  teamId: string
  total: number
  status: string
}

// Frontend types for cart items
export interface FrontendCartItem {
  eventId: string
  eventName: string
  ticketTypeId: string
  priceLevelId: string
  section?: string
  row?: string
  seats?: number[]
  quantity: number
  price: number
  fees: number
  offerName: string
  chainEventKey?: string
  isResale?: boolean
  resaleId?: string
}

// Royalty form values type
export interface RoyaltyFormValues {
  ticketmaster: number
  team: number
  solpass: number
}
