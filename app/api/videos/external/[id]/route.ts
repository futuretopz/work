import { NextRequest, NextResponse } from 'next/server'
import { getVideoById } from '@/lib/video-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const video = await getVideoById(`ext_${id}`)

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json({ video })
  } catch (error: any) {
    console.error('Error fetching external video:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
