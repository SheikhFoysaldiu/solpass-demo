"use client";
import React from "react";
import { Button } from "../ui/button";
import {
  AnchorProvider,
  BN,
  Program,
  setProvider,
  web3,
} from "@coral-xyz/anchor";
import { MOTHER, programId } from "@/lib/contants";
import { createEvent } from "@/lib/solona-client";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { IDL } from "@/lib/idl";
import idl from "@/lib/idl.json";
import {
  PublicKey,
  SendTransactionError,
  SystemProgram,
} from "@solana/web3.js";

export default function InitializeEventInChain() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  async function handleClick() {
    // runProgram();
    // return;
    if (!wallet) return;
    const provider = new AnchorProvider(connection, wallet, {});
    setProvider(provider);
    // "use server";
    const payer = wallet; //web3.Keypair.fromSecretKey(MOTHER);
    // console.log("payer", idl);
    // @ts-ignore
    const program = new Program(idl, programId, provider);
    // console.log("program", program);

    const eventData = {
      eventId: 12346,
      name: ">> Solana Developers Meetup",
      description:
        "A gathering of Solana developers to discuss the latest in blockchain technology",
      venue: "Virtual Conference",
      date: Math.floor(Date.now() / 1000) + 86400 * 14, // 14 days from now
      totalTickets: 200,
      ticketPrice: web3.LAMPORTS_PER_SOL / 2, // 0.5 SOL
    };

    const eventId = new BN(eventData.eventId);
    const date = new BN(eventData.date);
    const totalTickets = new BN(eventData.totalTickets);
    const ticketPrice = new BN(eventData.ticketPrice);

    // Constants from the program
    const EVENT_TAG = Buffer.from("EVENT_STATE");

    // Find the event PDA
    const [eventPda, eventBump] = PublicKey.findProgramAddressSync(
      [
        EVENT_TAG,
        payer.publicKey.toBuffer(),
        eventId.toArrayLike(Buffer, "le", 8),
      ],
      programId
    );
    const accounts = {
      eventAccount: eventPda,
      authority: payer.publicKey,
      systemProgram: SystemProgram.programId,
    };

    try {
      const signature = await program.methods
        .createEvent(
          eventId,
          eventData.name,
          eventData.description,
          eventData.venue,
          date,
          totalTickets,
          ticketPrice
        )
        .accounts(accounts)
        // .signers([payer])
        .rpc();

      // Wait for transaction confirmation
      await connection.confirmTransaction(signature, "confirmed");
    } catch (e) {
      if (e instanceof SendTransactionError) {
        const log = await e.getLogs(connection);
        console.log(log);
      }
      console.error("Error creating event:", e);
    }
  }
  return (
    <Button
      variant="outline"
      // className="w-full"
      onClick={handleClick}
    >
      Initialize Chain
    </Button>
  );
}
