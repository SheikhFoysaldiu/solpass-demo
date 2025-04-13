"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { useState, useEffect } from "react"

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orderId, setOrderId] = useState<string>("")

  useEffect(() => {
    // Get the order ID from the URL
    const orderIdParam = searchParams.get("orderId")
    if (orderIdParam) {
      setOrderId(orderIdParam)
    }
  }, [searchParams])

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
            <p className="font-mono font-medium">#{orderId || "000000"}</p>
          </div>
          <p className="text-sm text-gray-500">A confirmation email has been sent to your email address.</p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button className="w-full" onClick={() => router.push("/events")}>
            Return to Events
          </Button>
          <Button variant="outline" className="w-full" onClick={() => router.push("/my-tickets")}>
            View My Tickets
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
