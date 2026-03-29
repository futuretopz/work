"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { VideoCard } from "@/components/video-card"
import { Search, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"

export default function HistoryPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [historySearch, setHistorySearch] = useState("")
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Fetch last 5 watch history entries for this user
    const { data: history } = await supabase
      .from('watch_history')
      .select('video_id, watched_at')
      .eq('user_id', user.id)
      .order('watched_at', { ascending: false })
      .limit(5)

    if (!history || history.length === 0) { setLoading(false); return }

    // Fetch the actual video data
    const videoIds = history.map((h: any) => h.video_id)
    const { data: videoData } = await supabase
      .from('videos')
      .select('*')
      .in('id', videoIds)

    if (!videoData) { setLoading(false); return }

    // Fetch usernames
    const userIds = [...new Set(videoData.map((v: any) => v.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds)

    const profileMap: Record<string, string> = {}
    profiles?.forEach((p: any) => { profileMap[p.id] = p.username })

    // Keep the watch_history order
    const ordered = history
      .map((h: any) => {
        const video = videoData.find((v: any) => v.id === h.video_id)
        if (!video) return null
        return { ...video, username: profileMap[video.user_id] || 'Unknown', watched_at: h.watched_at }
      })
      .filter(Boolean)

    setVideos(ordered)
    setLoading(false)
  }

  const filtered = videos.filter((v) =>
    v.title?.toLowerCase().includes(historySearch.toLowerCase())
  )

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
          <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Watch History</h1>
              <p className="text-muted-foreground">Your last 5 watched videos</p>
            </div>

            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search watch history"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Videos */}
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Clock className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No history yet</h3>
                <p className="text-sm text-muted-foreground">
                  Videos you watch will appear here
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
