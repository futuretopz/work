import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getVideoDuration(filePath: string): Promise<string> {
  try {
    // Try using ffprobe to get duration
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    )
    const seconds = Math.floor(parseFloat(stdout.trim()))
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  } catch (error) {
    // If ffprobe is not available, return default
    console.log('ffprobe not available, using default duration')
    return '0:00'
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const userId = formData.get('userId') as string

    if (!videoFile || !title || !category || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user is premium
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, premium_expires_at')
      .eq('id', userId)
      .single()

    if (!profile?.is_premium) {
      return NextResponse.json(
        { error: 'Premium subscription required to upload videos' },
        { status: 403 }
      )
    }

    // Check if premium is expired
    if (profile.premium_expires_at) {
      const expiresAt = new Date(profile.premium_expires_at)
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Premium subscription expired' },
          { status: 403 }
        )
      }
    }

    // Create category directory if it doesn't exist
    const categoryDir = join(process.cwd(), 'public', 'videos', category)
    if (!existsSync(categoryDir)) {
      await mkdir(categoryDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = videoFile.name.split('.').pop()
    const fileName = `${timestamp}-${userId.slice(0, 8)}.${fileExtension}`
    const filePath = join(categoryDir, fileName)
    const publicPath = `/videos/${category}/${fileName}`

    // Save video file
    const bytes = await videoFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Get video duration
    const duration = await getVideoDuration(filePath)

    // Save to database
    const { data: video, error: dbError } = await supabase
      .from('videos')
      .insert({
        user_id: userId,
        title,
        description: description || null,
        category,
        file_path: publicPath,
        duration,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save video metadata' },
        { status: 500 }
      )
    }

    // Create notification
    await fetch(`${request.nextUrl.origin}/api/videos/upload-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        videoTitle: title,
        success: true
      })
    })

    return NextResponse.json({
      success: true,
      video
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
