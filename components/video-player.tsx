"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize, 
  SkipForward,
  Lock,
  Crown,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface VideoPlayerProps {
  video: any
  isPremium?: boolean
  isPurchased?: boolean
  currentUser?: any | null
}

export function VideoPlayer({ video, isPremium = false, isPurchased = false, currentUser = null }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [volume, setVolume] = useState(100)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Free users: show paywall overlay (do not play)
  const isBlocked = !isPremium && !isPurchased && (currentUser?.id !== video.user_id) && !video.is_free; // Admin check happens in parent usually, or we can add it here if profile is passed

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const updateTime = () => {
      setCurrentTime(videoElement.currentTime)
      setProgress((videoElement.currentTime / videoElement.duration) * 100)
    }

    const updateDuration = () => {
      setDuration(videoElement.duration)
    }

    videoElement.addEventListener('timeupdate', updateTime)
    videoElement.addEventListener('loadedmetadata', updateDuration)

    return () => {
      videoElement.removeEventListener('timeupdate', updateTime)
      videoElement.removeEventListener('loadedmetadata', updateDuration)
    }
  }, [])

  const togglePlay = () => {
    if (isBlocked) return
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleProgressChange = (value: number[]) => {
    if (isBlocked || !videoRef.current) return
    const newTime = (value[0] / 100) * duration
    videoRef.current.currentTime = newTime
    setProgress(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    if (!videoRef.current) return
    videoRef.current.volume = value[0] / 100
    setVolume(value[0])
    setIsMuted(value[0] === 0)
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const toggleFullscreen = () => {
    if (isBlocked || !videoRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      videoRef.current.requestFullscreen()
    }
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div 
      className="group relative aspect-video w-full overflow-hidden rounded-xl bg-black"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(isPlaying ? false : true)}
    >
      {/* Video element — always rendered for thumbnail */}
      <video
        ref={videoRef}
        src={video.file_path}
        className={cn("h-full w-full object-contain", isBlocked && "blur-sm brightness-50")}
        onClick={togglePlay}
      />

      {/* ── PAYWALL OVERLAY (free users) ── */}
      {isBlocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center z-20">
          {/* Glow orb in background */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-64 w-64 rounded-full bg-purple-600/20 blur-3xl" />
          </div>

          {/* Lock icon with ring */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-purple-500/60 bg-black/70 backdrop-blur-sm">
            <div className="absolute inset-0 rounded-full bg-purple-600/10" />
            <Lock className="h-9 w-9 text-purple-400" />
          </div>

          {/* Text */}
          <div className="relative z-10 flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">
              Premium Content
            </h2>
            <p className="max-w-xs text-sm text-white/70 leading-relaxed">
              {!currentUser
                ? "Sign in to watch this video and access all platform features."
                : "This content is exclusive to premium subscribers. Upgrade your plan to watch this video."}
            </p>
          </div>

          {/* CTA buttons */}
          <div className="relative z-10 flex flex-col items-center gap-3 sm:flex-row">
            {!currentUser ? (
              <>
                <Button
                  asChild
                  className="rounded-full bg-white px-6 text-black font-semibold hover:bg-white/90"
                >
                  <Link href="/">Sign In</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-white/30 bg-white/10 px-6 text-white backdrop-blur-sm hover:bg-white/20"
                >
                  <Link href="/subscriptions">View Plans</Link>
                </Button>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 font-semibold text-white shadow-lg shadow-purple-900/50 hover:from-purple-700 hover:to-pink-700 gap-2"
                >
                  <Link href="/subscriptions">
                    <Crown className="h-5 w-5" />
                    Premium (All Videos)
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Features hint */}
          <div className="relative z-10 flex items-center gap-2 text-xs text-white/40">
            <Sparkles className="h-3 w-3" />
            <span>Unlimited videos · HD quality · Comment & interact</span>
          </div>
        </div>
      )}

      {/* Play button overlay — only for premium */}
      {!isBlocked && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <Button
              size="icon"
              className="h-16 w-16 rounded-full bg-black/60 hover:bg-black/80"
              onClick={togglePlay}
            >
              <Play className="h-8 w-8 fill-white text-white" />
            </Button>
          </div>
        </div>
      )}

      {/* Controls overlay — only for premium */}
      {!isBlocked && (
        <div 
          className={cn(
            "absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity pointer-events-none",
            showControls ? "opacity-100" : "opacity-0"
          )}
        >
          {/* Progress bar */}
          <div className="px-3 pb-1 pointer-events-auto">
            <Slider
              value={[progress]}
              onValueChange={handleProgressChange}
              max={100}
              step={0.1}
              className="cursor-pointer"
            />
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between px-3 pb-3 pointer-events-auto">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white hover:bg-white/20"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime += 10
                  }
                }}
              >
                <SkipForward className="h-5 w-5" />
              </Button>
              <div className="group/volume flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <div className="w-0 overflow-hidden transition-all group-hover/volume:w-20">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    onValueChange={handleVolumeChange}
                    max={100}
                    className="w-20"
                  />
                </div>
              </div>
              <span className="ml-2 text-sm text-white">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                <Maximize className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
