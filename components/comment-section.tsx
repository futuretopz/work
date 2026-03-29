"use client"

import { useState, useEffect, useCallback } from "react"
import { ThumbsUp, ThumbsDown, Lock, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

interface CommentSectionProps {
  videoId: string
  isPremium: boolean
  currentUser: any | null
}

interface Comment {
  id: string
  user_id: string
  video_id: string
  content: string
  created_at: string
  likes: number
  username?: string
  userLike?: "like" | "dislike" | null
}

export function CommentSection({ videoId, isPremium, currentUser }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  
  // Check if this is an external video
  const isExternalVideo = videoId.startsWith('ext_')

  const loadComments = useCallback(async () => {
    // Don't load comments for external videos
    if (isExternalVideo) {
      setComments([])
      setLoadingComments(false)
      return
    }
    
    setLoadingComments(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false })

      if (error || !data || data.length === 0) {
        setComments([])
        setLoadingComments(false)
        return
      }

      // Fetch usernames
      const userIds = [...new Set(data.map((c: any) => c.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds)

      const profileMap: Record<string, string> = {}
      profiles?.forEach((p: any) => { profileMap[p.id] = p.username })

      // Fetch user's own comment likes if logged in
      let likeMap: Record<string, "like" | "dislike"> = {}
      if (currentUser) {
        const commentIds = data.map((c: any) => c.id)
        const { data: userLikes } = await supabase
          .from('comment_likes')
          .select('comment_id, type')
          .eq('user_id', currentUser.id)
          .in('comment_id', commentIds)
        userLikes?.forEach((l: any) => { likeMap[l.comment_id] = l.type })
      }

      const enriched = data.map((c: any) => ({
        ...c,
        likes: c.likes ?? 0,
        username: profileMap[c.user_id] || 'Unknown',
        userLike: likeMap[c.id] ?? null,
      }))

      setComments(enriched)
    } catch (e) {
      setComments([])
    }
    setLoadingComments(false)
  }, [videoId, currentUser])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handleCommentLike = async (comment: Comment, type: "like" | "dislike") => {
    if (!currentUser) return

    const isToggleOff = comment.userLike === type

    // Optimistic update
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== comment.id) return c
        let newLikes = c.likes
        if (type === "like") {
          if (isToggleOff) newLikes = Math.max(0, newLikes - 1)          // un-like
          else if (c.userLike === "dislike") newLikes = newLikes + 1     // dislike → like
          else newLikes = newLikes + 1                                    // fresh like
        } else {
          if (c.userLike === "like") newLikes = Math.max(0, newLikes - 1) // like → dislike removes like
        }
        return { ...c, likes: newLikes, userLike: isToggleOff ? null : type }
      })
    )

    try {
      if (isToggleOff) {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', currentUser.id)

        if (type === "like") {
          await supabase
            .from('comments')
            .update({ likes: Math.max(0, comment.likes - 1) })
            .eq('id', comment.id)
        }
      } else {
        await supabase
          .from('comment_likes')
          .upsert(
            { comment_id: comment.id, user_id: currentUser.id, type },
            { onConflict: 'comment_id,user_id' }
          )

        let newDbLikes = comment.likes
        if (type === "like") {
          newDbLikes = comment.userLike === "dislike" ? comment.likes + 1 : comment.likes + 1
        } else if (type === "dislike" && comment.userLike === "like") {
          newDbLikes = Math.max(0, comment.likes - 1)
        }

        await supabase
          .from('comments')
          .update({ likes: newDbLikes })
          .eq('id', comment.id)
      }
    } catch (e) {
      console.error('Comment like error:', e)
      // Revert on failure
      await loadComments()
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUser || submitting) return
    setSubmitting(true)
    try {
      const { error } = await supabase.from('comments').insert({
        video_id: videoId,
        user_id: currentUser.id,
        content: newComment.trim(),
        likes: 0,
      })
      if (!error) {
        setNewComment("")
        setIsFocused(false)
        await loadComments()
      }
    } catch (e) {
      console.error('Error submitting comment:', e)
    }
    setSubmitting(false)
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
    return `${Math.floor(diffDays / 30)} months ago`
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <span className="text-xl font-semibold">
          {loadingComments ? '...' : comments.length} comments
        </span>
      </div>

      {/* External video notice */}
      {isExternalVideo ? (
        <div className="relative overflow-hidden rounded-xl border border-border bg-secondary/40 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <div>
                <p className="text-sm font-semibold mb-1">
                  Comments not available
                </p>
                <p className="text-xs text-muted-foreground">
                  Comments are not available for this video
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Comment input area */}
          {isPremium && currentUser ? (
            <div className="flex gap-3">
              <Avatar className="h-10 w-10 shrink-0 bg-purple-600">
                <AvatarFallback className="bg-purple-600 text-white">
                  {(currentUser.email?.[0] || 'U').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  rows={isFocused ? 3 : 1}
                  className="resize-none border-0 border-b border-border bg-transparent px-0 shadow-none focus-visible:border-primary focus-visible:ring-0 transition-all"
                />
                {isFocused && (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => { setNewComment(""); setIsFocused(false) }}
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={!newComment.trim() || submitting}
                      className="rounded-full bg-purple-600 hover:bg-purple-700"
                      onClick={handleSubmitComment}
                    >
                      {submitting ? 'Sending...' : 'Comment'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-xl border border-border bg-secondary/40 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex flex-1 flex-col gap-3">
                  <div>
                    <p className="text-sm font-semibold mb-1">
                      {!currentUser ? 'Sign in to comment' : 'Premium required to comment'}
                    </p>
                <p className="text-xs text-muted-foreground">
                  {!currentUser
                    ? 'You need to be logged in to leave a comment.'
                    : 'Only premium subscribers can post comments. Upgrade your plan to interact with the community.'}
                </p>
              </div>
              {currentUser && !isPremium && (
                <Button
                  asChild
                  size="sm"
                  className="w-fit rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2"
                >
                  <Link href="/subscriptions">
                    <Crown className="h-4 w-4" />
                    Upgrade to Premium
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Comments list */}
      {!isExternalVideo && (
        <div className="flex flex-col gap-5">
          {loadingComments ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-secondary" />
                  <div className="flex flex-1 flex-col gap-2 pt-1">
                    <div className="h-3 w-32 rounded bg-secondary" />
                    <div className="h-3 w-full rounded bg-secondary" />
                    <div className="h-3 w-3/4 rounded bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <p className="text-sm">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-10 w-10 shrink-0 bg-purple-600">
                <AvatarFallback className="bg-purple-600 text-white text-sm">
                  {(comment.username || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{comment.username}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                </div>
                <p className="text-sm leading-relaxed">{comment.content}</p>
                <div className="mt-1 flex items-center gap-1">
                  {/* Like button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 transition-all ${comment.userLike === "like" ? "text-purple-400" : ""}`}
                    onClick={() => handleCommentLike(comment, "like")}
                    title={!currentUser ? "Sign in to like" : "Like"}
                  >
                    <ThumbsUp
                      className={`h-4 w-4 transition-transform active:scale-125 ${
                        comment.userLike === "like" ? "fill-current text-purple-400" : ""
                      }`}
                    />
                  </Button>
                  {comment.likes > 0 && (
                    <span className="text-xs text-muted-foreground tabular-nums">{comment.likes}</span>
                  )}
                  {/* Dislike button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 transition-all ${comment.userLike === "dislike" ? "text-red-400" : ""}`}
                    onClick={() => handleCommentLike(comment, "dislike")}
                    title={!currentUser ? "Sign in to dislike" : "Dislike"}
                  >
                    <ThumbsDown
                      className={`h-4 w-4 transition-transform active:scale-125 ${
                        comment.userLike === "dislike" ? "fill-current text-red-400" : ""
                      }`}
                    />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      )}
    </div>
  )
}
