import { useState, useEffect } from 'react'
import type { CocktailRecipe } from '../types'

interface UseCocktailsOptions {
  search?: string
  category?: string
  active?: boolean
  featured?: boolean
  enabled?: boolean
}

interface UseCocktailsResult {
  cocktails: CocktailRecipe[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCocktails(options: UseCocktailsOptions = {}): UseCocktailsResult {
  const { search, category, active = true, featured, enabled = true } = options
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

      const response = await fetch(`/api/cocktails?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch cocktails')
      }

      const data = await response.json()
      setCocktails(data.cocktails || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setCocktails([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCocktails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, active, featured, enabled])

  return {
    cocktails,
    loading,
    error,
    refetch: fetchCocktails,
  }
}
