import { useState, useEffect } from 'react'
import type { CocktailRecipe } from '../types'

interface UseCocktailsOptions {
  search?: string
  category?: string
  active?: boolean
  featured?: boolean
  liquor?: string
  enabled?: boolean
}

interface UseCocktailsResult {
  cocktails: CocktailRecipe[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCocktails(options: UseCocktailsOptions = {}): UseCocktailsResult {
  const { search, category, active = true, featured, liquor, enabled = true } = options
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

      const response = await fetch(`/api/cocktails?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.details || `HTTP ${response.status}: Failed to fetch cocktails`
        console.error('Cocktails API error:', errorMessage, errorData)
        throw new Error(errorMessage)
      }

      const data = await response.json()
      const cocktails = data.cocktails || []
      console.log(`Fetched ${cocktails.length} cocktails from database`, { filters: { search, category, active, featured, liquor } })
      setCocktails(cocktails)
    } catch (err) {
      console.error('Error fetching cocktails:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setCocktails([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCocktails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, active, featured, liquor, enabled])

  return {
    cocktails,
    loading,
    error,
    refetch: fetchCocktails,
  }
}
