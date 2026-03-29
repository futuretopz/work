"use client"

import { useState, useEffect } from "react"
import {
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"

interface VideoInfoProps {
  video: any
  currentUser?: any | null
}

export function VideoInfo({ video, currentUser }: VideoInfoProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [liked, setLiked] = useState<"like" | "dislike" | null>(null)
  const [likeCount, setLikeCount] = useState<number>(video?.likes || 0)
  const [likeLoading, setLikeLoading] = useState(false)
  
  // Check if this is an external video
  const isExternalVideo = video?.id?.startsWith('ext_')

  // Load the current user's existing like state
  useEffect(() => {
    if (!currentUser || !video?.id || isExternalVideo) return
    const checkLike = async () => {
      const { data } = await supabase
        .from('video_likes')
        .select('type')
        .eq('video_id', video.id)
        .eq('user_id', currentUser.id)
        .single()
      if (data) setLiked(data.type as "like" | "dislike")
    }
    checkLike()
  }, [currentUser, video?.id, isExternalVideo])

  const handleLike = async (type: "like" | "dislike") => {
    // Disable likes for external videos
    if (isExternalVideo) return
    if (!currentUser) return
    if (likeLoading) return
    setLikeLoading(true)

    const isToggleOff = liked === type

    // Optimistic update
    const delta = type === "like"
      ? (isToggleOff ? -1 : liked === "like" ? 0 : liked === "dislike" ? 1 : 1)
      : 0

    setLiked(isToggleOff ? null : type)
    setLikeCount((prev) => prev + delta)

    try {
      if (isToggleOff) {
        // Remove like/dislike
        await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', video.id)
          .eq('user_id', currentUser.id)

        if (type === "like") {
          await supabase
            .from('videos')
            .update({ likes: Math.max(0, likeCount - 1) })
            .eq('id', video.id)
        }
      } else {
        // Upsert — replace any previous vote
        await supabase
          .from('video_likes')
          .upsert(
            { video_id: video.id, user_id: currentUser.id, type },
            { onConflict: 'video_id,user_id' }
          )

        if (type === "like") {
          // Increment by 1 (also handles switching from dislike → like)
          const newCount = liked === "dislike" ? likeCount + 1 : likeCount + 1
          await supabase
            .from('videos')
            .update({ likes: newCount })
            .eq('id', video.id)
        } else if (type === "dislike" && liked === "like") {
          // Switching from like → dislike: decrement
          await supabase
            .from('videos')
            .update({ likes: Math.max(0, likeCount - 1) })
            .eq('id', video.id)
        }
      }
    } catch (e) {
      console.error('Like error:', e)
    }

    setLikeLoading(false)
  }

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

  return (
    <div className="flex flex-col gap-3">
      {/* Title */}
      <h1 className="text-xl font-semibold leading-tight">
        {video.title}
      </h1>

      {/* Channel info and actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Channel */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-purple-600">
            <AvatarFallback className="bg-purple-600 text-white">
              {(video.username || 'U')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-medium">{video.username || 'Unknown'}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {video.category}
            </span>
          </div>
          </div>

        {/* Actions — Like / Dislike */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-full bg-secondary">
            <Button
              variant="ghost"
              disabled={likeLoading}
              className={`gap-2 rounded-l-full rounded-r-none border-r border-border px-4 hover:bg-secondary/80 transition-all ${
                liked === "like" ? "text-purple-400" : ""
              }`}
              onClick={() => handleLike("like")}
              title={!currentUser ? "Sign in to like" : "Like"}
            >
              <ThumbsUp
                className={`h-5 w-5 transition-transform active:scale-125 ${
                  liked === "like" ? "fill-current text-purple-400" : ""
                }`}
              />
              <span className="tabular-nums">{likeCount}</span>
            </Button>
            <Button
              variant="ghost"
              disabled={likeLoading}
              className={`rounded-l-none rounded-r-full px-4 hover:bg-secondary/80 transition-all ${
                liked === "dislike" ? "text-red-400" : ""
              }`}
              onClick={() => handleLike("dislike")}
              title={!currentUser ? "Sign in to dislike" : "Dislike"}
            >
              <ThumbsDown
                className={`h-5 w-5 transition-transform active:scale-125 ${
                  liked === "dislike" ? "fill-current text-red-400" : ""
                }`}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Description */}
      <div
        className="cursor-pointer rounded-xl bg-secondary p-3 hover:bg-secondary/80"
        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>{formatViews(video.views || 0)}</span>
          <span>{formatDate(video.created_at)}</span>
        </div>
        <div
          className={`mt-2 text-sm ${
            isDescriptionExpanded ? "" : "line-clamp-2"
          }`}
        >
          <p>
            {video.description || 'No description available.'}
          </p>
        </div>
        {video.description && (
          <Button
            variant="ghost"
            className="mt-2 h-auto p-0 text-sm font-medium hover:bg-transparent"
          >
            {isDescriptionExpanded ? (
              <>Show less <ChevronUp className="ml-1 h-4 w-4" /></>
            ) : (
              <>Show more <ChevronDown className="ml-1 h-4 w-4" /></>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
