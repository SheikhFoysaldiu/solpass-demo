import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { Keypair } from "@solana/web3.js"
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { name } = data

    if (!name) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 })
    }

    // Generate a new keypair for the team
    const newKeypair = Keypair.generate()
    const publicKey = newKeypair.publicKey.toBase58()
    const privateKey = bs58.encode(newKeypair.secretKey)

    // Create the team in the database
    const team = await prisma.team.create({
      data: {
        name,
        publicKey,
      },
    })

    // Return the team data with the private key
    // Note: In a production app, you might want to handle the private key differently
    return NextResponse.json(
      {
        id: team.id,
        name: team.name,
        publicKey: team.publicKey,
        privateKey,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating team:", error)
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const publicKey = searchParams.get("publicKey")

    if (publicKey) {
      // Get a specific team by public key
      const team = await prisma.team.findUnique({
        where: { publicKey },
      })

      if (!team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 })
      }

      return NextResponse.json(team)
    } else {
      // Get all teams
      const teams = await prisma.team.findMany()
      return NextResponse.json(teams)
    }
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
  }
}
