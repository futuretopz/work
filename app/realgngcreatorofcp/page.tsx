"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LogIn,
  Loader2,
  MessageSquare,
  User as UserIcon,
  Send,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Shield,
  Search,
  Trash2,
  Ban,
  Video,
  AlertTriangle,
  Eye,
  ShoppingCart,
  Check,
  X,
  CreditCard,
} from "lucide-react"
import Link from "next/link"

interface Profile {
  id: string
  email: string
  username: string
  is_admin: boolean
  is_banned?: boolean
}

interface Ticket {
  id: string
  user_id: string
  subject: string
  category: string
  status: "open" | "resolved"
  created_at: string
  profiles: Profile
}

interface Message {
  id: string
  ticket_id: string
  sender_id: string
  sender_type: "user" | "admin"
  text: string
  created_at: string
  profiles: Profile
}

interface VideoItem {
  id: string
  title: string
  user_id: string
  created_at: string
  views: number
  category: string
  file_path: string
  thumbnail_path: string
  username?: string
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState("")

  // Tickets state
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)

  // Videos state
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [videoSearch, setVideoSearch] = useState("")
  const [videosLoading, setVideosLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "ban" | "delete_and_ban"
    video: VideoItem
  } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => { checkAuth() }, [])

  useEffect(() => {
    if (profile?.is_admin) {
      loadTickets()
      loadVideos()
    }
  }, [profile])

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id)
      const channel = supabase
        .channel(`ticket-${selectedTicket.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `ticket_id=eq.${selectedTicket.id}` },
          () => { loadMessages(selectedTicket.id) })
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    }
  }, [selectedTicket])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user ?? null)
    if (session?.user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(data)
    }
    setLoading(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setError("")
    const email = `${username}@kidsplay.local`
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError("Invalid credentials")
    } else {
      await checkAuth()
    }
    setAuthLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  // ── Tickets ──────────────────────────────────────────────
  const loadTickets = async () => {
    const { data } = await supabase
      .from('tickets')
      .select(`*, profiles (*)`)
      .order('created_at', { ascending: false })
    if (data) setTickets(data as any)
  }

  const loadMessages = async (ticketId: string) => {
    const { data } = await supabase
      .from('messages')
      .select(`*, profiles (*)`)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
    if (data) setMessages(data as any)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !user) return
    setSendingMessage(true)
    const { error } = await supabase.from('messages').insert({
      ticket_id: selectedTicket.id,
      sender_id: user.id,
      sender_type: 'admin',
      text: newMessage,
    })
    if (!error) {
      await fetch('/api/tickets/create-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedTicket.user_id, type: 'ticket_replied', ticketId: selectedTicket.id, subject: selectedTicket.subject })
      })
      setNewMessage("")
      await loadMessages(selectedTicket.id)
    }
    setSendingMessage(false)
  }

  const handleResolveTicket = async () => {
    if (!selectedTicket) return
    const { error } = await supabase.from('tickets').update({ status: 'resolved' }).eq('id', selectedTicket.id)
    if (!error) {
      await fetch('/api/tickets/create-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedTicket.user_id, type: 'ticket_closed', ticketId: selectedTicket.id, subject: selectedTicket.subject })
      })
      await loadTickets()
      setSelectedTicket({ ...selectedTicket, status: 'resolved' })
    }
  }

  // ── Videos ───────────────────────────────────────────────
  const loadVideos = async () => {
    setVideosLoading(true)
    const { data: videosData } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })

    if (!videosData) { setVideosLoading(false); return }

    const userIds = [...new Set(videosData.map((v: any) => v.user_id))]
    const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', userIds)
    const profileMap: Record<string, string> = {}
    profiles?.forEach((p: any) => { profileMap[p.id] = p.username })

    setVideos(videosData.map((v: any) => ({ ...v, username: profileMap[v.user_id] || 'Unknown' })))
    setVideosLoading(false)
  }

  const filteredVideos = videos.filter((v) =>
    v.title?.toLowerCase().includes(videoSearch.toLowerCase()) ||
    v.username?.toLowerCase().includes(videoSearch.toLowerCase())
  )

  const handleDeleteVideo = async (video: VideoItem) => {
    setActionLoading(true)
    try {
      // Delete from storage if path exists
      if (video.file_path) {
        const filePath = video.file_path.split('/storage/v1/object/public/videos/')[1]
        // Silence errors if file missing from storage (still want to delete DB record)
        if (filePath) await supabase.storage.from('videos').remove([filePath])
      }
      if (video.thumbnail_path) {
        const thumbPath = video.thumbnail_path.split('/storage/v1/object/public/thumbnails/')[1]
        if (thumbPath) await supabase.storage.from('thumbnails').remove([thumbPath])
      }
      // Delete from DB
      const { error, count } = await supabase
        .from('videos')
        .delete({ count: 'exact' })
        .eq('id', video.id)

      if (error) throw error
      if (count === 0) throw new Error("Video not found or permission denied (check RLS policies).")

      setActionResult({ success: true, message: `Video "${video.title}" deleted successfully (ID: ${video.id}).` })
      await loadVideos()
    } catch (e: any) {
      setActionResult({ success: false, message: `Error: ${e.message}` })
    }
    setActionLoading(false)
    setConfirmAction(null)
  }

  const handleBanUser = async (video: VideoItem) => {
    setActionLoading(true)
    try {
      const { error, count } = await supabase
        .from('profiles')
        .update({ is_banned: true, ban_reason: `Banned by admin for inappropriate content (video: "${video.title}")` }, { count: 'exact' })
        .eq('id', video.user_id)

      if (error) throw error
      if (count === 0) throw new Error("User profile not found or permission denied (check RLS policies).")

      setActionResult({ success: true, message: `User "${video.username}" has been banned successfully.` })
    } catch (e: any) {
      setActionResult({ success: false, message: `Error: ${e.message}` })
    }
    setActionLoading(false)
    setConfirmAction(null)
  }

  const handleDeleteAndBan = async (video: VideoItem) => {
    setActionLoading(true)
    try {
      // 1. Delete video storage
      if (video.file_path) {
        const filePath = video.file_path.split('/storage/v1/object/public/videos/')[1]
        if (filePath) await supabase.storage.from('videos').remove([filePath])
      }
      if (video.thumbnail_path) {
        const thumbPath = video.thumbnail_path.split('/storage/v1/object/public/thumbnails/')[1]
        if (thumbPath) await supabase.storage.from('thumbnails').remove([thumbPath])
      }

      // 2. Delete video DB
      const { error: vError, count: vCount } = await supabase
        .from('videos')
        .delete({ count: 'exact' })
        .eq('id', video.id)
      
      if (vError) throw vError

      // 3. Ban user
      const { error: bError, count: bCount } = await supabase
        .from('profiles')
        .update({ 
          is_banned: true, 
          ban_reason: `BANNED: Video "${video.title}" was deleted by admin for inappropriate content.` 
        }, { count: 'exact' })
        .eq('id', video.user_id)
      
      if (bError) throw bError

      if (vCount === 0 && bCount === 0) {
        throw new Error("No video or profile updated. This usually means a permission (RLS) issue.")
      }

      setActionResult({ 
        success: true, 
        message: `Video deleted (${vCount}) and user "${video.username}" banned (${bCount}).` 
      })
      await loadVideos()
    } catch (e: any) {
      setActionResult({ success: false, message: `Error: ${e.message}` })
    }
    setActionLoading(false)
    setConfirmAction(null)
  }

  const executeAction = async () => {
    if (!confirmAction) return
    if (confirmAction.type === "delete") await handleDeleteVideo(confirmAction.video)
    else if (confirmAction.type === "ban") await handleBanUser(confirmAction.video)
    else if (confirmAction.type === "delete_and_ban") await handleDeleteAndBan(confirmAction.video)
  }

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-purple-500" />
              <span className="text-2xl font-bold">Admin Access</span>
            </div>
            <p className="text-muted-foreground">Sign in with admin credentials</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input type="text" placeholder="Admin username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input type="password" placeholder="Enter admin password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && <div className="text-sm p-3 rounded-lg bg-red-500/10 text-red-500">{error}</div>}
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={authLoading}>
                {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogIn className="h-4 w-4 mr-2" />Sign In</>}
              </Button>
            </form>
          </div>
          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-purple-500 hover:text-purple-400">Back to Home</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!profile.is_admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You don't have admin privileges</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
            <Button asChild><Link href="/">Go Home</Link></Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between bg-background px-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-purple-500" />
          <h1 className="text-lg font-semibold">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{profile.email}</span>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />Sign Out
          </Button>
        </div>
      </header>

      <main className="pt-14">
        <div className="max-w-7xl mx-auto p-6">
          <Tabs defaultValue="tickets" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="tickets" className="gap-2">
                <MessageSquare className="h-4 w-4" />Support Tickets
              </TabsTrigger>
              <TabsTrigger value="videos" className="gap-2">
                <Video className="h-4 w-4" />Videos
              </TabsTrigger>
            </TabsList>

            {/* ── TICKETS TAB ── */}
            <TabsContent value="tickets">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Support Tickets</h2>
                <p className="text-muted-foreground">Manage and respond to user support requests</p>
              </div>

              {tickets.length === 0 ? (
                <div className="text-center py-16 bg-card border border-border rounded-lg">
                  <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tickets yet</h3>
                  <p className="text-muted-foreground">Tickets will appear here when users create them</p>
                </div>
              ) : (
                <div className="grid lg:grid-cols-[400px_1fr] gap-6">
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`p-4 bg-card border rounded-lg cursor-pointer transition-colors ${
                          selectedTicket?.id === ticket.id ? "border-purple-500 bg-purple-500/10" : "border-border hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{ticket.profiles.username}</span>
                          </div>
                          <Badge variant="outline" className={ticket.status === "open" ? "bg-blue-500/20 text-blue-500 border-blue-500/30" : "bg-green-500/20 text-green-500 border-green-500/30"}>
                            {ticket.status === "open" ? <><AlertCircle className="h-3 w-3 mr-1" />Open</> : <><CheckCircle2 className="h-3 w-3 mr-1" />Resolved</>}
                          </Badge>
                        </div>
                        <p className="font-medium mb-1 line-clamp-2">{ticket.subject}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{ticket.category}</span>
                          <span>•</span>
                          <span>{new Date(ticket.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedTicket ? (
                    <div className="bg-card border border-border rounded-lg flex flex-col h-[700px]">
                      <div className="p-4 border-b border-border">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{selectedTicket.subject}</h3>
                            <p className="text-sm text-muted-foreground">{selectedTicket.profiles.username} • {selectedTicket.category}</p>
                          </div>
                          {selectedTicket.status === "open" && (
                            <Button variant="outline" size="sm" onClick={handleResolveTicket} className="text-green-500 border-green-500/30 hover:bg-green-500/10">
                              <CheckCircle2 className="h-4 w-4 mr-2" />Mark as Resolved
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => (
                          <div key={message.id} className={`flex gap-3 ${message.sender_type === "admin" ? "justify-end" : ""}`}>
                            {message.sender_type === "user" && (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                                <UserIcon className="h-4 w-4" />
                              </div>
                            )}
                            <div className={`max-w-[70%] ${message.sender_type === "admin" ? "order-first" : ""}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium">{message.sender_type === "admin" ? "Admin" : message.profiles.username}</span>
                                <span className="text-xs text-muted-foreground">{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div className={`rounded-lg p-3 ${message.sender_type === "admin" ? "bg-purple-600 text-white" : "bg-muted"}`}>
                                <p className="text-sm">{message.text}</p>
                              </div>
                            </div>
                            {message.sender_type === "admin" && (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white">
                                <Shield className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {selectedTicket.status === "open" && (
                        <div className="p-4 border-t border-border">
                          <div className="flex gap-2">
                            <Input placeholder="Type your response..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === "Enter" && !sendingMessage && handleSendMessage()} />
                            <Button onClick={handleSendMessage} disabled={!newMessage.trim() || sendingMessage} className="bg-purple-600 hover:bg-purple-700">
                              {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-card border border-border rounded-lg flex items-center justify-center h-[700px]">
                      <div className="text-center">
                        <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Select a ticket to view the conversation</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* ── VIDEOS TAB ── */}
            <TabsContent value="videos">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Video Management</h2>
                <p className="text-muted-foreground">Search, delete videos and ban users</p>
              </div>

              {/* Action result toast */}
              {actionResult && (
                <div className={`mb-4 flex items-center gap-3 p-4 rounded-lg border ${actionResult.success ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-red-500/10 border-red-500/30 text-red-500"}`}>
                  {actionResult.success ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
                  <span className="text-sm font-medium flex-1">{actionResult.message}</span>
                  <button onClick={() => setActionResult(null)} className="text-xs opacity-60 hover:opacity-100">✕</button>
                </div>
              )}

              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by video title or username..."
                  value={videoSearch}
                  onChange={(e) => setVideoSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {videosLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              ) : filteredVideos.length === 0 ? (
                <div className="text-center py-16 bg-card border border-border rounded-lg">
                  <Video className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No videos found</h3>
                  <p className="text-muted-foreground">Try a different search term</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredVideos.map((video) => (
                    <div key={video.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg">
                      {/* Thumbnail */}
                      <div className="w-28 h-16 shrink-0 rounded-lg overflow-hidden bg-secondary">
                        {video.thumbnail_path ? (
                          <img src={video.thumbnail_path} alt={video.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-900 to-pink-600 flex items-center justify-center">
                            <Video className="h-6 w-6 text-white/50" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{video.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <UserIcon className="h-3 w-3" />
                          <span>{video.username}</span>
                          <span>•</span>
                          <span>{video.views || 0} views</span>
                          <span>•</span>
                          <span>{new Date(video.created_at).toLocaleDateString()}</span>
                          {video.category && (
                            <><span>•</span><Badge variant="secondary" className="text-xs">{video.category}</Badge></>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          asChild
                        >
                          <Link href={`/watch/${video.id}`} target="_blank">
                            <Eye className="h-3.5 w-3.5" />
                            Show
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-red-500 border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                          onClick={() => setConfirmAction({ type: "delete", video })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-orange-500 border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-400"
                          onClick={() => setConfirmAction({ type: "ban", video })}
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Ban User
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1.5 bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => setConfirmAction({ type: "delete_and_ban", video })}
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Delete & Ban
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {confirmAction.type === "delete" && "Delete Video"}
                  {confirmAction.type === "ban" && "Ban User"}
                  {confirmAction.type === "delete_and_ban" && "Delete Video & Ban User"}
                </h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-3 mb-6 text-sm">
              <p className="font-medium truncate">📹 {confirmAction.video.title}</p>
              <p className="text-muted-foreground mt-1">👤 @{confirmAction.video.username}</p>
              {confirmAction.type !== "delete" && (
                <p className="text-orange-500 mt-2 text-xs">⚠️ The user will be banned and will see a ban message when they try to log in.</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmAction(null)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={executeAction}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
