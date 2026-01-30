"use client"
import React, { useState, useMemo } from "react"
import { Star, Check, X } from "lucide-react"
import type { CocktailRecipe } from "../types"

interface FavoritesMultiSelectProps {
  favoriteCocktails: CocktailRecipe[]
  selectedCocktails: CocktailRecipe[]
  onSelectionChange: (selected: CocktailRecipe[]) => void
}

export const FavoritesMultiSelect: React.FC<FavoritesMultiSelectProps> = React.memo(
  ({ favoriteCocktails, selectedCocktails, onSelectionChange }) => {
    const [isExpanded, setIsExpanded] = useState(true)

    const isSelected = (cocktail: CocktailRecipe) => {
      return selectedCocktails.some(selected => selected.name === cocktail.name)
    }

    const handleToggleCocktail = (cocktail: CocktailRecipe) => {
      if (isSelected(cocktail)) {
        // Remove cocktail
        onSelectionChange(selectedCocktails.filter(selected => selected.name !== cocktail.name))
      } else {
        // Add cocktail
        onSelectionChange([...selectedCocktails, cocktail])
      }
    }

    const handleSelectAll = () => {
      const allSelected = favoriteCocktails.every(fav => isSelected(fav))
      if (allSelected) {
        // Deselect all favorites
        const favoriteNames = new Set(favoriteCocktails.map(f => f.name))
        onSelectionChange(selectedCocktails.filter(c => !favoriteNames.has(c.name)))
      } else {
        // Select all favorites
        const favoriteNames = new Set(favoriteCocktails.map(f => f.name))
        const nonFavoriteSelected = selectedCocktails.filter(c => !favoriteNames.has(c.name))
        onSelectionChange([...nonFavoriteSelected, ...favoriteCocktails])
      }
    }

    const selectedFavoritesCount = favoriteCocktails.filter(fav => isSelected(fav)).length
    const allSelected = favoriteCocktails.length > 0 && selectedFavoritesCount === favoriteCocktails.length

    if (favoriteCocktails.length === 0) return null

    return (
      <div className="mb-6 px-0">
        <div className="bg-white border border-gray-300 rounded-xl shadow-sm">
          {/* Header */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-t-xl"
          >
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-orange-600 fill-orange-600" />
              <h2 className="text-lg font-bold text-gray-900">Special Cocktails</h2>
              {selectedFavoritesCount > 0 && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                  {selectedFavoritesCount} selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedFavoritesCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelectAll()
                  }}
                  className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                >
                  {allSelected ? "Clear All" : "Select All"}
                </button>
              )}
              <span className="text-gray-400 text-sm">
                {isExpanded ? "▼" : "▶"}
              </span>
            </div>
          </button>

          {/* Favorites Grid */}
          {isExpanded && (
            <div className="p-4 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {favoriteCocktails.map(cocktail => {
                  const selected = isSelected(cocktail)
                  return (
                    <button
                      key={cocktail.name}
                      onClick={() => handleToggleCocktail(cocktail)}
                      className={`p-4 border-2 rounded-lg transition-all duration-200 text-left relative ${
                        selected
                          ? "border-orange-500 bg-orange-50 shadow-md"
                          : "border-gray-300 bg-white hover:border-orange-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                            {cocktail.name}
                            {selected && (
                              <Check className="w-4 h-4 text-orange-600" />
                            )}
                          </h3>
                        </div>
                        {selected && (
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
)

FavoritesMultiSelect.displayName = "FavoritesMultiSelect"
