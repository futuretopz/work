import { supabase } from './supabase'
import { externalApi, Video as ExternalVideo } from './external-api'

export interface VideoItem {
  id: string
  title: string
  user_id?: string
  created_at: string
  views: number
  category: string
  file_path: string
  thumbnail_path: string
  username?: string
  description?: string
  source: 'supabase' | 'external'
}

export interface PaginatedVideos {
  videos: VideoItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Static category mapping to avoid API calls
const CATEGORY_MAP: Record<number, string> = {
  1: 'Anal',
  2: 'Brother',
  3: 'Cum',
  4: 'Dad',
  5: 'Dick',
  6: 'Fuck',
  7: 'Girl',
  9: 'Hebe',
  10: 'Little',
  11: 'Pussy',
  12: 'Show',
  13: 'Teen',
  14: 'Boy',
}

const CATEGORY_NAME_TO_ID: Record<string, number> = {
  'anal': 1,
  'brother': 2,
  'cum': 3,
  'dad': 4,
  'dick': 5,
  'fuck': 6,
  'girl': 7,
  'hebe': 9,
  'little': 10,
  'pussy': 11,
  'show': 12,
  'teen': 13,
  'boy': 14,
}

/**
 * Fetches videos from both Supabase and external API with pagination
 */
export async function getAllVideos(
  categoryFilter?: string,
  page: number = 1,
  limit: number = 30
): Promise<PaginatedVideos> {
  const videos: VideoItem[] = []

  // Fetch from Supabase
  try {
    const query = supabase.from('videos').select('*').order('created_at', { ascending: false })
    
    if (categoryFilter) {
      query.eq('category', categoryFilter)
    }

    const { data: supabaseVideos } = await query

    if (supabaseVideos) {
      // Get usernames for Supabase videos
      const userIds = [...new Set(supabaseVideos.map((v: any) => v.user_id).filter(Boolean))]
      let profileMap: Record<string, string> = {}

      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', userIds)
        profiles?.forEach((p: any) => {
          profileMap[p.id] = p.username
        })
      }

      videos.push(
        ...supabaseVideos.map((v: any) => ({
          id: v.id,
          title: v.title,
          user_id: v.user_id,
          created_at: v.created_at,
          views: v.views || 0,
          category: v.category || 'Uncategorized',
          file_path: v.file_path,
          thumbnail_path: v.thumbnail_path,
          username: v.user_id ? profileMap[v.user_id] || 'Unknown' : 'External',
          description: v.description,
          source: 'supabase' as const,
        }))
      )
    }
  } catch (error) {
    console.error('Error fetching Supabase videos:', error)
  }

  // Fetch from external API
  try {
    // Use static category mapping instead of API call
    let categoryIdFilter: number | null = null
    if (categoryFilter) {
      categoryIdFilter = CATEGORY_NAME_TO_ID[categoryFilter.toLowerCase()] || null
    }

    // Fetch videos from API (pass category_id if filtering)
    const externalVideos = await externalApi.getVideos(1, 500, categoryIdFilter)

    if (Array.isArray(externalVideos)) {
      const mappedVideos = externalVideos.map((v: any) => {
        const normalized = externalApi.normalizeVideo(v)
        const categoryName = v.category_id ? CATEGORY_MAP[v.category_id] || `Category ${v.category_id}` : 'Uncategorized'
        
        return {
          id: `ext_${v.id}`,
          title: normalized.title,
          user_id: normalized.user_id,
          created_at: normalized.created_at || new Date().toISOString(),
          views: normalized.views || 0,
          category: categoryName,
          file_path: normalized.video_url || '',
          thumbnail_path: normalized.thumbnail_path || '/placeholder.jpg',
          username: normalized.username || 'External',
          description: normalized.description,
          source: 'external' as const,
        }
      })

      // If we're filtering by category name but API doesn't support it, filter client-side
      if (categoryFilter && !categoryIdFilter) {
        videos.push(...mappedVideos.filter(v => v.category.toLowerCase() === categoryFilter.toLowerCase()))
      } else {
        videos.push(...mappedVideos)
      }
    }
  } catch (error) {
    console.error('Error fetching external API videos:', error)
  }

  // Sort by created_at descending
  const sortedVideos = videos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Calculate pagination
  const total = sortedVideos.length
  const totalPages = Math.ceil(total / limit)
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedVideos = sortedVideos.slice(startIndex, endIndex)

  return {
    videos: paginatedVideos,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  }
}

/**
 * Get a single video by ID from either source
 */
export async function getVideoById(id: string): Promise<VideoItem | null> {
  // Check if it's an external video
  if (id.startsWith('ext_')) {
    const externalId = id.replace('ext_', '')
    try {
      const video = await externalApi.getVideoById(externalId)
      if (video) {
        const normalized = externalApi.normalizeVideo(video)
        return {
          id: `ext_${video.id}`,
          title: normalized.title,
          user_id: normalized.user_id,
          created_at: normalized.created_at || new Date().toISOString(),
          views: normalized.views || 0,
          category: normalized.category || 'Uncategorized',
          file_path: normalized.video_url || '',
          thumbnail_path: normalized.thumbnail_path || '/placeholder.jpg',
          username: normalized.username || 'External',
          description: normalized.description,
          source: 'external',
        }
      }
    } catch (error) {
      console.error('Error fetching external video:', error)
    }
  }

  // Try Supabase
  try {
    const { data: video } = await supabase.from('videos').select('*').eq('id', id).single()

    if (video) {
      let username = 'Unknown'
      if (video.user_id) {
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', video.user_id).single()
        if (profile) username = profile.username
      }

      return {
        id: video.id,
        title: video.title,
        user_id: video.user_id,
        created_at: video.created_at,
        views: video.views || 0,
        category: video.category || 'Uncategorized',
        file_path: video.file_path,
        thumbnail_path: video.thumbnail_path,
        username,
        description: video.description,
        source: 'supabase',
      }
    }
  } catch (error) {
    console.error('Error fetching Supabase video:', error)
  }

  return null
}

/**
 * Get all categories from both sources
 */
export async function getAllCategories(): Promise<string[]> {
  const categories = new Set<string>()

  // Add static categories from external API
  Object.values(CATEGORY_MAP).forEach(name => categories.add(name))

  // Get categories from Supabase videos (first page only for performance)
  try {
    const result = await getAllVideos(undefined, 1, 100)
    result.videos.forEach((v: VideoItem) => {
      if (v.category && v.source === 'supabase') {
        categories.add(v.category)
      }
    })
  } catch (error) {
    console.error('Error fetching Supabase categories:', error)
  }

  return Array.from(categories).sort()
}
