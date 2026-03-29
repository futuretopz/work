import { NextRequest, NextResponse } from 'next/server'
import { getAllVideos } from '@/lib/video-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '30', 10)

    const categoryFilter = category && category !== 'All' ? category : undefined
    const result = await getAllVideos(categoryFilter, page, limit)

    // Filter by userId if provided (only for Supabase videos)
    if (userId) {
      result.videos = result.videos.filter(v => v.source === 'supabase' && v.user_id === userId)
      result.pagination.total = result.videos.length
      result.pagination.totalPages = Math.ceil(result.videos.length / limit)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in /api/videos/list:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
