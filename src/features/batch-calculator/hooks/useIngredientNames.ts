import { useState, useEffect } from "react"

export type IngredientSuggestion = { name: string; orderUnit: string | null }

export function useIngredientNames(): IngredientSuggestion[] {
  const [suggestions, setSuggestions] = useState<IngredientSuggestion[]>([])
  useEffect(() => {
    fetch("/api/ingredients")
      .then(r => r.json())
      .then(data => setSuggestions(data.ingredients ?? []))
      .catch(() => {}) // autocomplete is non-critical, fail silently
  }, [])
  return suggestions
}
