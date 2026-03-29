"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useParams } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Bitcoin,
  Gift,
  CreditCard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import QRCode from "qrcode"

interface Payment {
  id: string
  user_id: string
  plan_name: string
  amount: number
  duration_days: number
  payment_method: string
  payment_data: any
  status: string
  created_at: string
}

export default function PaymentPage() {
  const params = useParams()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [qrCode, setQrCode] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadPayment()
    
    // Poll for status updates every 5 seconds
    const interval = setInterval(loadPayment, 5000)
    return () => clearInterval(interval)
  }, [params.id])

  useEffect(() => {
    if (!payment) return
    
    if (payment.payment_method === "crypto" && payment.payment_data?.pay_address) {
      // For crypto only, generate QR code with the payment address
      generateQRCode(payment.payment_data.pay_address)
    }
    // No QR code for cashapp or gift cards
  }, [payment])

  const loadPayment = async () => {
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('id', params.id)
      .single()

    if (data) {
      setPayment(data)
    }
    setLoading(false)
  }

  const generateQRCode = async (text: string) => {
    try {
      const qr = await QRCode.toDataURL(text, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCode(qr)
    } catch (error) {
      // QR code generation failed
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatusBadge = () => {
    switch (payment?.status) {
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "approved":
      case "completed":
        return (
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return null
    }
  }

  const getIcon = () => {
    switch (payment?.payment_method) {
      case "crypto":
        return <Bitcoin className="h-12 w-12 text-orange-500" />
      case "giftcard":
        return <Gift className="h-12 w-12 text-purple-500" />
      case "cashapp":
        return <CreditCard className="h-12 w-12 text-green-500" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Payment Not Found</h1>
          <Button asChild>
            <Link href="/subscriptions">Back to Subscriptions</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-4 bg-background px-4 border-b border-border">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/subscriptions">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">Payment Details</h1>
      </header>

      <main className="pt-14 pb-8">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-card border border-border rounded-xl p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                {getIcon()}
              </div>
              <h2 className="text-2xl font-bold mb-2">{payment.plan_name}</h2>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-bold">${payment.amount}</span>
                {getStatusBadge()}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {payment.duration_days} days of premium access
              </p>
            </div>

            {/* QR Code */}
            {qrCode && (
              <div className="flex justify-center mb-6">
                <div className="bg-white p-4 rounded-lg">
                  <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                </div>
              </div>
            )}

            {/* Payment Details */}
            <div className="space-y-4">
              {payment.payment_method === "crypto" && (
                <>
                  {payment.payment_data?.pay_address ? (
                    <>
                      <div className="bg-muted rounded-lg p-4">
                        <p className="text-sm font-medium mb-2">Send Amount:</p>
                        <div className="flex items-center justify-between">
                          <code className="text-lg font-bold">
                            {payment.payment_data.pay_amount} {payment.payment_data.pay_currency?.toUpperCase()}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(payment.payment_data.pay_amount)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="bg-muted rounded-lg p-4">
                        <p className="text-sm font-medium mb-2">To Address:</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-background p-2 rounded flex-1 break-all">
                            {payment.payment_data.pay_address}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(payment.payment_data.pay_address)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                        <p className="text-sm text-orange-500 font-medium">
                          Generating payment address...
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Please wait while we create your crypto payment address
                      </p>
                    </div>
                  )}
                </>
              )}

              {payment.payment_method === "giftcard" && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Gift Card Code:</p>
                  <code className="text-lg font-bold">{payment.payment_data.gift_card_code}</code>
                </div>
              )}

              {payment.payment_method === "cashapp" && (
                <>
                  {/* Fixed BTC address to send to */}
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm font-medium mb-2">Send Bitcoin to:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-background p-2 rounded flex-1 break-all">
                        bc1qe5val0fhuvum9yy4zukjpq38ucrfdm3j9x8kk7
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard("bc1qe5val0fhuvum9yy4zukjpq38ucrfdm3j9x8kk7")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Transaction ID submitted by the user */}
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm font-medium mb-2">Your Transaction ID:</p>
                    <code className="text-sm break-all">
                      {payment.payment_data?.transaction_id || "—"}
                    </code>
                  </div>
                </>
              )}

              {/* Status Messages */}
              {payment.status === "pending" && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-sm text-yellow-600 dark:text-yellow-500 font-medium">
                    Waiting for {payment.payment_method === "crypto" ? "payment confirmation" : "admin approval"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {payment.payment_method === "crypto" 
                      ? "Your premium will activate automatically after blockchain confirmation" 
                      : "This usually takes 5-15 minutes"}
                  </p>
                </div>
              )}

              {payment.status === "approved" || payment.status === "completed" && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <p className="text-sm text-green-500 font-medium">
                    Payment Approved!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your premium access has been activated
                  </p>
                </div>
              )}

              {payment.status === "rejected" && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-sm text-red-500 font-medium">
                    Payment Rejected
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Please contact support or try a different payment method
                  </p>
                </div>
              )}

              {copied && (
                <div className="text-center text-sm text-green-500">
                  ✓ Copied to clipboard!
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/subscriptions">Back to Plans</Link>
              </Button>
              {(payment.status === "approved" || payment.status === "completed") && (
                <Button className="flex-1 bg-purple-600 hover:bg-purple-700" asChild>
                  <Link href="/">Go to Home</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
