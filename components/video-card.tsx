"use client"

import { useState, useRef, useEffect } from "react"
import { MoreVertical, Lock, Crown } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface VideoCardProps {
  video: any
  layout?: "grid" | "horizontal"
  isPremium?: boolean
  currentUser?: any
}

export function VideoCard({ video, layout = "grid", isPremium = false, currentUser = null }: VideoCardProps) {
  const [isHovering, setIsHovering] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hoverStartRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  
  // Check if content should be locked
  const isLocked = !isPremium && currentUser?.id !== video.user_id

  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return

    if (isHovering) {
      // Small delay before starting (feels more natural)
      hoverStartRef.current = setTimeout(() => {
        if (!videoRef.current) return
        videoRef.current.currentTime = 0
        videoRef.current.play().catch(() => {})
        // Stop after 5 seconds
        stopTimeoutRef.current = setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.pause()
          }
        }, 5000)
      }, 300)
    } else {
      // Mouse left: cancel pending timers and pause
      if (hoverStartRef.current) clearTimeout(hoverStartRef.current)
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current)
      if (vid) {
        vid.pause()
        vid.currentTime = 0
      }
    }

    return () => {
      if (hoverStartRef.current) clearTimeout(hoverStartRef.current)
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current)
    }
  }, [isHovering])

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`
    return `${views} views`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  if (layout === "horizontal") {
    return (
      <Link
        href={`/watch/${video.id}`}
        className="group flex gap-2"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-secondary">
          {video.file_path ? (
            <video
              ref={videoRef}
              src={video.file_path}
              className={`h-full w-full object-cover ${isLocked ? 'blur-sm brightness-50' : ''}`}
              muted
              playsInline
              preload="metadata"
              crossOrigin="anonymous"
            />
          ) : video.thumbnail_path ? (
            <img
              src={video.thumbnail_path}
              alt={video.title}
              className={`h-full w-full object-cover transition-transform duration-200 group-hover:scale-105 ${isLocked ? 'blur-sm brightness-50' : ''}`}
            />
          ) : (
            <div className={`h-full w-full bg-gradient-to-br from-purple-900 to-pink-600 flex items-center justify-center ${isLocked ? 'blur-sm brightness-50' : ''}`}>
              <span className="text-4xl">🎬</span>
            </div>
          )}
          
          {/* Premium Lock Overlay */}
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-purple-500/60 bg-black/70 backdrop-blur-sm">
                <Lock className="h-4 w-4 text-purple-400" />
              </div>
            </div>
          )}
          
          {video.duration && video.duration !== '0:00' && (
            <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-xs font-medium text-white">
              {video.duration}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="line-clamp-2 text-sm font-medium leading-tight">
            {video.title}
          </h3>
          <p className="text-xs text-muted-foreground">{video.username || 'Unknown'}</p>
          <p className="text-xs text-muted-foreground">
            {formatViews(video.views || 0)} • {formatDate(video.created_at)}
          </p>
        </div>
      </Link>
    )
  }

  return (
    <Link 
      href={`/watch/${video.id}`} 
      className="group flex flex-col gap-3 w-full max-w-full"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full max-w-full overflow-hidden rounded-xl bg-secondary">
        {video.file_path ? (
          <video
            ref={videoRef}
            src={video.file_path}
            className={`h-full w-full object-cover ${isLocked ? 'blur-sm brightness-50' : ''}`}
            muted
            playsInline
            preload="metadata"
            crossOrigin="anonymous"
          />
        ) : video.thumbnail_path ? (
          <img
            src={video.thumbnail_path}
            alt={video.title}
            className={`h-full w-full object-cover transition-transform duration-200 group-hover:scale-105 ${isLocked ? 'blur-sm brightness-50' : ''}`}
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br from-purple-900 to-pink-600 flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${isLocked ? 'blur-sm brightness-50' : ''}`}>
            <span className="text-6xl">🎬</span>
          </div>
        )}
        
        {/* Premium Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-purple-500/60 bg-black/70 backdrop-blur-sm">
              <Lock className="h-6 w-6 text-purple-400" />
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
              <Crown className="h-3 w-3" />
              Premium
            </div>
          </div>
        )}
        
        {video.duration && video.duration !== '0:00' && (
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
            {video.duration}
          </span>
        )}
      </div>

      {/* Video info */}
      <div className="flex gap-3">
        <Avatar className="h-9 w-9 shrink-0 bg-purple-600">
          <AvatarFallback className="bg-purple-600 text-white">
            {(video.username || 'U')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-sm font-medium leading-tight">
              {video.title}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>{video.username || 'Unknown'}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatViews(video.views || 0)} • {formatDate(video.created_at)}
          </p>
        </div>
      </div>
    </Link>
  )
}
