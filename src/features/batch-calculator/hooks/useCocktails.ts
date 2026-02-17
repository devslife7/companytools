import { useState, useEffect } from 'react'
import type { CocktailRecipe } from '../types'

interface UseCocktailsOptions {
  search?: string
  category?: string
  active?: boolean
  featured?: boolean
  liquor?: string
  season?: string
  enabled?: boolean
}

interface UseCocktailsResult {
  cocktails: CocktailRecipe[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCocktails(options: UseCocktailsOptions = {}): UseCocktailsResult {
  const { search, category, active = true, featured, liquor, season, enabled = true } = options
  const [cocktails, setCocktails] = useState<CocktailRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCocktails = async () => {
    if (!enabled) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (category) params.append('category', category)
      if (active !== undefined) params.append('active', String(active))
      if (featured !== undefined) params.append('featured', String(featured))
      if (liquor) params.append('liquor', liquor)
      if (season) params.append('season', season)

      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(`/api/cocktails?${params.toString()}`, {
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.details || `HTTP ${response.status}: Failed to fetch cocktails`
        console.error('Cocktails API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          errorType: errorData.errorType,
          details: errorData.details,
        })
        throw new Error(errorMessage)
      }

      const data = await response.json()
      const cocktails = data.cocktails || []
      
      // Only log in development to avoid cluttering production logs
      if (process.env.NODE_ENV === 'development') {
        console.log(`Fetched ${cocktails.length} cocktails from database`, { filters: { search, category, active, featured, liquor, season } })
      }
      
      setCocktails(cocktails)
    } catch (err) {
      console.error('Error fetching cocktails:', err)
      
      // Provide more specific error messages
      let errorMessage = 'An error occurred while fetching cocktails'
      if (err instanceof Error) {
        if (err.name === 'AbortError' || err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.'
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          errorMessage = 'Network error. Please check your connection.'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      setCocktails([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCocktails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, active, featured, liquor, season, enabled])

  return {
    cocktails,
    loading,
    error,
    refetch: fetchCocktails,
  }
}
