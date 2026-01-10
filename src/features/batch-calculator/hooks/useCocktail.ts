import { useState, useEffect } from 'react'
import type { CocktailRecipe } from '../types'

interface UseCocktailResult {
  cocktail: CocktailRecipe | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCocktail(id: number | null, enabled: boolean = true): UseCocktailResult {
  const [cocktail, setCocktail] = useState<CocktailRecipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCocktail = async () => {
    if (!enabled || id === null) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/cocktails/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Cocktail not found')
        }
        throw new Error('Failed to fetch cocktail')
      }

      const data = await response.json()
      setCocktail(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setCocktail(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCocktail()
  }, [id, enabled])

  return {
    cocktail,
    loading,
    error,
    refetch: fetchCocktail,
  }
}
