"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Settings, 
  Play,
  User,
  Loader2,
  PlaySquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { VideoCard } from "@/components/video-card"

export default function ChannelPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [username, setUsername] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChannel()
  }, [])

  const loadChannel = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    setUserId(user.id)

    // Load profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    if (profile) setUsername(profile.username)

    // Load user's own videos
    const { data: userVideos } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setVideos((userVideos || []).map((v: any) => ({ ...v, username: profile?.username || 'Unknown' })))
    setLoading(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`
    return `${views} views`
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <Sidebar isOpen={sidebarOpen} />

      <main className="pt-14 md:pl-64">
        {/* Channel Banner */}
        <div className="relative h-32 sm:h-48 md:h-56 lg:h-64 bg-gradient-to-r from-purple-900 via-purple-700 to-pink-600" />

        {/* Channel Info */}
        <div className="px-4 md:px-8 lg:px-16 py-4">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {/* Avatar */}
            <div className="relative -mt-12 md:-mt-8">
              <div className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-purple-600 flex items-center justify-center text-white text-4xl md:text-5xl font-bold border-4 border-background">
                {username ? username[0].toUpperCase() : <User className="h-12 w-12" />}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">{username || "My Channel"}</h1>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span>@{username || "user"}</span>
                    <span>•</span>
                    <span>{videos.length} {videos.length === 1 ? 'video' : 'videos'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" className="gap-2" asChild>
                    <Link href="/upload">
                      <Settings className="h-4 w-4" />
                      Upload video
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 md:px-8 lg:px-16 border-b border-border">
          <Tabs defaultValue="home" className="w-full">
            <TabsList className="bg-transparent h-12 p-0 gap-1">
              <TabsTrigger 
                value="home" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-4"
              >
                Home
              </TabsTrigger>
              <TabsTrigger 
                value="videos" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-4"
              >
                Videos
              </TabsTrigger>
            </TabsList>

            {/* Home tab — latest 6 */}
            <TabsContent value="home" className="py-6">
              {videos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <PlaySquare className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No videos yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Upload your first video to get started</p>
                  <Button asChild className="bg-purple-600 hover:bg-purple-700">
                    <Link href="/upload">Upload Video</Link>
                  </Button>
                </div>
              ) : (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Latest videos</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {videos.slice(0, 6).map((video) => (
                      <VideoCard key={video.id} video={video} />
                    ))}
                  </div>
                </section>
              )}
            </TabsContent>

            {/* Videos tab — all */}
            <TabsContent value="videos" className="py-6">
              {videos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <PlaySquare className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No videos yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Upload your first video to get started</p>
                  <Button asChild className="bg-purple-600 hover:bg-purple-700">
                    <Link href="/upload">Upload Video</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {videos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
