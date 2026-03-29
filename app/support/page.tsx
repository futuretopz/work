"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { User } from "@supabase/supabase-js"
import Link from "next/link"
import { 
  ArrowLeft,
  MessageSquare,
  Send,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
  Loader2,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Profile {
  id: string
  email: string
  username: string
  is_admin: boolean
}

interface Ticket {
  id: string
  user_id: string
  subject: string
  category: string
  status: "open" | "resolved"
  created_at: string
}

interface Message {
  id: string
  ticket_id: string
  sender_id: string
  sender_type: "user" | "admin"
  text: string
  created_at: string
}

const categories = [
  { value: "account", label: "Account Issues" },
  { value: "payment", label: "Payment & Subscription" },
  { value: "playback", label: "Video Playback" },
  { value: "upload", label: "Video Upload" },
  { value: "report", label: "Report Content" },
  { value: "other", label: "Other" },
]

export default function SupportPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [creatingTicket, setCreatingTicket] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      loadTickets()
    }
  }, [user])

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id)
      
      // Subscribe to new messages
      const channel = supabase
        .channel(`ticket-${selectedTicket.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `ticket_id=eq.${selectedTicket.id}`
          },
          () => {
            loadMessages(selectedTicket.id)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedTicket])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user ?? null)
    setLoading(false)
  }

  const loadTickets = async () => {
    if (!user) return

    const { data } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      setTickets(data)
    }
  }

  const loadMessages = async (ticketId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data)
    }
  }

  const handleCreateTicket = async () => {
    if (!selectedCategory || !subject || !description || !user) return

    setCreatingTicket(true)

    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        user_id: user.id,
        subject,
        category: categories.find(c => c.value === selectedCategory)?.label || selectedCategory,
        status: 'open',
      })
      .select()
      .single()

    if (!ticketError && ticket) {
      await supabase
        .from('messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: user.id,
          sender_type: 'user',
          text: description,
        })

      // Create notification
      await fetch('/api/tickets/create-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'ticket_created',
          ticketId: ticket.id,
          subject: subject
        })
      })

      await loadTickets()
      setShowNewTicket(false)
      setSelectedCategory("")
      setSubject("")
      setDescription("")
      setSelectedTicket(ticket)
    }

    setCreatingTicket(false)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !user) return

    setSendingMessage(true)

    const { error } = await supabase
      .from('messages')
      .insert({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        sender_type: 'user',
        text: newMessage,
      })

    if (!error) {
      setNewMessage("")
      await loadMessages(selectedTicket.id)
    }

    setSendingMessage(false)
  }

  const handleCloseTicket = async () => {
    if (!selectedTicket) return

    const { error } = await supabase
      .from('tickets')
      .update({ status: 'resolved' })
      .eq('id', selectedTicket.id)

    if (!error) {
      await loadTickets()
      setSelectedTicket({ ...selectedTicket, status: 'resolved' })
    }
  }

  const getStatusColor = (status: Ticket["status"]) => {
    return status === "open" 
      ? "bg-blue-500/20 text-blue-500 border-blue-500/30"
      : "bg-green-500/20 text-green-500 border-green-500/30"
  }

  const getStatusIcon = (status: Ticket["status"]) => {
    return status === "open" 
      ? <AlertCircle className="h-4 w-4" />
      : <CheckCircle2 className="h-4 w-4" />
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
          <Shield className="h-16 w-16 mx-auto text-purple-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to access support
          </p>
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <Link href="/">Go to Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-4 bg-background px-4 border-b border-border">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">Support</h1>
      </header>

      <main className="pt-14 pb-8">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Support Tickets</h2>
              <p className="text-muted-foreground">Create and manage your support requests</p>
            </div>
            <Button 
              className="gap-2 bg-purple-600 hover:bg-purple-700"
              onClick={() => setShowNewTicket(true)}
            >
              <MessageSquare className="h-4 w-4" />
              New Ticket
            </Button>
          </div>

          {tickets.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-lg">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tickets yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first support ticket to get help
              </p>
              <Button onClick={() => setShowNewTicket(true)} className="bg-purple-600 hover:bg-purple-700">
                Create Ticket
              </Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[350px_1fr] gap-6">
              {/* Tickets List */}
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-4 bg-card border rounded-lg cursor-pointer transition-colors ${
                      selectedTicket?.id === ticket.id 
                        ? "border-purple-500 bg-purple-500/10" 
                        : "border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-muted-foreground">
                        {ticket.id.slice(0, 8)}
                      </span>
                      <Badge variant="outline" className={getStatusColor(ticket.status)}>
                        {getStatusIcon(ticket.status)}
                        <span className="ml-1">{ticket.status === "open" ? "Open" : "Resolved"}</span>
                      </Badge>
                    </div>
                    <p className="font-medium mb-1 line-clamp-2">{ticket.subject}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{ticket.category}</span>
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      <span>{new Date(ticket.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Area */}
              {selectedTicket ? (
                <div className="bg-card border border-border rounded-lg flex flex-col h-[600px]">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{selectedTicket.subject}</h3>
                        <p className="text-sm text-muted-foreground">{selectedTicket.category}</p>
                      </div>
                      {selectedTicket.status === "open" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleCloseTicket}
                          className="text-green-500 border-green-500/30 hover:bg-green-500/10"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark as Resolved
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.sender_type === "user" ? "justify-end" : ""}`}
                      >
                        {message.sender_type === "admin" && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white">
                            <Shield className="h-4 w-4" />
                          </div>
                        )}
                        <div className={`max-w-[70%] ${message.sender_type === "user" ? "order-first" : ""}`}>
                          <div className={`rounded-lg p-3 ${
                            message.sender_type === "user" 
                              ? "bg-purple-600 text-white" 
                              : "bg-muted"
                          }`}>
                            <p className="text-sm">{message.text}</p>
                          </div>
                          <span className="text-xs text-muted-foreground mt-1 block">
                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {message.sender_type === "user" && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                            <UserIcon className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  {selectedTicket.status === "open" && (
                    <div className="p-4 border-t border-border">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && !sendingMessage && handleSendMessage()}
                        />
                        <Button 
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || sendingMessage}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {sendingMessage ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-lg flex items-center justify-center h-[600px]">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Select a ticket to view the conversation</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold">New Support Ticket</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowNewTicket(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input
                  placeholder="Brief description of your issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe your problem in detail..."
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-border">
              <Button variant="outline" onClick={() => setShowNewTicket(false)}>
                Cancel
              </Button>
              <Button 
                className="gap-2 bg-purple-600 hover:bg-purple-700"
                onClick={handleCreateTicket}
                disabled={!selectedCategory || !subject || !description || creatingTicket}
              >
                {creatingTicket ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Create Ticket
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
