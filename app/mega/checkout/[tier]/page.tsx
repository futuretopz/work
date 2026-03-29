"use client"

import { use, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { User } from "@supabase/supabase-js"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ArrowLeft, Check, Copy, ExternalLink, Bitcoin, DollarSign, Gift } from "lucide-react"
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
  const [paymentMethod, setPaymentMethod] = useState<"crypto" | "cashapp" | "giftcard">("crypto")
  const [giftCardProvider, setGiftCardProvider] = useState<string>("")

  const tierInfo = tierData[tier] || { name: "Unknown", price: 0, description: "" }
  
  // Payment info from env
  const paymentInfo = {
    btc: process.env.NEXT_PUBLIC_MEGA_BTC_ADDRESS || "your_btc_address_here",
    cashapp: process.env.NEXT_PUBLIC_MEGA_CASHAPP || "$YourCashApp",
    telegram: process.env.NEXT_PUBLIC_MEGA_TELEGRAM || "@YourTelegramUsername"
  }

  const getGiftCardLinks = (price: number) => {
    // Use exact MEGA tier price
    const cardValue = price
    
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

  const handleGiftCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only alphanumeric characters, max 22
    let value = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
    if (value.length > 22) value = value.slice(0, 22)
    
    // Format with dashes: XXXX-XXXX-XXXX-XXXX-XX
    let formatted = ""
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += "-"
      formatted += value[i]
    }
    
    setTransactionId(formatted)
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
          payment_method: paymentMethod,
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
      const webhookUrl = paymentMethod === 'crypto' 
        ? process.env.NEXT_PUBLIC_MEGA_CRYPTO_WEBHOOK
        : paymentMethod === 'cashapp'
        ? process.env.NEXT_PUBLIC_MEGA_CASHAPP_WEBHOOK
        : process.env.NEXT_PUBLIC_MEGA_GIFTCARD_WEBHOOK

      const paymentMethodName = paymentMethod === 'crypto' ? 'BTC' : paymentMethod === 'cashapp' ? 'CashApp' : 'Gift Card'
      const transactionLabel = paymentMethod === 'giftcard' ? 'Gift Card Code' : 'Transaction ID'

      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🛒 **New MEGA Order**\n\n` +
              `**Tier:** ${tierInfo.name}\n` +
              `**Amount:** $${tierInfo.price}\n` +
              `**Payment:** ${paymentMethodName}\n` +
              `**${transactionLabel}:** ${transactionId}\n` +
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
                {/* Payment Method Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={paymentMethod === "crypto" ? "default" : "outline"}
                      className={paymentMethod === "crypto" ? "bg-purple-600 hover:bg-purple-700" : ""}
                      onClick={() => setPaymentMethod("crypto")}
                    >
                      <Bitcoin className="h-4 w-4 mr-2" />
                      BTC
                    </Button>
                    <Button
                      variant={paymentMethod === "cashapp" ? "default" : "outline"}
                      className={paymentMethod === "cashapp" ? "bg-purple-600 hover:bg-purple-700" : ""}
                      onClick={() => setPaymentMethod("cashapp")}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      CashApp
                    </Button>
                    <Button
                      variant={paymentMethod === "giftcard" ? "default" : "outline"}
                      className={paymentMethod === "giftcard" ? "bg-purple-600 hover:bg-purple-700" : ""}
                      onClick={() => setPaymentMethod("giftcard")}
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      Gift Card
                    </Button>
                  </div>
                </div>

                {/* Payment Information */}
                {paymentMethod === "crypto" && (
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
                )}

                {paymentMethod === "cashapp" && (
                  <div className="bg-secondary/50 border border-border rounded-lg p-4">
                    <h3 className="text-sm font-semibold mb-2">Send to CashApp:</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <code className="flex-1 bg-background px-3 py-2 rounded text-sm break-all">
                        {paymentInfo.cashapp}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyPaymentInfo(paymentInfo.cashapp)}
                        className="shrink-0"
                      >
                        {copiedPayment ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Amount: ${tierInfo.price}
                    </p>
                  </div>
                )}

                {paymentMethod === "giftcard" && (
                  <div className="space-y-4">
                    <div className="bg-secondary/50 border border-border rounded-lg p-4">
                      <h3 className="text-sm font-semibold mb-3">Purchase Gift Card:</h3>
                      <div className="space-y-2">
                        {getGiftCardLinks(tierInfo.price).map((link) => (
                          <a
                            key={link.name}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 bg-background hover:bg-accent rounded-lg transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <Gift className="h-5 w-5 text-purple-500" />
                              <div>
                                <p className="text-sm font-medium">{link.name}</p>
                                <p className="text-xs text-muted-foreground">{link.label}</p>
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                          </a>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        After purchasing, enter the gift card code below
                      </p>
                    </div>
                  </div>
                )}

                {/* Transaction ID */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {paymentMethod === "giftcard" ? "Gift Card Code" : "Transaction ID / Receipt"}
                  </label>
                  <Input
                    placeholder={paymentMethod === "giftcard" ? "XXXX-XXXX-XXXX-XXXX-XX" : "Enter transaction ID or receipt number"}
                    value={transactionId}
                    onChange={paymentMethod === "giftcard" ? handleGiftCardChange : (e) => setTransactionId(e.target.value)}
                    maxLength={paymentMethod === "giftcard" ? 26 : undefined}
                    className={paymentMethod === "giftcard" ? "font-mono uppercase tracking-wider" : ""}
                  />
                  {paymentMethod === "giftcard" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {transactionId.replace(/-/g, "").length}/22 characters
                    </p>
                  )}
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
