"use client"

import { VideoCard } from "@/components/video-card"
import type { Video } from "@/lib/data"

interface VideoGridProps {
  videos: Video[]
}

export function VideoGrid({ videos }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 text-6xl">🎬</div>
        <h3 className="text-lg font-medium">No videos found</h3>
        <p className="text-sm text-muted-foreground">
          Try searching for another term or category
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  )
}
