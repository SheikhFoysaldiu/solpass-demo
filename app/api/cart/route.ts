import { NextResponse } from "next/server";
import { mockCartData } from "@/lib/mock-data";

// In-memory storage for carts
const carts: Record<string, any> = {};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cartId = searchParams.get("cartId");

  if (!cartId) {
    return NextResponse.json({ error: "Cart ID is required" }, { status: 400 });
  }

  const cart = carts[cartId] || null;

  if (!cart) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  return NextResponse.json({ cart });
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Generate a cart ID
    const cartId = `cart_${Math.random().toString(36).substring(2, 15)}`;

    // Create a new cart based on the mock data
    const newCart = {
      ...mockCartData,
      cart_id: cartId,
    };

    // If there are items in the request, update the cart
    if (data.items && Array.isArray(data.items)) {
      // In a real app, we would process the items and update the cart
      // For now, we'll just use the mock data
    }

    // Store the cart
    carts[cartId] = newCart;

    return NextResponse.json(newCart);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create cart" },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { cartId, items } = data;

    if (!cartId) {
      return NextResponse.json(
        { error: "Cart ID is required" },
        { status: 400 }
      );
    }

    // Check if the cart exists
    if (!carts[cartId]) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    // Update the cart
    // In a real app, we would process the items and update the cart
    // For now, we'll just use the mock data

    return NextResponse.json({ cart: carts[cartId] });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update cart" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const cartId = searchParams.get("cartId");

  if (!cartId) {
    return NextResponse.json({ error: "Cart ID is required" }, { status: 400 });
  }

  // Check if the cart exists
  if (!carts[cartId]) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  // Delete the cart
  delete carts[cartId];

  return NextResponse.json({ success: true });
}
