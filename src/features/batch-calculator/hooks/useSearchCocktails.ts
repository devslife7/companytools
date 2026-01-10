import { useState, useCallback } from 'react'
import type { CocktailRecipe } from '../types'

interface UseSearchCocktailsResult {
  cocktails: CocktailRecipe[]
  loading: boolean
  error: string | null
  search: (query: string) => Promise<void>
  clear: () => void
}

export function useSearchCocktails(): UseSearchCocktailsResult {
  const [cocktails, setCocktails] = useState<CocktailRecipe[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const performSearch = useCallback(async (query: string) => {
    if (!query || query.trim() === '') {
      setCocktails([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/cocktails/search?q=${encodeURIComponent(query.trim())}`)
      
      if (!response.ok) {
        throw new Error('Failed to search cocktails')
      }

      const data = await response.json()
      setCocktails(data.cocktails || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setCocktails([])
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setCocktails([])
    setError(null)
  }, [])

  return {
    cocktails,
    loading,
    error,
    search: performSearch,
    clear,
  }
}
