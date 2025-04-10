export const IDL = {
  version: "0.1.0",
  name: "ticket_master",
  constants: [
    {
      name: "EVENT_TAG",
      type: "bytes",
      value: "[69, 86, 69, 78, 84, 95, 83, 84, 65, 84, 69]",
    },
    {
      name: "TICKET_TAG",
      type: "bytes",
      value: "[84, 73, 67, 75, 69, 84, 95, 83, 84, 65, 84, 69]",
    },
  ],
  instructions: [
    {
      name: "createEvent",
      accounts: [
        { name: "eventAccount", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "eventId", type: "u64" },
        { name: "name", type: "string" },
        { name: "description", type: "string" },
        { name: "venue", type: "string" },
        { name: "date", type: "i64" },
        { name: "totalTickets", type: "u64" },
        { name: "ticketPrice", type: "u64" },
      ],
    },
    {
      name: "purchaseTicket",
      accounts: [
        { name: "eventAccount", isMut: true, isSigner: false },
        { name: "ticketAccount", isMut: true, isSigner: false },
        { name: "buyer", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "ticketId", type: "u64" }],
    },
    {
      name: "deactivateEvent",
      accounts: [
        { name: "eventAccount", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "EventAccount",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "eventId", type: "u64" },
          { name: "name", type: "string" },
          { name: "description", type: "string" },
          { name: "venue", type: "string" },
          { name: "date", type: "i64" },
          { name: "totalTickets", type: "u64" },
          { name: "ticketsSold", type: "u64" },
          { name: "ticketPrice", type: "u64" },
          { name: "isActive", type: "bool" },
        ],
      },
    },
    {
      name: "TicketAccount",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "publicKey" },
          { name: "event", type: "publicKey" },
          { name: "ticketId", type: "u64" },
          { name: "purchaseDate", type: "i64" },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "Unauthorized",
      msg: "You are not authorized to perform this action.",
    },
    { code: 6001, name: "EventExpired", msg: "Event is already expired" },
    { code: 6002, name: "EventNotActive", msg: "Event is not active" },
    { code: 6003, name: "MathOverflow", msg: "Math operation overflow" },
    {
      code: 6004,
      name: "TicketNotAvailable",
      msg: "Ticket not available",
    },
  ],
};
