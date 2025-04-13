import { BN, web3 } from "@coral-xyz/anchor"
import { PublicKey } from "@solana/web3.js"

// import { Wallet } from "@coral-xyz/anchor/dist/cjs/provider";

export async function createEvent(connection, payer, programId, eventData, program) {
  // Convert JavaScript number types to BN for Solana
  const eventId = new BN(eventData.eventId)
  const date = new BN(eventData.date)
  const totalTickets = new BN(eventData.totalTickets)
  const ticketPrice = new BN(eventData.ticketPrice)

  // Constants from the program
  const EVENT_TAG = Buffer.from("EVENT_STATE")

  // Find the event PDA
  const [eventPda, eventBump] = PublicKey.findProgramAddressSync(
    [EVENT_TAG, payer.publicKey.toBuffer(), eventId.toArrayLike(Buffer, "le", 8)],
    programId,
  )

  // Create the program client
  // const provider = new AnchorProvider(
  //   connection,
  //   // NodeWallet.l(), // Use the payer's wallet for signing transactions

  //   new Wallet(payer), // Use the payer's wallet for signing transactions
  //   // new Wallet(payer),

  //   { commitment: "confirmed" }
  // );

  // Load the IDL (Interface Definition Language) for the program
  // Note: In a real app, you would load this from a file or fetch from the chain
  // const idl = await Program.fetchIdl(programId, provider);
  // const program = new Program(idl, provider);

  // Prepare the accounts required for the transaction
  const accounts = {
    eventAccount: eventPda,
    authority: payer.publicKey,
    systemProgram: web3.SystemProgram.programId,
  }

  // Build and send the transaction
  try {
    const signature = await program.methods
      .createEvent(eventId, eventData.name, eventData.description, eventData.venue, date, totalTickets, ticketPrice)
      .accounts(accounts)
      .signers([payer])
      .rpc()

    // Wait for transaction confirmation
    await connection.confirmTransaction(signature, "confirmed")

    console.log(`Event created successfully! Transaction signature: ${signature}`)
    console.log(`Event PDA: ${eventPda.toString()}`)

    return {
      signature,
      eventPda,
    }
  } catch (error) {
    console.error("Error creating event:", error)
    throw error
  }
}

// Example usage:
export const connection = new web3.Connection(web3.clusterApiUrl("devnet"), "confirmed")
