import axios, { AxiosInstance, AxiosError } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://getrichordie.lat/api'

interface Video {
  id: string | number
  title: string
  video_url?: string
  url?: string
  file_path?: string
  thumbnail_path?: string
  thumbnail_url?: string
  category_id?: string | number
  category?: string
  views?: number
  created_at?: string
  user_id?: string
  username?: string
  description?: string
}

interface Category {
  id: string | number
  name: string
  slug?: string
}

interface ApiResponse<T> {
  data: T
  total?: number
  page?: number
  limit?: number
}

// Cache for categories to avoid repeated API calls
let categoriesCache: Category[] | null = null
let categoriesCacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

class ExternalApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // Increased to 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  private handleError(error: AxiosError): Error {
    if (error.response) {
      return new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
    } else if (error.request) {
      return new Error('API Error: No response received')
    } else {
      return new Error(`API Error: ${error.message}`)
    }
  }

  async getVideos(page = 1, limit = 100, categoryId: string | number | null = null): Promise<Video[]> {
    try {
      const params: any = { page, limit }
      if (categoryId) params.category_id = categoryId

      const response = await this.client.get('/videos', { params })
      
      // API returns { success: true, videos: [...], pagination: {...} }
      if (response.data.success && Array.isArray(response.data.videos)) {
        return response.data.videos
      }
      
      return []
    } catch (error) {
      console.error('Error fetching videos from external API:', error)
      return []
    }
  }

  async getVideoById(id: string | number): Promise<Video | null> {
    try {
      const response = await this.client.get(`/videos/${id}`)
      
      // Check if response has the video data
      if (response.data.success && response.data.video) {
        return response.data.video
      } else if (response.data.id) {
        return response.data
      }
      
      return null
    } catch (error) {
      console.error('Error fetching video by ID:', error)
      return null
    }
  }

  async getCategories(): Promise<Category[]> {
    // Return cached categories if available and not expired
    const now = Date.now()
    if (categoriesCache && (now - categoriesCacheTime) < CACHE_DURATION) {
      return categoriesCache
    }

    try {
      const response = await this.client.get('/categories')
      
      // Check if response has categories array
      if (response.data.success && Array.isArray(response.data.categories)) {
        categoriesCache = response.data.categories
        categoriesCacheTime = now
        return response.data.categories
      } else if (Array.isArray(response.data)) {
        categoriesCache = response.data
        categoriesCacheTime = now
        return response.data
      }
      
      return []
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Return cached categories even if expired, better than nothing
      if (categoriesCache) {
        return categoriesCache
      }
      return []
    }
  }

  normalizeVideo(video: any): Video {
    // Map API fields to our Video interface
    const normalized: Video = {
      id: video.id,
      title: video.title || 'Untitled',
      description: video.description,
      user_id: video.user_id ? String(video.user_id) : undefined,
      username: video.author_username || 'Unknown',
      created_at: video.created_at,
      views: video.views_count || 0,
      category_id: video.category_id,
      category: video.category_name || `Category ${video.category_id || ''}`,
    }

    // Normalize video URL
    normalized.video_url = video.file_path || video.url || video.video_url
    
    // Normalize thumbnail URL
    normalized.thumbnail_path = video.thumbnail_url || video.thumbnail_path || '/placeholder.jpg'

    return normalized
  }
}

export const externalApi = new ExternalApiClient()
export type { Video, Category, ApiResponse }
