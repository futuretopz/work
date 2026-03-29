"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, X, Check, ArrowLeft, Crown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

const categories = [
  { value: "Boy", label: "Boy" },
  { value: "Girl", label: "Girl" },
  { value: "Show", label: "Show" },
  { value: "Little", label: "Little" },
  { value: "Pussy", label: "Pussy" },
  { value: "Teen", label: "Teen" },
  { value: "Dick", label: "Dick" },
  { value: "Cum", label: "Cum" },
  { value: "Anal", label: "Anal" },
  { value: "Brother", label: "Brother" },
]

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<any>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/')
      return
    }

    setUser(user)

    // Check premium status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, premium_expires_at')
      .eq('id', user.id)
      .single()

    if (profile?.is_premium) {
      // Check if expired
      if (profile.premium_expires_at) {
        const expiresAt = new Date(profile.premium_expires_at)
        setIsPremium(expiresAt > new Date())
      } else {
        setIsPremium(true)
      }
    }

    setLoading(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file)
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""))
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !title || !category || !user) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('video', selectedFile)
      formData.append('title', title)
      formData.append('description', description)
      formData.append('category', category)
      formData.append('userId', user.id)

      const response = await fetch('/api/videos/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setUploadComplete(true)
      
      // Redirect to channel after 2 seconds
      setTimeout(() => {
        router.push('/channel')
      }, 2000)

    } catch (error: any) {
      alert(error.message || 'Failed to upload video')
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (!isPremium) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <Crown className="h-16 w-16 mx-auto text-purple-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Premium Required</h1>
          <p className="text-muted-foreground mb-6">
            You need a premium subscription to upload videos
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link href="/">Go Home</Link>
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" asChild>
              <Link href="/subscriptions">Get Premium</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between bg-[#0f0f0f] px-4 border-b border-[#3f3f3f]">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">Upload Video</h1>
        </div>
        {selectedFile && !uploadComplete && (
          <Button
            onClick={handleUpload}
            disabled={!title || !category || uploading}
            className="bg-[#3ea6ff] hover:bg-[#65b8ff] text-[#0d0d0d]"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Publish'
            )}
          </Button>
        )}
      </header>

      <main className="pt-14 flex flex-col items-center justify-center min-h-[calc(100vh-56px)]">
        {!selectedFile ? (
          /* Upload Area */
          <div className="w-full max-w-2xl p-8">
            <div className="border-2 border-dashed border-[#3f3f3f] rounded-lg p-12 text-center hover:border-[#606060] transition-colors">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-[#282828] flex items-center justify-center mb-6">
                  <Upload className="h-16 w-16 text-[#aaaaaa]" />
                </div>
                <p className="mb-2 text-[15px] text-[#e5e5e5]">
                  Drag and drop video files to upload
                </p>
                <p className="mb-6 text-[13px] text-[#aaaaaa]">
                  Your videos will be private until you publish them.
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#3ea6ff] hover:bg-[#65b8ff] text-[#0d0d0d] font-medium px-4 h-9 rounded-sm"
                >
                  SELECT FILES
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        ) : uploadComplete ? (
          /* Success Message */
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="h-12 w-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Upload Complete!</h2>
            <p className="text-muted-foreground mb-4">Your video has been published successfully</p>
            <Button asChild>
              <Link href="/channel">Go to My Channel</Link>
            </Button>
          </div>
        ) : (
          /* Video Details Form */
          <div className="w-full max-w-4xl p-8">
            <div className="bg-[#282828] rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Video Details</h2>
              
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <Label htmlFor="title" className="text-sm font-medium mb-2 block">
                    Title (required)
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Add a title that describes your video"
                    className="bg-[#121212] border-[#3f3f3f]"
                    maxLength={100}
                  />
                  <p className="text-xs text-[#aaaaaa] mt-1">{title.length}/100</p>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-sm font-medium mb-2 block">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell viewers about your video"
                    className="bg-[#121212] border-[#3f3f3f] min-h-[100px]"
                    maxLength={5000}
                  />
                  <p className="text-xs text-[#aaaaaa] mt-1">{description.length}/5000</p>
                </div>

                {/* Category */}
                <div>
                  <Label htmlFor="category" className="text-sm font-medium mb-2 block">
                    Category (required)
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-[#121212] border-[#3f3f3f]">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* File Info */}
                <div className="bg-[#121212] rounded p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-[#aaaaaa]">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
