"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { User } from "@supabase/supabase-js"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Loader2, Zap, Check, MessageCircle } from "lucide-react"
import Link from "next/link"

const tiers = [
  {
    name: "Tier 1",
    price: 24,
    period: "/LTB",
    features: [
      "Teens, Young, Incest",
    ],
    totalSize: "46.47 GB",
    contains: "45 folders, 643 files",
    gradient: "from-purple-600 to-pink-600"
  },
  {
    name: "Tier 2",
    price: 34,
    period: "/LTB",
    features: [
      "Free Access to Tier 1",
      "Teens, Young, Incest, Rape, Abuse",
    ],
    totalSize: "95.82 GB",
    contains: "90 folders, 4148 files",
    gradient: "from-purple-600 to-pink-600"
  },
  {
    name: "Tier 3",
    price: 49,
    period: "/LTB",
    features: [
      "Free Access to Tier 2, Tier 1",
      "Incest, Pedo, Abuse, Girls",
    ],
    totalSize: "202.89 GB",
    contains: "228 folders, 17186 files",
    gradient: "from-purple-600 to-pink-600"
  },
  {
    name: "Tier 4",
    price: 89,
    period: "/LTB",
    features: [
      "Free Access to Tier 3, Tier 2, Tier 1",
      "Incest, Rape, Abuse, Girls, Boys",
    ],
    totalSize: "1.09 TB",
    contains: "2724 folders, 74254 files",
    gradient: "from-purple-600 to-pink-600"
  },
  {
    name: "Tier 5",
    price: 119,
    period: "/LTB",
    features: [
      "Free Access to Tier 4, Tier 3, Tier 2, Tier 1",
      "Rape, Boys, Girls, Young, Incest, Pedo",
    ],
    totalSize: "1.86 TB",
    contains: "3819 folders, 171147 files",
    gradient: "from-purple-600 to-pink-600"
  },
  {
    name: "Tier 6",
    price: 149,
    period: "/LTB",
    features: [
      "High quality content longer and new videos with good collection",
      "VIP Group",
    ],
    totalSize: "3.05 TB",
    contains: "2471 folders, 24701 files",
    gradient: "from-purple-600 to-pink-600"
  },
  {
    name: "VIP 2",
    price: 149,
    period: "/LTB",
    features: [
      "Free Access to VIP 1",
      "High quality content longer and new videos with good collection",
      "VIP Group",
    ],
    totalSize: "4.63 TB",
    contains: "11629 folders, 145313 files",
    gradient: "from-purple-600 to-pink-600"
  },
  {
    name: "VIP 3",
    price: 299,
    period: "/LTB",
    features: [
      "Free Access to VIP 2, VIP 1",
      "High quality content longer and new videos with good collection",
      "VIP Group",
    ],
    totalSize: "9.74 TB",
    contains: "11629 folders, 456313 files",
    gradient: "from-purple-600 to-pink-600"
  },
  {
    name: "VIP 4",
    price: 399,
    period: "/LTB",
    features: [
      "Free Access to VIP 3, VIP 2, VIP 1",
      "High quality content longer and new videos with good collection",
      "VIP Group",
    ],
    totalSize: "7.61 TB",
    contains: "13444 folders, 627460 files",
    gradient: "from-purple-600 to-pink-600"
  },
]

const extraTiers = [
  {
    name: "Teens",
    price: 34,
    period: "/ 50 GB",
    features: [
      "1000+ Videos",
      "Teens (9-17) Folder",
    ],
    gradient: "from-pink-600 to-purple-600"
  },
  {
    name: "Incest",
    price: 34,
    period: "/ 40 GB",
    features: [
      "600+ Videos",
      "Family Incest/Mom Son Folder",
    ],
    gradient: "from-pink-600 to-purple-600"
  },
  {
    name: "Baby",
    price: 49,
    period: "/ 1 GB",
    features: [
      "90+ Videos",
      "Babies/Toddlers Folder",
    ],
    gradient: "from-pink-600 to-purple-600"
  },
  {
    name: "Blacks",
    price: 49,
    period: "/ 11 GB",
    features: [
      "100+ Videos",
      "Blacks Folder",
    ],
    gradient: "from-pink-600 to-purple-600"
  },
  {
    name: "Boys",
    price: 74,
    period: "/ 13 GB",
    features: [
      "500+ Videos",
      "Boys Gay CP Folder",
    ],
    gradient: "from-pink-600 to-purple-600"
  },
  {
    name: "Extreme",
    price: 99,
    period: "",
    features: [
      "80+ Videos",
      "Hardcore/BDSM/Rape Folder",
    ],
    gradient: "from-pink-600 to-purple-600"
  },
]

export default function MegaPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"basic" | "premium" | "extras">("basic")

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setLoading(false)
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Zap className="h-16 w-16 mx-auto text-purple-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in required</h1>
          <p className="text-muted-foreground">Please sign in to access MEGA</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      <div className="flex flex-1 pt-14">
        <Sidebar isOpen={isSidebarOpen} />
        
        <main className="flex-1 lg:ml-60">
          <div className="p-6">
            {/* Tabs */}
            <div className="mb-8 flex items-center justify-center gap-2">
              <Button
                variant={activeTab === "basic" ? "default" : "outline"}
                onClick={() => setActiveTab("basic")}
                className={activeTab === "basic" ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                Basic
              </Button>
              <Button
                variant={activeTab === "premium" ? "default" : "outline"}
                onClick={() => setActiveTab("premium")}
                className={activeTab === "premium" ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                Premium
              </Button>
              <Button
                variant={activeTab === "extras" ? "default" : "outline"}
                onClick={() => setActiveTab("extras")}
                className={activeTab === "extras" ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                Extras
              </Button>
            </div>

            {/* Basic Tiers (1-5) */}
            {activeTab === "basic" && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {tiers.slice(0, 5).map((tier, idx) => (
                  <div key={tier.name} className="bg-card border border-border rounded-lg p-4 flex flex-col">
                    <h3 className="text-lg font-bold mb-1">{tier.name}</h3>
                    <div className="mb-3">
                      <span className="text-2xl font-bold text-purple-500">${tier.price}</span>
                      <span className="text-xs text-muted-foreground ml-1">{tier.period}</span>
                    </div>
                    
                    <div className="space-y-1.5 mb-4 flex-1">
                      {tier.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs">
                          <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                          <span className="leading-tight">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5 mb-4 text-xs">
                      <div>
                        <span className="font-semibold">Total size</span>
                        <p className="text-muted-foreground">{tier.totalSize}</p>
                      </div>
                      <div>
                        <span className="font-semibold">Contains</span>
                        <p className="text-muted-foreground">{tier.contains}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button size="sm" className={`bg-gradient-to-r ${tier.gradient} hover:opacity-90`} asChild>
                        <Link href={`/mega/checkout/tier${idx + 1}`}>Buy Now</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://t.me/neargangsta" target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Contact
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Premium Tiers (6, VIP 2-4) */}
            {activeTab === "premium" && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tiers.slice(5).map((tier) => {
                  const tierSlug = tier.name === "Tier 6" ? "tier6" : tier.name.toLowerCase().replace(" ", "")
                  return (
                    <div key={tier.name} className="bg-card border border-border rounded-lg p-4 flex flex-col">
                      <h3 className="text-lg font-bold mb-1">{tier.name}</h3>
                      <div className="mb-3">
                        <span className="text-2xl font-bold text-purple-500">${tier.price}</span>
                        <span className="text-xs text-muted-foreground ml-1">{tier.period}</span>
                      </div>
                      
                      <div className="space-y-1.5 mb-4 flex-1">
                        {tier.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-xs">
                            <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                            <span className="leading-tight">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1.5 mb-4 text-xs">
                        <div>
                          <span className="font-semibold">Total size</span>
                          <p className="text-muted-foreground">{tier.totalSize}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Contains</span>
                          <p className="text-muted-foreground">{tier.contains}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button size="sm" className={`bg-gradient-to-r ${tier.gradient} hover:opacity-90`} asChild>
                          <Link href={`/mega/checkout/${tierSlug}`}>Buy Now</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href="https://t.me/neargangsta" target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Contact
                          </a>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Extras */}
            {activeTab === "extras" && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {extraTiers.map((tier) => (
                  <div key={tier.name} className="bg-card border border-border rounded-lg p-4 flex flex-col">
                    <h3 className="text-lg font-bold mb-1">{tier.name}</h3>
                    <div className="mb-3">
                      <span className="text-2xl font-bold text-pink-500">${tier.price}</span>
                      <span className="text-xs text-muted-foreground ml-1">{tier.period}</span>
                    </div>
                    
                    <div className="space-y-1.5 mb-4 flex-1">
                      {tier.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs">
                          <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                          <span className="leading-tight">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button size="sm" className={`bg-gradient-to-r ${tier.gradient} hover:opacity-90`} asChild>
                        <Link href={`/mega/checkout/${tier.name.toLowerCase()}`}>Buy Now</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://t.me/neargangsta" target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Contact
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
