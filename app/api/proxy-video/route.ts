import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const videoUrl = searchParams.get('url')

  if (!videoUrl) {
    return NextResponse.json({ error: 'Missing video URL' }, { status: 400 })
  }

  try {
    // Fetch the video from external API with better headers
    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://getrichordie.lat/',
        'Origin': 'https://getrichordie.lat',
      },
      // Add timeout
      signal: AbortSignal.timeout(30000), // 30 seconds
    })

    if (!response.ok) {
      // If server returns error, just return the original URL
      // Browser will try to load it directly
      console.warn(`Failed to proxy video (${response.status}): ${videoUrl}`)
      return NextResponse.redirect(videoUrl)
    }

    // Get the video data
    const videoData = await response.arrayBuffer()

    // Return the video with proper headers
    return new NextResponse(videoData, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'video/mp4',
        'Content-Length': response.headers.get('Content-Length') || '',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error: any) {
    console.error('Error proxying video:', error.message)
    // On error, redirect to original URL as fallback
    return NextResponse.redirect(videoUrl)
  }
}
