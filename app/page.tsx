"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { User } from "@supabase/supabase-js"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { CategoryChips } from "@/components/category-chips"
import { VideoGrid } from "@/components/video-grid"
import { Pagination } from "@/components/pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LogIn, UserPlus, Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [videos, setVideos] = useState<any[]>([])
  const [videosLoading, setVideosLoading] = useState(false)
  const [captchaText, setCaptchaText] = useState("")
  const [captchaInput, setCaptchaInput] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalVideos, setTotalVideos] = useState(0)
  const [isPremium, setIsPremium] = useState(false)

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCaptchaText(result)
    setCaptchaInput("")
  }

  useEffect(() => {
    if (!user) generateCaptcha()
  }, [user, authMode])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) {
        checkPremiumStatus(session.user.id)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        checkPremiumStatus(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkPremiumStatus = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, premium_expires_at')
      .eq('id', userId)
      .single()

    if (profile?.is_premium) {
      if (profile.premium_expires_at) {
        const expiresAt = new Date(profile.premium_expires_at)
        setIsPremium(expiresAt > new Date())
      } else {
        setIsPremium(true)
      }
    }
  }

  useEffect(() => {
    if (user) {
      setCurrentPage(1) // Reset to page 1 when category changes
      loadVideos()
    }
  }, [user, selectedCategory])

  useEffect(() => {
    if (user) {
      loadVideos()
    }
  }, [currentPage])

  const loadVideos = async () => {
    setVideosLoading(true)
    
    const params = new URLSearchParams()
    if (selectedCategory !== 'All') {
      params.append('category', selectedCategory)
    }
    params.append('page', currentPage.toString())
    params.append('limit', '30')

    const response = await fetch(`/api/videos/list?${params}`)
    const data = await response.json()
    
    if (data.videos) {
      setVideos(data.videos)
    }
    
    if (data.pagination) {
      setTotalPages(data.pagination.totalPages)
      setTotalVideos(data.pagination.total)
    }
    
    setVideosLoading(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    if (captchaInput.toUpperCase() !== captchaText.toUpperCase()) {
      setError("Incorrect captcha. Please try again.")
      generateCaptcha()
      setAuthLoading(false)
      return
    }

    const email = `${username}@kidsplay.local`

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError("Invalid username or password")
      generateCaptcha()
      setAuthLoading(false)
      return
    }

    // Check if user is banned
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_banned, ban_reason')
        .eq('id', data.user.id)
        .single()

      if (profile?.is_banned === true) {
        await supabase.auth.signOut()
        setError(`BANNED: ${profile.ban_reason || 'Your account has been banned from this platform.'}`)
        generateCaptcha()
        setAuthLoading(false)
        return
      }
    }

    setAuthLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setError("")

    if (captchaInput.toUpperCase() !== captchaText.toUpperCase()) {
      setError("Incorrect captcha. Please try again.")
      generateCaptcha()
      setAuthLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setAuthLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setAuthLoading(false)
      return
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters")
      setAuthLoading(false)
      return
    }

    const email = `${username}@kidsplay.local`

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
        emailRedirectTo: undefined,
      },
    })

    if (error) {
      if (error.message.includes("already registered")) {
        setError("Username already taken")
      } else {
        setError(error.message)
      }
    } else {
      await supabase.auth.signInWithPassword({
        email,
        password,
      })
    }

    setAuthLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

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
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-4 mb-4">
              <svg viewBox="0 0 30 20" className="h-12 w-auto" fill="currentColor">
                <g>
                  <path
                    d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 2.24288e-07 14.285 0 14.285 0C14.285 0 5.35042 2.24288e-07 3.12323 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C2.24288e-07 5.35042 0 10 0 10C0 10 2.24288e-07 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12323 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5677 5.35042 27.9727 3.12324Z"
                    fill="#B794F4"
                  />
                  <path
                    d="M11.4253 14.2854L18.8477 10.0004L11.4253 5.71533V14.2854Z"
                    fill="white"
                  />
                </g>
              </svg>
              <h1 className="text-3xl font-black tracking-tight text-white italic">
                Kidsplay
              </h1>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {authMode === "login" ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-muted-foreground">
              {authMode === "login" 
                ? "Sign in to continue to Kidsplay" 
                : "Join Kidsplay today"}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <form onSubmit={authMode === "login" ? handleLogin : handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input
                  type="text"
                  placeholder={authMode === "login" ? "Enter your username" : "Choose a username"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {authMode === "register" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              )}

              {/* Captcha Section */}
              <div className="space-y-3">
                <div className="relative">
                  <div className="flex items-center justify-center gap-3 p-4 bg-black/40 border border-border rounded-xl  relative overflow-hidden select-none font-mono">
                    {/* Noise lines */}
                    <div className="absolute inset-0 pointer-events-none opacity-20">
                      <div className="absolute top-1/4 left-0 w-full h-[1px] bg-red-500 rotate-2" />
                      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-purple-500 -rotate-3" />
                      <div className="absolute top-3/4 left-0 w-full h-[1px] bg-pink-500 rotate-1" />
                    </div>
                    
                    {captchaText.split('').map((char, index) => (
                      <span
                        key={index}
                        className="text-2xl font-black italic tracking-widest"
                        style={{
                          transform: `rotate(${((index * 45) % 30) - 15}deg) translateY(${index % 2 === 0 ? '2px' : '-2px'})`,
                          color: index % 3 === 0 ? "#ef4444" : index % 3 === 1 ? "#ec4899" : "#ffffff",
                          textShadow: "2px 2px 0px rgba(0,0,0,0.5)"
                        }}
                      >
                        {char}
                      </span>
                    ))}
                    
                    <button 
                      type="button"
                      onClick={generateCaptcha}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-300 group"
                      title="New Code"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-muted-foreground group-hover:text-white group-hover:rotate-180 transition-all duration-500" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Input 
                    placeholder="Enter security code" 
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    className="text-center tracking-[0.2em] font-bold uppercase"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className={`text-sm p-3 rounded-lg ${
                  error.startsWith("BANNED:")
                    ? "bg-red-900/30 border border-red-500/50 text-red-400"
                    : error.includes("Check your email")
                    ? "bg-green-500/10 text-green-500"
                    : "bg-red-500/10 text-red-500"
                }`}>
                  {error.startsWith("BANNED:") ? (
                    <div className="space-y-1">
                      <p className="font-bold text-red-400 flex items-center gap-2">
                        🔨 Account Banned
                      </p>
                      <p className="text-xs text-red-400/80">
                        {error.replace("BANNED: ", "")}
                      </p>
                      <p className="text-xs text-red-400/60 mt-2">
                        If you believe this is a mistake, contact support.
                      </p>
                    </div>
                  ) : (
                    error
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={authLoading}
              >
                {authLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : authMode === "login" ? (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login")
                  setError("")
                }}
                className="text-sm text-purple-500 hover:text-purple-400"
              >
                {authMode === "login" 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
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
          <div className="sticky top-14 z-30 border-b border-border bg-background px-4 py-3">
            <CategoryChips
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>
          
          <div className="p-6">
            {videosLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : (
              <>
                <VideoGrid videos={filteredVideos} isPremium={isPremium} currentUser={user} />
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    setCurrentPage(page)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
