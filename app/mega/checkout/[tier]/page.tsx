"use client"

import { use, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { User } from "@supabase/supabase-js"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ArrowLeft, Check, Copy, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface CheckoutPageProps {
  params: Promise<{ tier: string }>
}

const tierData: Record<string, { name: string; price: number; description: string }> = {
  "tier1": { name: "Tier 1", price: 24, description: "Teens, Young, Incest" },
  "tier2": { name: "Tier 2", price: 34, description: "Free Access to Tier 1 + Teens, Young, Incest, Rape, Abuse" },
  "tier3": { name: "Tier 3", price: 49, description: "Free Access to Tier 2, Tier 1 + Incest, Pedo, Abuse, Girls" },
  "tier4": { name: "Tier 4", price: 89, description: "Free Access to Tier 3, Tier 2, Tier 1 + Incest, Rape, Abuse, Girls, Boys" },
  "tier5": { name: "Tier 5", price: 119, description: "Free Access to Tier 4, Tier 3, Tier 2, Tier 1 + Rape, Boys, Girls, Young, Incest, Pedo" },
  "tier6": { name: "Tier 6", price: 149, description: "High quality content longer and new videos with good collection + VIP Group" },
  "vip2": { name: "VIP 2", price: 149, description: "Free Access to VIP 1 + High quality content + VIP Group" },
  "vip3": { name: "VIP 3", price: 299, description: "Free Access to VIP 2, VIP 1 + High quality content + VIP Group" },
  "vip4": { name: "VIP 4", price: 399, description: "Free Access to VIP 3, VIP 2, VIP 1 + High quality content + VIP Group" },
  "teens": { name: "Teens", price: 34, description: "1000+ Videos - Teens (9-17) Folder" },
  "incest": { name: "Incest", price: 34, description: "600+ Videos - Family Incest/Mom Son Folder" },
  "baby": { name: "Baby", price: 49, description: "90+ Videos - Babies/Toddlers Folder" },
  "blacks": { name: "Blacks", price: 49, description: "100+ Videos - Blacks Folder" },
  "boys": { name: "Boys", price: 74, description: "500+ Videos - Boys Gay CP Folder" },
  "extreme": { name: "Extreme", price: 99, description: "80+ Videos - Hardcore/BDSM/Rape Folder" },
}

export default function MegaCheckoutPage({ params }: CheckoutPageProps) {
  const { tier } = use(params)
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [transactionId, setTransactionId] = useState("")
  const [proofImage, setProofImage] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [orderCreated, setOrderCreated] = useState(false)
  const [orderId, setOrderId] = useState("")
  const [telegramUsername, setTelegramUsername] = useState("")
  const [copied, setCopied] = useState(false)
  const [copiedPayment, setCopiedPayment] = useState(false)

  const tierInfo = tierData[tier] || { name: "Unknown", price: 0, description: "" }
  
  // Payment info from env
  const paymentInfo = {
    btc: process.env.NEXT_PUBLIC_MEGA_BTC_ADDRESS || "your_btc_address_here",
    telegram: process.env.NEXT_PUBLIC_MEGA_TELEGRAM || "@YourTelegramUsername"
  }

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/")
      return
    }
    setUser(user)
    
    // Get user's profile to fetch telegram username if exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('telegram_username')
      .eq('id', user.id)
      .single()
    
    if (profile?.telegram_username) {
      setTelegramUsername(profile.telegram_username)
    }
    
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!transactionId.trim()) {
      alert("Please provide transaction ID")
      return
    }

    setSubmitting(true)

    try {
      // Create order in database
      const { data: order, error } = await supabase
        .from('mega_orders')
        .insert({
          user_id: user!.id,
          tier: tier,
          tier_name: tierInfo.name,
          amount: tierInfo.price,
          payment_method: 'crypto',
          transaction_id: transactionId,
          proof_image: proofImage || null,
          notes: notes || null,
          telegram_username: telegramUsername || null,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      setOrderId(order.id)
      setOrderCreated(true)

      // Send webhook notification
      const webhookUrl = process.env.NEXT_PUBLIC_MEGA_CRYPTO_WEBHOOK

      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🛒 **New MEGA Order**\n\n` +
              `**Tier:** ${tierInfo.name}\n` +
              `**Amount:** $${tierInfo.price}\n` +
              `**Payment:** BTC\n` +
              `**Transaction ID:** ${transactionId}\n` +
              `**User:** ${user!.email}\n` +
              `**Telegram:** @${telegramUsername || 'Not provided'}\n` +
              `**Order ID:** ${order.id}\n\n` +
              `${proofImage ? `**Proof:** ${proofImage}\n` : ''}` +
              `${notes ? `**Notes:** ${notes}` : ''}`
          })
        })
      }
    } catch (error: any) {
      console.error('Error creating order:', error)
      alert('Error creating order. Please try again.')
    }

    setSubmitting(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyPaymentInfo = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedPayment(true)
    setTimeout(() => setCopiedPayment(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (orderCreated) {
    return (
      <div className="min-h-screen bg-background">
        <Header onMenuClick={() => {}} searchQuery="" onSearchChange={() => {}} />
        <div className="pt-14 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Order Submitted!</h1>
                <p className="text-muted-foreground">Your order has been received and is pending verification</p>
              </div>

              <div className="bg-secondary/50 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-semibold mb-4">Next Steps:</h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs">1</span>
                    <span>Your payment is being verified (usually takes 5-30 minutes)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs">2</span>
                    <span>Contact us on Telegram to receive your MEGA link</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs">3</span>
                    <span>Provide your Order ID: <code className="bg-background px-2 py-1 rounded">{orderId}</code></span>
                  </li>
                </ol>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Contact on Telegram
                </h3>
                <div className="flex items-center gap-2 justify-center mb-3">
                  <code className="text-lg font-mono bg-background px-4 py-2 rounded">{paymentInfo.telegram}</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(paymentInfo.telegram)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Message us with your Order ID to receive your MEGA link
                </p>
              </div>

              <div className="flex gap-3">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/mega">Back to MEGA</Link>
                </Button>
                <Button asChild className="flex-1 bg-purple-600 hover:bg-purple-700">
                  <a href={`https://t.me/${paymentInfo.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                    Open Telegram
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => {}} searchQuery="" onSearchChange={() => {}} />
      
      <div className="pt-14 p-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/mega">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to MEGA
            </Link>
          </Button>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Order Summary */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Package</span>
                  <p className="font-semibold">{tierInfo.name}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Description</span>
                  <p className="text-sm">{tierInfo.description}</p>
                </div>
                <div className="pt-3 border-t border-border">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <p className="text-2xl font-bold text-purple-500">${tierInfo.price}</p>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Payment Details</h2>
              
              <div className="space-y-4">
                {/* Payment Method - Only Crypto */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Payment Method</label>
                  <Button
                    variant="default"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled
                  >
                    Bitcoin (BTC)
                  </Button>
                </div>

                {/* Payment Information */}
                <div className="bg-secondary/50 border border-border rounded-lg p-4">
                  <h3 className="text-sm font-semibold mb-2">Send BTC to:</h3>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background px-3 py-2 rounded text-sm break-all">
                      {paymentInfo.btc}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyPaymentInfo(paymentInfo.btc)}
                    >
                      {copiedPayment ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Amount: ${tierInfo.price}
                  </p>
                </div>

                {/* Transaction ID */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Transaction ID / Receipt</label>
                  <Input
                    placeholder="Enter transaction ID or receipt number"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                </div>

                {/* Proof Image URL */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Proof Image URL (Optional)</label>
                  <Input
                    placeholder="https://imgur.com/..."
                    value={proofImage}
                    onChange={(e) => setProofImage(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Upload to Imgur and paste link</p>
                </div>

                {/* Telegram Username */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Telegram Username</label>
                  <Input
                    placeholder="@yourusername"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">We'll contact you here to deliver your MEGA link</p>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Additional Notes (Optional)</label>
                  <Textarea
                    placeholder="Any additional information..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !transactionId.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Order"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
