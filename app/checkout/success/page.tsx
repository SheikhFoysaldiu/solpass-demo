"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

export default function CheckoutSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Only access localStorage in the browser
    if (typeof window !== "undefined") {
      // In a real app, we would get the order number from the API response
      // For now, we'll generate a random order number
      const orderNumber =
        localStorage.getItem("orderId") ||
        Math.floor(Math.random() * 1000000)
          .toString()
          .padStart(6, "0")

      if (!localStorage.getItem("orderId")) {
        localStorage.setItem("orderId", orderNumber)
      }

      // Clear the cart and cart ID
      localStorage.removeItem("cartId")
    }
  }, [])

  return (
    <div className="container mx-auto py-16 px-4 max-w-md">
      <Card className="text-center">
        <CardHeader>
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-2" />
          <CardTitle className="text-2xl">Order Confirmed!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Thank you for your purchase. Your order has been confirmed.</p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Order Number</p>
            <p className="font-mono font-medium">
              #{typeof window !== "undefined" ? localStorage.getItem("orderId") || "000000" : "000000"}
            </p>
          </div>
          <p className="text-sm text-gray-500">A confirmation email has been sent to your email address.</p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button className="w-full" onClick={() => router.push("/")}>
            Return to Events
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
