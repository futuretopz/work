"use client"

import { use, useState, useEffect } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { VideoPlayer } from "@/components/video-player"
import { VideoInfo } from "@/components/video-info"
import { CommentSection } from "@/components/comment-section"
import { VideoCard } from "@/components/video-card"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

interface WatchPageProps {
  params: Promise<{ id: string }>
}

export default function WatchPage({ params }: WatchPageProps) {
  const { id } = use(params)
  const [searchQuery, setSearchQuery] = useState("")
  const [video, setVideo] = useState<any>(null)
  const [suggestedVideos, setSuggestedVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [isPurchased, setIsPurchased] = useState(false)

  useEffect(() => {
    loadVideo()
    loadSuggestedVideos()
    loadCurrentUser()
  }, [id])

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setCurrentUser(user)

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, premium_expires_at')
      .eq('id', user.id)
      .single()

    if (profile?.is_premium) {
      if (profile.premium_expires_at) {
        const expiresAt = new Date(profile.premium_expires_at)
        setIsPremium(expiresAt > new Date())
      } else {
        setIsPremium(true)
      }
    }

    // Check for individual purchase (only for Supabase videos)
    if (!id.startsWith('ext_')) {
      const { data: purchase } = await supabase
        .from('video_purchases')
        .select('status')
        .eq('user_id', user.id)
        .eq('video_id', id)
        .eq('status', 'approved')
        .single()
      
      if (purchase) setIsPurchased(true)
    }
  }

  const loadVideo = async () => {
    setLoading(true)
    
    // Check if it's an external video
    if (id.startsWith('ext_')) {
      const response = await fetch(`/api/videos/external/${id.replace('ext_', '')}`)
      const data = await response.json()
      
      if (data.video) {
        setVideo(data.video)
      }
    } else {
      // Get video from Supabase
      const { data: videoData } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single()

      if (videoData) {
        // Get username
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', videoData.user_id)
          .single()

        setVideo({
          ...videoData,
          username: profile?.username || 'Unknown',
          source: 'supabase'
        })

        // Increment views
        await supabase
          .from('videos')
          .update({ views: (videoData.views || 0) + 1 })
          .eq('id', id)

        // Record watch history for logged-in user
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('watch_history')
            .upsert(
              { user_id: user.id, video_id: id, watched_at: new Date().toISOString() },
              { onConflict: 'user_id,video_id' }
            )
        }
      }
    }

    setLoading(false)
  }

  const loadSuggestedVideos = async () => {
    const response = await fetch('/api/videos/list')
    const data = await response.json()
    
    if (data.videos) {
      // Filter out current video and limit to 10
      const filtered = data.videos
        .filter((v: any) => v.id !== id)
        .slice(0, 10)
      setSuggestedVideos(filtered)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (!video) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Video not found</h1>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="flex items-center h-14 px-2 sm:px-0">
          <Link href="/" className="ml-2 sm:ml-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 -ml-8 sm:-ml-12">
            <Header
              onMenuClick={() => {}}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="pt-16 sm:pt-14 w-full max-w-full overflow-x-hidden">
        <div className="mx-auto grid max-w-[1800px] grid-cols-1 gap-6 p-4 sm:p-6 xl:grid-cols-[1fr_400px] w-full max-w-full">
          {/* Left column - Video and info */}
          <div className="space-y-4 w-full max-w-full overflow-hidden">
            <VideoPlayer 
              video={video} 
              isPremium={isPremium} 
              isPurchased={isPurchased}
              currentUser={currentUser} 
            />
            <VideoInfo video={video} currentUser={currentUser} />
            <CommentSection
              videoId={id}
              isPremium={isPremium}
              currentUser={currentUser}
            />
          </div>

          {/* Right column - Suggested videos */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold mb-4">Suggested</h2>
            {suggestedVideos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No suggested videos yet</p>
              </div>
            ) : (
              suggestedVideos.map((suggestedVideo) => (
                <VideoCard
                  key={suggestedVideo.id}
                  video={suggestedVideo}
                  layout="horizontal"
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
