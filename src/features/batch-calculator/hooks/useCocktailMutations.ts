import { useState, useCallback } from 'react'
import type { CocktailRecipe } from '../types'

interface UseCreateCocktailResult {
  createCocktail: (data: Omit<CocktailRecipe, 'id'>) => Promise<CocktailRecipe | null>
  loading: boolean
  error: string | null
}

interface UseUpdateCocktailResult {
  updateCocktail: (id: number, data: Partial<CocktailRecipe>) => Promise<CocktailRecipe | null>
  loading: boolean
  error: string | null
}

interface UseDeleteCocktailResult {
  deleteCocktail: (id: number, password: string) => Promise<boolean>
  loading: boolean
  error: string | null
}

/**
 * Hook for creating a new cocktail recipe
 */
export function useCreateCocktail(): UseCreateCocktailResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCocktail = useCallback(async (data: Omit<CocktailRecipe, 'id'>): Promise<CocktailRecipe | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/cocktails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create cocktail' }))
        throw new Error(errorData.error || 'Failed to create cocktail')
      }

      const cocktail = await response.json()
      return cocktail
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while creating the cocktail'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { createCocktail, loading, error }
}

/**
 * Hook for updating an existing cocktail recipe
 */
export function useUpdateCocktail(): UseUpdateCocktailResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateCocktail = useCallback(async (id: number, data: Partial<CocktailRecipe>): Promise<CocktailRecipe | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/cocktails/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update cocktail' }))
        throw new Error(errorData.error || 'Failed to update cocktail')
      }

      const cocktail = await response.json()
      return cocktail
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while updating the cocktail'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { updateCocktail, loading, error }
}

/**
 * Hook for deleting a cocktail recipe
 */
export function useDeleteCocktail(): UseDeleteCocktailResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteCocktail = useCallback(async (id: number, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/cocktails/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete cocktail' }))
        throw new Error(errorData.error || 'Failed to delete cocktail')
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while deleting the cocktail'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { deleteCocktail, loading, error }
}
