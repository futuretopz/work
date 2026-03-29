"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { 
  ArrowLeft,
  Crown,
  Check,
  CreditCard,
  Bitcoin,
  Gift,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

type PaymentMethod = "giftcard" | "crypto" | "cashapp"

interface Plan {
  id: string
  name: string
  price: number
  duration: number
  description: string
  features: string[]
  highlighted?: boolean
}

const plans: Plan[] = [
  {
    id: "trial",
    name: "7-Day Trial",
    price: 19,
    duration: 7,
    description: "Quick Test",
    features: [
      "7 days full access",
      "High quality content",
      "All premium features included",
      "Priority support"
    ],
  },
  {
    id: "monthly",
    name: "Monthly Plan",
    price: 39,
    duration: 30,
    description: "Per Month",
    highlighted: true,
    features: [
      "Extended access period",
      "High quality content",
      "All premium features",
      "Priority support"
    ],
  },
  {
    id: "quarterly",
    name: "3 Month Plan",
    price: 90,
    duration: 90,
    description: "Best Value",
    features: [
      "Extended access period",
      "High quality content",
      "Priority support",
      "All premium features"
    ],
  },
]

const WEBHOOKS = {
  giftcard: "https://discord.com/api/webhooks/1484066823195332728/0sIajYuPoesy2t5N8pxAHBcr4BDM5Loiy_WOAsYsB5viKO02tHlzZcShlwkWYy_n9nB0",
  cashapp: "https://discord.com/api/webhooks/1484067035389628496/W66wn_ikX6uR0lsKBgy3DLtMzqFVP3v0EnbStKGkdkdZ-z8Vz9S0CJAfW5rvDCq3k0Tz",
}

export default function SubscriptionsPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<Plan>(plans[1])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [giftCardCode, setGiftCardCode] = useState("")
  const [giftCardLoading, setGiftCardLoading] = useState(false)
  const [giftCardStatus, setGiftCardStatus] = useState<"idle" | "success" | "error">("idle")
  const [transactionId, setTransactionId] = useState("")
  const [cashAppLoading, setCashAppLoading] = useState(false)
  const [cashAppStatus, setCashAppStatus] = useState<"idle" | "success" | "error">("idle")
  const [selectedCrypto, setSelectedCrypto] = useState<"btc" | "ltc" | "eth" | "trx">("btc")

  const handleGiftCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only alphanumeric characters, max 22
    let value = e.target.value.replace(/[^a-zA-z0-9]/g, "").toUpperCase()
    if (value.length > 22) value = value.slice(0, 22)
    
    // Group by 4 characters
    const parts = value.match(/.{1,4}/g)
    setGiftCardCode(parts ? parts.join("-") : value)
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user ?? null)
    
    if (session?.user) {
      // Load user profile to check premium status
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      setProfile(profileData)
    }
    
    setLoading(false)
  }

  const getGiftCardLinks = (price: number) => {
    // Map plan price to card value
    const cardValue = price === 19 ? 20 : price === 39 ? 40 : 90
    
    return [
      {
        name: "Rewarble (G2A)",
        label: `$${cardValue} Gift Card`,
        url: `https://www.g2a.com/search?query=rewarble%20${cardValue}`
      },
      {
        name: "Rewarble (Eneba)",
        label: `$${cardValue} Gift Card`,
        url: `https://www.eneba.com/store/all?text=rewarble%20${cardValue}&enb_campaign=Main%20Search&enb_content=search%20dropdown%20-%20input&enb_medium=input&enb_source=https%3A%2F%2Fwww.eneba.com%2F&enb_term=Submit`
      },
      {
        name: "Rewarble (Driffle)",
        label: `$${cardValue} Gift Card`,
        url: `https://driffle.com/store?q=rewarble%20${cardValue}`
      },
      {
        name: "Rewarble (Kinguin)",
        label: `$${cardValue} Gift Card`,
        url: `https://www.kinguin.net/listing?production_products_bestsellers_desc%5Bquery%5D=rewarble%20${cardValue}&production_products_bestsellers_desc%5Brange%5D%5Bprice%5D=0%3A2000&production_products_bestsellers_desc%5BrefinementList%5D%5Bactive%5D%5B0%5D=true`
      }
    ]
  }

  const handleGiftCardSubmit = async () => {
      if (!giftCardCode.trim() || !user) return
      setGiftCardLoading(true)

      try {
        const { data: payment } = await supabase
          .from('payments')
          .insert({
            user_id: user.id,
            plan_id: selectedPlan.id,
            plan_name: selectedPlan.name,
            amount: selectedPlan.price,
            duration_days: selectedPlan.duration,
            payment_method: 'giftcard',
            payment_data: { gift_card_code: giftCardCode },
            status: 'pending'
          })
          .select()
          .single()

        const approveUrl = `${window.location.origin}/api/admin/approve-payment?payment_id=${payment?.id}&action=approve`
        const rejectUrl = `${window.location.origin}/api/admin/approve-payment?payment_id=${payment?.id}&action=reject`

        await fetch(WEBHOOKS.giftcard, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embeds: [{
              title: "🎁 Gift Card Payment Request",
              color: 0xFFA500,
              fields: [
                { name: "User ID", value: user.id, inline: true },
                { name: "Username", value: user.email.split("@")[0], inline: true },
                { name: "Plan", value: selectedPlan.name, inline: true },
                { name: "Price", value: `$${selectedPlan.price}`, inline: true },
                { name: "Duration", value: `${selectedPlan.duration} days`, inline: true },
                { name: "Gift Card Code", value: `\`${giftCardCode}\``, inline: false },
                { name: "Payment ID", value: payment?.id || "N/A", inline: false },
                { name: "Actions", value: `[✅ Approve Payment](${approveUrl})\n[❌ Reject Payment](${rejectUrl})`, inline: false },
              ],
              timestamp: new Date().toISOString(),
            }]
          })
        })

        window.location.href = `/payment/${payment.id}`
      } catch (error) {
        setGiftCardStatus("error")
        setGiftCardLoading(false)
      }
    }

  const handleCashAppSubmit = async () => {
      if (!transactionId.trim() || !user) return
      setCashAppLoading(true)

      try {
        const { data: payment } = await supabase
          .from('payments')
          .insert({
            user_id: user.id,
            plan_id: selectedPlan.id,
            plan_name: selectedPlan.name,
            amount: selectedPlan.price,
            duration_days: selectedPlan.duration,
            payment_method: 'cashapp',
            payment_data: { transaction_id: transactionId },
            status: 'pending'
          })
          .select()
          .single()

        const approveUrl = `${window.location.origin}/api/admin/approve-payment?payment_id=${payment?.id}&action=approve`
        const rejectUrl = `${window.location.origin}/api/admin/approve-payment?payment_id=${payment?.id}&action=reject`

        await fetch(WEBHOOKS.cashapp, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embeds: [{
              title: "💵 Cash App Payment Request",
              color: 0xFFA500,
              fields: [
                { name: "User ID", value: user.id, inline: true },
                { name: "Username", value: user.email.split("@")[0], inline: true },
                { name: "Plan", value: selectedPlan.name, inline: true },
                { name: "Price", value: `$${selectedPlan.price}`, inline: true },
                { name: "Duration", value: `${selectedPlan.duration} days`, inline: true },
                { name: "BTC Address", value: "`bc1qe5val0fhuvum9yy4zukjpq38ucrfdm3j9x8kk7`", inline: false },
                { name: "Transaction ID", value: `\`${transactionId}\``, inline: false },
                { name: "Payment ID", value: payment?.id || "N/A", inline: false },
                { name: "Actions", value: `[✅ Approve Payment](${approveUrl})\n[❌ Reject Payment](${rejectUrl})`, inline: false },
              ],
              timestamp: new Date().toISOString(),
            }]
          })
        })

        window.location.href = `/payment/${payment.id}`
      } catch (error) {
        setCashAppStatus("error")
        setCashAppLoading(false)
      }
    }

  const handleCryptoPayment = async () => {
    if (!user) return

    try {
      // Create payment record first
      const { data: payment, error: insertError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          plan_id: selectedPlan.id,
          plan_name: selectedPlan.name,
          amount: selectedPlan.price,
          duration_days: selectedPlan.duration,
          payment_method: 'crypto',
          payment_data: { provider: 'nowpayments', currency: selectedCrypto },
          status: 'pending'
        })
        .select()
        .single()

      if (insertError || !payment) {
        throw new Error('Failed to create payment record')
      }

      // Call our API to create crypto payment
      const response = await fetch('/api/create-crypto-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: payment.id,
          crypto_currency: selectedCrypto,
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create crypto payment')
      }

      // Redirect to payment page
      window.location.href = `/payment/${payment.id}`
    } catch (error: any) {
      alert(`Failed to initiate crypto payment: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <Crown className="h-16 w-16 mx-auto text-purple-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to view subscription plans</p>
          <Button asChild><Link href="/">Go to Login</Link></Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-4 bg-background px-4 border-b border-border">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-lg font-semibold">Subscriptions</h1>
      </header>

      <main className="pt-14 pb-8">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Premium Status Section */}
          {profile?.is_premium && profile?.premium_expires_at && (() => {
            const expiresAt = new Date(profile.premium_expires_at)
            const now = new Date()
            const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            const isExpiringSoon = daysLeft <= 7
            
            return (
              <div className="mb-8">
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Crown className="h-8 w-8 text-purple-500" />
                    <div>
                      <h2 className="text-2xl font-bold">Premium Active</h2>
                      <p className="text-sm text-muted-foreground">
                        You have full access to all premium features
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-background/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="font-semibold text-green-500">Active</span>
                      </div>
                    </div>
                    
                    <div className="bg-background/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Expires</p>
                      <p className="font-semibold">
                        {expiresAt.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {daysLeft} days remaining
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-3">Premium Features:</p>
                    <div className="grid md:grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>High quality content</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>All premium features</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Priority support</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Ad-free experience</span>
                      </div>
                    </div>
                  </div>

                  {isExpiringSoon && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                        <p className="text-sm text-yellow-600 dark:text-yellow-500 font-medium">
                          Your premium expires in {daysLeft} days
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Renew now to continue enjoying premium features
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Only show plans if expiring soon */}
                {isExpiringSoon && (
                  <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-2">Renew Your Premium</h2>
                    <p className="text-muted-foreground mb-6">
                      Choose a plan to extend your premium access
                    </p>
                    {/* Plans will be rendered below */}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Only show plans section if user is not premium OR premium is expiring soon */}
          {(!profile?.is_premium || (() => {
            const expiresAt = new Date(profile.premium_expires_at)
            const now = new Date()
            const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            return daysLeft <= 7
          })()) && (
            <>
              {!profile?.is_premium && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
                  <p className="text-muted-foreground mb-6">Select a plan to get started</p>
                </div>
              )}

              <div className="mb-12">
            
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all ${
                    plan.highlighted ? "border-purple-500 bg-purple-500/5" : "border-border hover:border-purple-500/50"
                  } ${selectedPlan.id === plan.id ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-background" : ""}`}
                >
                  {plan.highlighted && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white">
                      {plan.description}
                    </Badge>
                  )}
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-2"><span className="text-4xl font-bold">${plan.price}</span></div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Choose Payment Method</h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div onClick={() => setPaymentMethod("giftcard")} className={`rounded-xl border-2 p-6 cursor-pointer transition-all ${paymentMethod === "giftcard" ? "border-purple-500 bg-purple-500/5" : "border-border hover:border-purple-500/50"}`}>
                <Gift className="h-8 w-8 text-purple-500 mb-3" />
                <h3 className="font-bold mb-2">Gift Cards</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Pay with Credit/Debit cards</li>
                  <li>• PayPal, Apple Pay, Google Pay support</li>
                  <li>• Simple and familiar checkout</li>
                </ul>
              </div>

              <div onClick={() => setPaymentMethod("crypto")} className={`rounded-xl border-2 p-6 cursor-pointer transition-all ${paymentMethod === "crypto" ? "border-purple-500 bg-purple-500/5" : "border-border hover:border-purple-500/50"}`}>
                <Bitcoin className="h-8 w-8 text-orange-500 mb-3" />
                <h3 className="font-bold mb-2">Cryptocurrency</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Bitcoin, Ethereum, USDT & More</li>
                  <li>• 100% Anonymous</li>
                  <li>• Instant Confirmation</li>
                  <li className="text-xs italic">Powered by Kidsplay</li>
                </ul>
              </div>

              <div onClick={() => setPaymentMethod("cashapp")} className={`rounded-xl border-2 p-6 cursor-pointer transition-all ${paymentMethod === "cashapp" ? "border-purple-500 bg-purple-500/5" : "border-border hover:border-purple-500/50"}`}>
                <CreditCard className="h-8 w-8 text-green-500 mb-3" />
                <h3 className="font-bold mb-2">Cash App</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Buy Bitcoin on Cash App</li>
                  <li>• Send to our BTC address</li>
                  <li>• Submit Transaction ID</li>
                  <li>• Manual approval (5-15 min)</li>
                </ul>
              </div>
            </div>

            {paymentMethod && (
              <div className="bg-card border border-border rounded-xl p-6 max-w-2xl mx-auto">
                <h3 className="text-xl font-bold mb-4">
                  {paymentMethod === "giftcard" && "Pay with Gift Card"}
                  {paymentMethod === "crypto" && "Pay with Cryptocurrency"}
                  {paymentMethod === "cashapp" && "Pay with Cash App"}
                </h3>

                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{selectedPlan.name}</span>
                    <span className="text-2xl font-bold">${selectedPlan.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{selectedPlan.duration} days of premium access</p>
                </div>

                {paymentMethod === "giftcard" && (
                  <div className="space-y-6">
                    {/* Where to buy section */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Where to buy your {selectedPlan.price === 90 ? "$90" : selectedPlan.price === 39 ? "$40" : "$20"} Gift Card:
                      </p>
                      <div className="grid gap-2">
                        {getGiftCardLinks(selectedPlan.price).map((link) => (
                          <a
                            key={link.name}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 border border-border rounded-xl transition-colors group"
                          >
                            <span className="font-bold">{link.name}</span>
                            <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                              <span className="text-sm">{link.label}</span>
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-border pt-6" />

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Gift Card Code</label>
                        <Input 
                          placeholder="XXXX-XXXX-XXXX-XXXX" 
                          value={giftCardCode} 
                          onChange={handleGiftCardChange}
                          maxLength={27} // 22 chars + 5 dashes
                        />
                      </div>
                    {giftCardStatus === "success" && (
                      <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-green-500/10 text-green-500">
                        <CheckCircle2 className="h-4 w-4" />Request submitted! Waiting for admin approval.
                      </div>
                    )}
                    <Button onClick={handleGiftCardSubmit} disabled={!giftCardCode.trim() || giftCardLoading} className="w-full bg-purple-600 hover:bg-purple-700">
                      {giftCardLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validate & Pay"}
                    </Button>
                  </div>
                </div>
              )}

                {paymentMethod === "crypto" && (
                  <div className="space-y-4">
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-4">
                      <p className="text-sm text-orange-500 font-medium mb-2">Automatic Payment Processing</p>
                      <p className="text-xs text-muted-foreground">Your premium access will be activated automatically after payment confirmation</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Cryptocurrency</label>
                      <div className="grid grid-cols-2 gap-3">
                        <Button type="button" variant={selectedCrypto === "btc" ? "default" : "outline"} onClick={() => setSelectedCrypto("btc")} className={selectedCrypto === "btc" ? "bg-orange-500 hover:bg-orange-600" : ""}>
                          <Bitcoin className="h-4 w-4 mr-2" />Bitcoin (BTC)
                        </Button>
                        <Button type="button" variant={selectedCrypto === "ltc" ? "default" : "outline"} onClick={() => setSelectedCrypto("ltc")} className={selectedCrypto === "ltc" ? "bg-blue-500 hover:bg-blue-600" : ""}>
                          Litecoin (LTC)
                        </Button>
                        <Button type="button" variant={selectedCrypto === "eth" ? "default" : "outline"} onClick={() => setSelectedCrypto("eth")} className={selectedCrypto === "eth" ? "bg-purple-500 hover:bg-purple-600" : ""}>
                          Ethereum (ETH)
                        </Button>
                        <Button type="button" variant={selectedCrypto === "trx" ? "default" : "outline"} onClick={() => setSelectedCrypto("trx")} className={selectedCrypto === "trx" ? "bg-red-500 hover:bg-red-600" : ""}>
                          Tron (TRX)
                        </Button>
                      </div>
                    </div>
                    <Button onClick={handleCryptoPayment} className="w-full bg-orange-500 hover:bg-orange-600">
                      <Bitcoin className="h-4 w-4 mr-2" />Pay with {selectedCrypto.toUpperCase()}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">Powered by NOWPayments • Secure & Anonymous</p>
                  </div>
                )}

                {paymentMethod === "cashapp" && (
                  <div className="space-y-4">
                    {/* Tutorial GIF */}
                    <div className="max-w-[160px] mx-auto rounded-xl overflow-hidden border border-border bg-black/20">
                      <img src="/a.gif" alt="Cash App Tutorial" className="w-full h-auto" />
                    </div>
                    
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm font-medium mb-2">Send Bitcoin to this address:</p>
                      <code className="text-xs bg-background p-2 rounded block break-all">bc1qe5val0fhuvum9yy4zukjpq38ucrfdm3j9x8kk7</code>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Enter Transaction ID</label>
                      <Input placeholder="Paste your transaction ID here" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                      <p className="text-sm text-yellow-600 dark:text-yellow-500 font-medium">Important: Send exact amount. Approval takes 5-15 mins</p>
                    </div>
                    {cashAppStatus === "success" && (
                      <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-green-500/10 text-green-500">
                        <CheckCircle2 className="h-4 w-4" />Request submitted! Waiting for admin approval.
                      </div>
                    )}
                    <Button onClick={handleCashAppSubmit} disabled={!transactionId.trim() || cashAppLoading} className="w-full bg-green-600 hover:bg-green-700">
                      {cashAppLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for Approval"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
