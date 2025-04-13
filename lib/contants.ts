import { PublicKey } from "@solana/web3.js"

// Define the program ID as a string
export const PROGRAM_ID_STRING = "GsHe1b4FcRqCQMgfuqKg3D6Hi2aEFQrcRoQneDYLxyUY"

// Create a PublicKey instance safely
export const programId = (() => {
  try {
    return new PublicKey(PROGRAM_ID_STRING)
  } catch (error) {
    console.error("Error creating program ID PublicKey:", error)
    // Return a fallback system program ID
    return new PublicKey("11111111111111111111111111111111")
  }
})()

// MOTHER key for development purposes
export const MOTHER = new Uint8Array([
  78, 168, 54, 240, 112, 58, 65, 2, 204, 237, 195, 229, 149, 216, 150, 33, 10, 9, 159, 176, 234, 189, 107, 229, 80, 47,
  249, 154, 123, 161, 73, 164, 194, 107, 227, 226, 114, 95, 40, 86, 32, 124, 226, 125, 4, 168, 146, 36, 100, 105, 234,
  48, 19, 190, 177, 61, 182, 73, 92, 115, 136, 220, 153, 255,
])
