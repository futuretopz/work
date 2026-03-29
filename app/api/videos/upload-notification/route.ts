import { NextRequest, NextResponse } from 'next/server'
import { createNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const { userId, videoTitle, success } = await request.json()

    if (success) {
      await createNotification(
        userId,
        'video_uploaded',
        'Video Uploaded Successfully!',
        `Your video "${videoTitle}" has been uploaded and is now live.`,
        '/channel'
      )
    } else {
      await createNotification(
        userId,
        'video_upload_failed',
        'Video Upload Failed',
        `Failed to upload "${videoTitle}". Please try again or contact support.`,
        '/upload'
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Create video notification error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
