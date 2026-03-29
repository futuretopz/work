"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Menu, Search, Mic, Video, Bell, User, PlaySquare, HelpCircle, Users, Settings, LogOut, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

interface HeaderProps {
  onMenuClick: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function Header({ onMenuClick, searchQuery, onSearchChange }: HeaderProps) {
  const router = useRouter()
  const [isFocused, setIsFocused] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadUserProfile()
    loadNotifications()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUserProfile()
      loadNotifications()
    })

    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)

    return () => {
      subscription.unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, is_admin')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setUsername(profile.username)
        setIsAdmin(profile.is_admin)
      }
    }
  }

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)
    }
  }

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    loadNotifications()
  }

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)

    loadNotifications()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ticket_created':
      case 'ticket_replied':
      case 'ticket_closed':
        return '🎫'
      case 'payment_approved':
        return '✅'
      case 'payment_rejected':
        return '❌'
      case 'video_uploaded':
        return '🎬'
      default:
        return '🔔'
    }
  }

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const notifDate = new Date(date)
    const diffMs = now.getTime() - notifDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUsername(null)
    setIsAdmin(false)
    setNotifications([])
    setUnreadCount(0)
    router.push('/')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between gap-4 bg-background px-4">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/" className="flex items-center gap-1">
          <div className="flex items-center gap-1">
            <svg
              viewBox="0 0 30 20"
              className="h-5 w-auto"
              fill="currentColor"
            >
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
            <span className="text-sm font-semibold">Kidsplay</span>
          </div>
        </Link>
      </div>

      {/* Center section - Search */}
      <div className="flex max-w-2xl flex-1 items-center justify-center">
        <div className="flex flex-1 items-center">
          <div
            className={`flex flex-1 items-center rounded-l-full border ${
              isFocused ? "border-blue-500 border-r-0" : "border-border"
            } bg-input`}
          >
            {isFocused && (
              <Search className="ml-4 h-4 w-4 text-muted-foreground" />
            )}
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 pl-4"
            />
          </div>
          <Button
            variant="secondary"
            className="h-10 rounded-l-none rounded-r-full border border-l-0 border-border px-6"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1">
        {/* Create Video Button */}
        <Button variant="ghost" size="icon" className="hidden sm:flex" asChild>
          <Link href="/upload">
            <Video className="h-5 w-5" />
          </Link>
        </Button>

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-yt-red text-[10px] font-medium text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-medium">Notifications</span>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-purple-500 hover:text-purple-400"
                  onClick={markAllAsRead}
                >
                  Mark all as read
                </Button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id} 
                    className="flex items-start gap-3 p-4 cursor-pointer"
                    onClick={() => {
                      markAsRead(notification.id)
                      if (notification.link) {
                        window.location.href = notification.link
                      }
                    }}
                  >
                    <div className="text-2xl shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-tight">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(notification.created_at)}</p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-purple-500 mt-2 shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-medium text-white">
                <User className="h-4 w-4" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-sm font-medium text-white">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{username || "User"}</p>
                <p className="text-sm text-muted-foreground truncate">@{username || "user"}</p>
              </div>
            </div>
            <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer" asChild>
              <Link href="/channel">
                <PlaySquare className="h-5 w-5" />
                <span>My channel</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer" asChild>
              <Link href="/subscriptions">
                <Users className="h-5 w-5" />
                <span>My subscriptions</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer" asChild>
              <Link href="/support">
                <HelpCircle className="h-5 w-5" />
                <span>Support</span>
              </Link>
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer" asChild>
                  <Link href="/realgngcreatorofcp">
                    <Shield className="h-5 w-5" />
                    <span>Admin Dashboard</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="flex items-center gap-3 p-3 cursor-pointer text-red-500"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
